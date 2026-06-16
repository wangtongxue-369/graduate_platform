export default function JobResumePreviewCard({ resume }) {
  return (
    <section className="v2-article-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">预览简历</p>
          <h3>{resume.targetRole || '目标岗位待补充'}</h3>
        </div>
      </div>

      <div className="v2-card-grid">
        <article className="v2-module-card">
          <strong>意向方向</strong>
          <p>{resume.expectedCities || '意向城市待补充'}</p>
          <p>{resume.expectedIndustries || '目标行业待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>教育背景</strong>
          <p>{resume.highestEducation || '学历待补充'}</p>
          <p>{resume.major || '专业待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>技能标签</strong>
          <p>{resume.skillTags || '技能标签待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>项目关键词</strong>
          <p>{resume.projectKeywords || '项目关键词待补充'}</p>
        </article>
      </div>

      <section className="v2-article-card">
        <p className="v2-kicker">基础信息</p>
        <p>{resume.baseInfo || '基础信息待补充。'}</p>
      </section>

      <section className="v2-article-card">
        <p className="v2-kicker">自我评价</p>
        <p>{resume.selfEvaluation || '个人总结待补充。'}</p>
      </section>
    </section>
  )
}
