import {
  getAdmissionResultLabel,
  getApplicationStatusLabel,
  getCountryLabel,
} from '@/lib/studyabroad/studyAbroadLabels.js'

export default function StudyAbroadCommandDeck({
  summaryItems = [],
  lanes = [],
  programPreview = [],
  casePreview = [],
  riskItems = [],
}) {
  return (
    <div className="v2-studyabroad-deck" data-testid="studyabroad-command-deck">
      <section className="v2-summary-strip" aria-label="留学总览摘要">
        {summaryItems.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="v2-studyabroad-lane-board">
        {lanes.map((lane) => (
          <article className="v2-side-card v2-studyabroad-lane" key={lane.key}>
            <div className="v2-side-card__head">
              <div>
                <p className="v2-kicker">{lane.label}</p>
                <h3>{lane.items.length} 个项目</h3>
              </div>
            </div>
            <div className="v2-check-list">
              {lane.items.length ? lane.items.map((item) => (
                <div className="v2-check-row" key={item.id}>
                  <strong>{item.school}</strong>
                  <span>{item.program}</span>
                  <span>{getApplicationStatusLabel(item.status)}</span>
                </div>
              )) : (
                <div className="v2-check-row">
                  <strong>当前没有项目</strong>
                  <span>可以从侧栏直接创建新申请。</span>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="v2-card-grid">
        <article className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">项目速览</p>
              <h3>先看项目，再决定比较对象</h3>
            </div>
          </div>
          <div className="v2-check-list">
            {programPreview.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.schoolName}</strong>
                <span>{item.programName}</span>
                <span>{getCountryLabel(item.country)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">案例速览</p>
              <h3>先看相近背景，再判断风险</h3>
            </div>
          </div>
          <div className="v2-check-list">
            {casePreview.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.school}</strong>
                <span>{item.program}</span>
                <span>{getAdmissionResultLabel(item.admissionResult)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="v2-side-card">
        <div className="v2-side-card__head">
          <div>
            <p className="v2-kicker">风险带</p>
            <h3>先处理最容易拖慢推进节奏的点</h3>
          </div>
        </div>
        <div className="v2-check-list">
          {riskItems.length ? riskItems.map((item) => (
            <div className="v2-check-row" key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.meta}</span>
              <span>{item.note}</span>
            </div>
          )) : (
            <div className="v2-check-row">
              <strong>当前没有高风险提醒</strong>
              <span>可以转去项目目录或经验页继续推进。</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
