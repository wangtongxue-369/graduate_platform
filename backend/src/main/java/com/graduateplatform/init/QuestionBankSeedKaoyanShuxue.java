package com.graduateplatform.init;

import com.graduateplatform.init.QuestionBankSeed.SeedBank;
import com.graduateplatform.init.QuestionBankSeed.SeedQuestion;

import java.util.List;

/** 考研数学 — 高数、线代、概率论，30 题。 */
final class QuestionBankSeedKaoyanShuxue {
    private QuestionBankSeedKaoyanShuxue() {}

    static final SeedBank BANK = new SeedBank(
        "考研数学题库", "kaoyan", "数学",
        "高等数学、线性代数、概率论与数理统计，30 题",
        "hard",
        List.of(
            // ===== 高等数学（极限、导数、积分、多元、级数、微分方程） =====
            new SeedQuestion(
                "lim(x→0) sin(x)/x = ",
                "[\"A.0\",\"B.1\",\"C.无穷大\",\"D.不存在\"]",
                "B", "重要极限：lim(x→0) sin(x)/x = 1。",
                "高等数学", "single", "极限", null),
            new SeedQuestion(
                "f(x) = x² 的导数是",
                "[\"A.x\",\"B.2x\",\"C.x²\",\"D.2\"]",
                "B", "幂函数求导：(x^n)' = n·x^(n-1)，故 (x²)' = 2x。",
                "高等数学", "single", "导数", null),
            new SeedQuestion(
                "∫ 2x dx = ",
                "[\"A.x²+C\",\"B.2x²+C\",\"C.x²/2+C\",\"D.2+C\"]",
                "A", "幂函数积分：∫ x^n dx = x^(n+1)/(n+1)+C，∫ 2x dx = x²+C。",
                "高等数学", "single", "不定积分", null),
            new SeedQuestion(
                "lim(x→∞) (1+1/x)^x = ",
                "[\"A.1\",\"B.e\",\"C.0\",\"D.无穷大\"]",
                "B", "重要极限：lim(x→∞) (1+1/x)^x = e。",
                "高等数学", "single", "极限", null),
            new SeedQuestion(
                "函数 f(x)=ln(x) 的定义域是",
                "[\"A.x≥0\",\"B.x>0\",\"C.x≠0\",\"D.全体实数\"]",
                "B", "对数函数 ln(x) 要求 x>0。",
                "高等数学", "single", "函数与定义域", null),
            new SeedQuestion(
                "定积分 ∫₀¹ x dx = ",
                "[\"A.0\",\"B.1/2\",\"C.1\",\"D.2\"]",
                "B", "∫₀¹ x dx = [x²/2]₀¹ = 1/2。",
                "高等数学", "single", "定积分", null),
            new SeedQuestion(
                "曲线 y=x²-2x 在 x=1 处的切线斜率是",
                "[\"A.0\",\"B.1\",\"C.2\",\"D.-1\"]",
                "A", "y'=2x-2，代入 x=1 得 y'(1)=0。",
                "高等数学", "single", "导数应用", null),
            new SeedQuestion(
                "函数 z=x²+y² 在点 (1,1) 处沿向量 (1,0) 方向的方向导数是",
                "[\"A.1\",\"B.2\",\"C.0\",\"D.4\"]",
                "B", "∂z/∂x = 2x，方向为 x 轴正向，方向导数 = 2x|_(1,1) = 2。",
                "高等数学", "single", "多元函数", null),
            new SeedQuestion(
                "下列级数收敛的是",
                "[\"A.Σ 1/n\",\"B.Σ 1/n²\",\"C.Σ n\",\"D.Σ (-1)^n\"]",
                "B", "p-级数 Σ 1/n^p 在 p>1 时收敛，故 Σ 1/n² 收敛；Σ 1/n 是调和级数，发散。",
                "高等数学", "single", "级数收敛", null),
            new SeedQuestion(
                "微分方程 dy/dx = y 的通解是",
                "[\"A.y=Cx\",\"B.y=C·e^x\",\"C.y=C+x\",\"D.y=Csin(x)\"]",
                "B", "分离变量得 dy/y = dx，积分得 ln|y|=x+C₁，故 y=C·e^x。",
                "高等数学", "single", "微分方程", null),
            new SeedQuestion(
                "下列函数在 x=0 处可导的是",
                "[\"A.|x|\",\"B.x²\",\"C.√|x|\",\"D.x·|x|\"]",
                "BD", "|x| 在 x=0 不可导（左右导数不等）；√|x| 在 x=0 不可导；x² 与 x|x| 在 x=0 可导。",
                "高等数学", "multiple", "可导性", null),

            // ===== 线性代数 =====
            new SeedQuestion(
                "n 阶单位矩阵 I 的行列式 |I| = ",
                "[\"A.0\",\"B.1\",\"C.n\",\"D.n!\"]",
                "B", "单位矩阵主对角线全为 1，行列式 |I|=1。",
                "线性代数", "single", "行列式", null),
            new SeedQuestion(
                "若 A 为 n 阶可逆矩阵，则",
                "[\"A.|A|=0\",\"B.|A|≠0\",\"C.A 必为对称矩阵\",\"D.A 必为对角矩阵\"]",
                "B", "矩阵可逆 ⇔ |A|≠0。",
                "线性代数", "single", "矩阵可逆性", null),
            new SeedQuestion(
                "向量组 α₁,α₂,α₃ 线性无关的充要条件是",
                "[\"A.其中任一向量不能由其他向量线性表示\",\"B.向量组的秩等于向量个数\",\"C.对应齐次方程组只有零解\",\"D.以上都是\"]",
                "D", "三种说法等价，都是线性无关的等价条件。",
                "线性代数", "single", "线性无关", null),
            new SeedQuestion(
                "若 λ 是矩阵 A 的特征值，则 A-λI 的行列式",
                "[\"A.>0\",\"B.<0\",\"C.=0\",\"D.无法判断\"]",
                "C", "λ 是特征值 ⇔ 特征方程 |A-λI|=0。",
                "线性代数", "single", "特征值", null),
            new SeedQuestion(
                "n 元齐次线性方程组 Ax=0 有非零解的充要条件是",
                "[\"A.|A|=0\",\"B.|A|≠0\",\"C.A 是方阵\",\"D.A 不可逆\"]",
                "A", "齐次方程组 Ax=0 有非零解 ⇔ |A|=0（A 为方阵时）。",
                "线性代数", "single", "齐次方程组", null),
            new SeedQuestion(
                "矩阵的初等行变换不改变矩阵的",
                "[\"A.行列式\",\"B.秩\",\"C.特征值\",\"D.维数\"]",
                "B", "初等行变换不改变矩阵的秩，但可能改变行列式与特征值。",
                "线性代数", "single", "初等变换", null),
            new SeedQuestion(
                "若 A、B 均为 n 阶矩阵，则下列说法正确的是",
                "[\"A.(AB)^T = A^T B^T\",\"B.(AB)^T = B^T A^T\",\"C.|AB| = |A|+|B|\",\"D.AB = BA\"]",
                "B", "矩阵转置满足 (AB)^T = B^T A^T；行列式有 |AB|=|A||B|；矩阵乘法不交换。",
                "线性代数", "single", "矩阵运算", null),

            // ===== 概率论与数理统计 =====
            new SeedQuestion(
                "P(A∪B) = ",
                "[\"A.P(A)+P(B)\",\"B.P(A)+P(B)-P(AB)\",\"C.P(A)·P(B)\",\"D.P(A|B)\"]",
                "B", "概率加法公式：P(A∪B) = P(A)+P(B)-P(AB)。",
                "概率论", "single", "概率公式", null),
            new SeedQuestion(
                "若 A、B 互斥，则 P(A∪B) = ",
                "[\"A.P(A)+P(B)\",\"B.P(A)·P(B)\",\"C.P(A)-P(B)\",\"D.0\"]",
                "A", "互斥事件 P(AB)=0，故 P(A∪B)=P(A)+P(B)。",
                "概率论", "single", "互斥事件", null),
            new SeedQuestion(
                "随机变量 X 服从标准正态分布，则 E(X) 与 D(X) 分别为",
                "[\"A.0,1\",\"B.0,0\",\"C.1,1\",\"D.1,0\"]",
                "A", "标准正态分布 N(0,1)：均值 E(X)=0，方差 D(X)=1。",
                "概率论", "single", "正态分布", null),
            new SeedQuestion(
                "抛掷一枚均匀硬币 3 次，恰好出现 2 次正面的概率为",
                "[\"A.1/8\",\"B.2/8\",\"C.3/8\",\"D.4/8\"]",
                "C", "C(3,2)·(1/2)^2·(1/2)^1 = 3/8。",
                "概率论", "single", "二项分布", null),
            new SeedQuestion(
                "条件概率 P(A|B) 的计算公式是",
                "[\"A.P(AB)/P(B)\",\"B.P(B)/P(A)\",\"C.P(A)/P(B)\",\"D.P(A)·P(B)\"]",
                "A", "P(A|B) = P(AB)/P(B)，其中 P(B)>0。",
                "概率论", "single", "条件概率", null),
            new SeedQuestion(
                "下列关于无偏估计的说法正确的有",
                "[\"A.样本均值是总体均值的无偏估计\",\"B.样本方差S²是总体方差的无偏估计\",\"C.无偏估计一定存在\",\"D.无偏估计是唯一的\"]",
                "AB", "样本均值与样本方差(分母 n-1)分别是总体均值与方差的无偏估计；无偏估计未必存在或唯一。",
                "数理统计", "multiple", "估计量", null),

            // ===== 综合 =====
            new SeedQuestion(
                "lim(x→0) (1-cos(x))/x² = ",
                "[\"A.0\",\"B.1/2\",\"C.1\",\"D.不存在\"]",
                "B", "用泰勒展开：1-cos(x) ≈ x²/2，故极限 = 1/2。",
                "高等数学", "single", "等价无穷小", null),
            new SeedQuestion(
                "函数 y=e^x 的麦克劳林级数前三项是",
                "[\"A.1+x+x²/2\",\"B.1-x+x²/2\",\"C.x+x²/2+x³/3\",\"D.1+x²+x⁴\"]",
                "A", "e^x = 1 + x + x²/2! + x³/3! + ...",
                "高等数学", "single", "幂级数展开", null),
            new SeedQuestion(
                "矩阵的秩 r(A) 等于其",
                "[\"A.最高阶非零子式的阶数\",\"B.行向量组与列向量组的秩\",\"C.线性无关行（列）向量的最大个数\",\"D.以上都对\"]",
                "D", "秩有多种等价定义，三项均成立。",
                "线性代数", "single", "秩", null),
            new SeedQuestion(
                "求 lim(x→0) ln(1+x)/x。",
                "",
                "lim(x→0) ln(1+x)/x = 1。可用洛必达或等价无穷小 ln(1+x)~x。",
                "ln(1+x) 与 x 是 x→0 时的等价无穷小，故极限为 1。",
                "高等数学", "subjective", "极限计算", "hard"),
            new SeedQuestion(
                "求二阶常系数齐次微分方程 y''-3y'+2y=0 的通解。",
                "",
                "特征方程 r²-3r+2=0，根 r=1,2。通解 y = C₁e^x + C₂e^(2x)。",
                "二阶常系数齐次方程通过特征方程求根：单实根用 e^(rx) 形式叠加。",
                "高等数学", "subjective", "微分方程", "hard")
        )
    );
}
