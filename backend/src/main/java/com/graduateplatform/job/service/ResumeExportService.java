package com.graduateplatform.job.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.job.entity.ResumeProfile;
import com.graduateplatform.job.repository.ResumeProfileRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ResumeExportService {
    private static final DateTimeFormatter FILE_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final UserRepository userRepository;
    private final ResumeProfileRepository resumeRepository;

    public ResumeExportService(UserRepository userRepository, ResumeProfileRepository resumeRepository) {
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
    }

    @Transactional(readOnly = true)
    public ExportedResume exportResume(Long userId, String format) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        ResumeProfile resume = resumeRepository.findByUserId(userId)
            .orElseGet(() -> ResumeProfile.builder().user(user).templateType("default").build());
        String normalizedFormat = normalizeFormat(format);
        try {
            byte[] content = "pdf".equals(normalizedFormat)
                ? buildPdf(user, resume)
                : buildDocx(user, resume);
            return new ExportedResume(
                content,
                buildFileName(user, normalizedFormat),
                "pdf".equals(normalizedFormat)
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );
        } catch (IOException e) {
            throw new BusinessException("简历导出失败，请稍后重试");
        }
    }

    private String normalizeFormat(String format) {
        String value = format == null ? "docx" : format.trim().toLowerCase(Locale.ROOT);
        if ("word".equals(value)) return "docx";
        if ("docx".equals(value) || "pdf".equals(value)) return value;
        throw new BusinessException("导出格式仅支持 Word 或 PDF");
    }

    private byte[] buildDocx(User user, ResumeProfile resume) throws IOException {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFParagraph title = document.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = title.createRun();
            titleRun.setText(displayName(user));
            titleRun.setBold(true);
            titleRun.setFontFamily("Microsoft YaHei");
            titleRun.setFontSize(18);

            String targetLine = joinNonBlank(" | ", resume.getTargetRole(), resume.getExpectedCities(), resume.getExpectedSalary());
            if (!targetLine.isBlank()) {
                XWPFParagraph subtitle = document.createParagraph();
                subtitle.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun subtitleRun = subtitle.createRun();
                subtitleRun.setText(targetLine);
                subtitleRun.setFontFamily("Microsoft YaHei");
                subtitleRun.setFontSize(10);
            }

            addDocxSection(document, "基本信息", resume.getBaseInfo(), fallbackContact(user));
            addDocxSection(document, "求职意向", joinNonBlank("\n",
                labeled("目标岗位", resume.getTargetRole()),
                labeled("期望城市", resume.getExpectedCities()),
                labeled("期望行业", resume.getExpectedIndustries()),
                labeled("期望薪资", resume.getExpectedSalary())));
            addDocxSection(document, "教育经历", resume.getEducation(), joinNonBlank(" / ", resume.getEducationLevel(), resume.getMajor()));
            addDocxSection(document, "项目经历", resume.getProjects(), resume.getProjectKeywords());
            addDocxSection(document, "实习经历", resume.getInternships(), resume.getInternshipKeywords());
            addDocxSection(document, "技能证书", resume.getSkills(), joinNonBlank("\n", resume.getSkillTags(), resume.getCertificates()));
            addDocxSection(document, "作品链接", resume.getPortfolioUrl());
            addDocxSection(document, "自我评价", resume.getSelfEvaluation());

            document.write(out);
            return out.toByteArray();
        }
    }

    private void addDocxSection(XWPFDocument document, String title, String... values) {
        String content = firstNonBlank(values);
        if (content.isBlank()) return;
        XWPFParagraph heading = document.createParagraph();
        heading.setSpacingBefore(180);
        XWPFRun headingRun = heading.createRun();
        headingRun.setText(title);
        headingRun.setBold(true);
        headingRun.setFontFamily("Microsoft YaHei");
        headingRun.setFontSize(12);

        for (String line : splitLines(content)) {
            XWPFParagraph paragraph = document.createParagraph();
            paragraph.setSpacingAfter(60);
            XWPFRun run = paragraph.createRun();
            run.setText(line);
            run.setFontFamily("Microsoft YaHei");
            run.setFontSize(10);
        }
    }

    private byte[] buildPdf(User user, ResumeProfile resume) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDFont font = loadPdfFont(document);
            PdfWriter writer = new PdfWriter(document, font);
            writer.writeTitle(displayName(user));
            String targetLine = joinNonBlank(" | ", resume.getTargetRole(), resume.getExpectedCities(), resume.getExpectedSalary());
            if (!targetLine.isBlank()) writer.writeCentered(targetLine, 10, 16);
            writer.writeSection("基本信息", firstNonBlank(resume.getBaseInfo(), fallbackContact(user)));
            writer.writeSection("求职意向", joinNonBlank("\n",
                labeled("目标岗位", resume.getTargetRole()),
                labeled("期望城市", resume.getExpectedCities()),
                labeled("期望行业", resume.getExpectedIndustries()),
                labeled("期望薪资", resume.getExpectedSalary())));
            writer.writeSection("教育经历", firstNonBlank(resume.getEducation(), joinNonBlank(" / ", resume.getEducationLevel(), resume.getMajor())));
            writer.writeSection("项目经历", firstNonBlank(resume.getProjects(), resume.getProjectKeywords()));
            writer.writeSection("实习经历", firstNonBlank(resume.getInternships(), resume.getInternshipKeywords()));
            writer.writeSection("技能证书", firstNonBlank(resume.getSkills(), joinNonBlank("\n", resume.getSkillTags(), resume.getCertificates())));
            writer.writeSection("作品链接", resume.getPortfolioUrl());
            writer.writeSection("自我评价", resume.getSelfEvaluation());
            writer.close();
            document.save(out);
            return out.toByteArray();
        }
    }

    private PDFont loadPdfFont(PDDocument document) throws IOException {
        for (String path : List.of(
            "C:/Windows/Fonts/msyh.ttf",
            "C:/Windows/Fonts/simhei.ttf",
            "/mnt/c/Windows/Fonts/msyh.ttf",
            "/mnt/c/Windows/Fonts/simhei.ttf",
            "/usr/share/fonts/truetype/wqy/wqy-microhei.ttf",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttf",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        )) {
            File file = new File(path);
            if (file.isFile()) return PDType0Font.load(document, file);
        }
        return PDType1Font.HELVETICA;
    }

    private String buildFileName(User user, String format) {
        return sanitizeFileName(displayName(user)) + "-online-resume-" + FILE_TIME.format(LocalDateTime.now()) + "." + format;
    }

    private String displayName(User user) {
        return firstNonBlank(user.getName(), user.getUsername(), "在线简历");
    }

    private String fallbackContact(User user) {
        return joinNonBlank("\n",
            labeled("姓名", user.getName()),
            labeled("邮箱", user.getEmail()),
            labeled("学校", user.getSchool()),
            labeled("专业", user.getMajor()),
            labeled("年级", user.getGrade()));
    }

    private String labeled(String label, String value) {
        return hasText(value) ? label + "：" + value.trim() : "";
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (hasText(value)) return value.trim();
        }
        return "";
    }

    private String joinNonBlank(String delimiter, String... values) {
        List<String> parts = new ArrayList<>();
        if (values != null) {
            for (String value : values) {
                if (hasText(value)) parts.add(value.trim());
            }
        }
        return String.join(delimiter, parts);
    }

    private List<String> splitLines(String content) {
        return content.lines()
            .map(String::trim)
            .filter(line -> !line.isBlank())
            .toList();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String sanitizeFileName(String value) {
        String sanitized = value == null ? "resume" : value.replaceAll("[\\\\/:*?\"<>|\\s]+", "-");
        return sanitized.isBlank() ? "resume" : sanitized;
    }

    public record ExportedResume(byte[] content, String fileName, String contentType) {}

    private static class PdfWriter {
        private static final float MARGIN = 56f;
        private static final float BOTTOM = 56f;
        private static final float LEADING = 16f;

        private final PDDocument document;
        private final PDFont font;
        private PDPage page;
        private PDPageContentStream stream;
        private float y;

        PdfWriter(PDDocument document, PDFont font) throws IOException {
            this.document = document;
            this.font = font;
            newPage();
        }

        void writeTitle(String text) throws IOException {
            writeCentered(text, 18, 24);
        }

        void writeCentered(String text, int size, int after) throws IOException {
            ensureSpace(LEADING + after);
            float width = font.getStringWidth(safePdfText(text)) / 1000 * size;
            float x = (page.getMediaBox().getWidth() - width) / 2;
            writeAt(safePdfText(text), x, y, size);
            y -= after;
        }

        void writeSection(String title, String content) throws IOException {
            if (content == null || content.trim().isEmpty()) return;
            ensureSpace(44);
            y -= 8;
            writeAt(safePdfText(title), MARGIN, y, 12);
            y -= LEADING;
            for (String sourceLine : content.lines().map(String::trim).filter(line -> !line.isBlank()).toList()) {
                for (String line : wrap(sourceLine, 72)) {
                    ensureSpace(LEADING);
                    writeAt(safePdfText(line), MARGIN, y, 10);
                    y -= LEADING;
                }
            }
        }

        void close() throws IOException {
            if (stream != null) stream.close();
        }

        private void newPage() throws IOException {
            if (stream != null) stream.close();
            page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        private void ensureSpace(float height) throws IOException {
            if (y - height < BOTTOM) newPage();
        }

        private void writeAt(String text, float x, float baseline, int size) throws IOException {
            stream.beginText();
            stream.setFont(font, size);
            stream.newLineAtOffset(x, baseline);
            stream.showText(text);
            stream.endText();
        }

        private List<String> wrap(String text, int maxChars) {
            List<String> lines = new ArrayList<>();
            String remaining = text;
            while (remaining.length() > maxChars) {
                int split = Math.max(1, remaining.lastIndexOf(' ', maxChars));
                if (split < maxChars / 2) split = maxChars;
                lines.add(remaining.substring(0, split).trim());
                remaining = remaining.substring(split).trim();
            }
            if (!remaining.isBlank()) lines.add(remaining);
            return lines;
        }

        private String safePdfText(String text) {
            return text == null ? "" : text.replace("\r", " ").replace("\n", " ");
        }
    }
}
