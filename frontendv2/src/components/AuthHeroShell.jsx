const siteHighlights = [
  {
    title: '一站式信息入口',
    description: '社区、资料与方向工具统一收口，减少来回切换。',
  },
  {
    title: '按方向进入功能区',
    description: '考研、考公考编、就业、留学按目标展示对应菜单与内容。',
  },
  {
    title: '兼顾学生与管理端',
    description: '学生侧负责浏览互动，管理侧负责审核与运营维护。',
  },
]

const quickFacts = [
  '社区帖子支持正文编辑、评论互动与附件上传。',
  '个人设置会同步你的方向、资料与发帖管理。',
  '不同身份登录后进入不同工作区，减少无关入口干扰。',
]

export default function AuthHeroShell({ children }) {
  return (
    <div className="v2-auth-shell">
      <div className="v2-auth-shell__inner">
        <aside className="v2-auth-shell__intro">
          <section className="v2-auth-intro-card v2-glass-card">
            <p className="v2-kicker">graduate platform</p>
            <h1>面向升学与求职场景的学生服务平台</h1>
            <p className="v2-lead">
              整合信息浏览、经验交流、资料管理与方向工具，
              让你从登录后就能更快进入适合自己的学习或求职工作区。
            </p>
          </section>

          <section className="v2-auth-intro-grid">
            {siteHighlights.map((item) => (
              <article className="v2-auth-intro-mini v2-glass-card" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </section>

          <section className="v2-auth-intro-mini v2-glass-card v2-auth-intro-mini--facts">
            <strong>快速了解</strong>
            <ul className="v2-auth-intro-list">
              {quickFacts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="v2-auth-shell__panel">
          {children}
        </main>
      </div>
    </div>
  )
}
