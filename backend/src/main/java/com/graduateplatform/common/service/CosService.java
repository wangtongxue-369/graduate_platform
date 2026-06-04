package com.graduateplatform.common.service;

import com.graduateplatform.common.config.CosProperties;
import com.graduateplatform.common.exception.BusinessException;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.exception.CosServiceException;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.GetObjectRequest;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.region.Region;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Slf4j
@Service
public class CosService {

    private final CosProperties cosProperties;
    private COSClient cosClient;

    public CosService(CosProperties cosProperties) {
        this.cosProperties = cosProperties;
    }

    @PostConstruct
    public void init() {
        COSCredentials credentials = new BasicCOSCredentials(cosProperties.getSecretId(), cosProperties.getSecretKey());
        ClientConfig clientConfig = new ClientConfig(new Region(cosProperties.getRegion()));
        this.cosClient = new COSClient(credentials, clientConfig);
        log.info("COS client initialized with bucket: {}, region: {}", cosProperties.getBucket(), cosProperties.getRegion());
    }

    public String uploadFile(InputStream inputStream, long fileSize, String cosKey, String contentType) {
        ensureCosCredentialsConfigured();

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(fileSize);
        metadata.setContentType(contentType);
        PutObjectRequest putObjectRequest = new PutObjectRequest(cosProperties.getBucket(), cosKey, inputStream, metadata);
        try {
            cosClient.putObject(putObjectRequest);
            log.info("File uploaded to COS: {}", cosKey);
            return cosProperties.getBaseUrl() + "/" + cosKey;
        } catch (CosServiceException e) {
            log.error("Failed to upload file to COS: {}", cosKey, e);
            throw mapCosServiceException("文件上传失败", e);
        }
    }

    public String getDownloadUrl(String cosKey) {
        GetObjectRequest getObjectRequest = new GetObjectRequest(cosProperties.getBucket(), cosKey);
        return cosClient.getObjectUrl(getObjectRequest).toString();
    }

    public COSObject getObject(String cosKey) {
        ensureCosCredentialsConfigured();
        GetObjectRequest getObjectRequest = new GetObjectRequest(cosProperties.getBucket(), cosKey);
        try {
            return cosClient.getObject(getObjectRequest);
        } catch (CosServiceException e) {
            log.error("Failed to download file from COS: {}", cosKey, e);
            throw mapCosServiceException("文件下载失败", e);
        }
    }

    public void deleteFile(String cosKey) {
        try {
            cosClient.deleteObject(cosProperties.getBucket(), cosKey);
            log.info("File deleted from COS: {}", cosKey);
        } catch (CosServiceException e) {
            log.error("Failed to delete file from COS: {}", cosKey, e);
            throw new RuntimeException("文件删除失败: " + e.getMessage());
        }
    }

    public COSClient getCosClient() {
        return cosClient;
    }

    public String getBucket() {
        return cosProperties.getBucket();
    }

    private void ensureCosCredentialsConfigured() {
        String secretId = trimToEmpty(cosProperties.getSecretId());
        String secretKey = trimToEmpty(cosProperties.getSecretKey());
        if (secretId.isEmpty() || secretKey.isEmpty()) {
            throw new BusinessException("文件服务未配置，请联系管理员设置 COS 凭证");
        }
        if (secretId.startsWith("YOUR_") || secretKey.startsWith("YOUR_")) {
            throw new BusinessException("文件服务配置错误：COS 凭证仍为示例值，请联系管理员更新");
        }
        if (!secretId.startsWith("AKID")) {
            throw new BusinessException("文件服务配置错误：COS SecretId 格式无效，请联系管理员更新");
        }
    }

    private RuntimeException mapCosServiceException(String action, CosServiceException e) {
        String code = trimToEmpty(e.getErrorCode());
        if ("InvalidAccessKeyId".equals(code)) {
            return new BusinessException("文件服务配置错误：COS SecretId 无效，请联系管理员更新");
        }
        if ("SignatureDoesNotMatch".equals(code)) {
            return new BusinessException("文件服务配置错误：COS 密钥不匹配，请联系管理员更新");
        }
        if ("AccessDenied".equals(code)) {
            return new BusinessException("文件服务访问被拒绝：请检查 COS 权限配置");
        }
        return new BusinessException(action + "，请稍后重试");
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
