export default function AuthHeroShell({ children }) {
  return (
    <div className="v2-auth-shell">
      <div className="v2-auth-shell__inner">
        <aside className="v2-auth-shell__intro">
          <nav aria-label="站点介绍导航" className="v2-auth-intro-nav">
            <a href="#platform">平台结构</a>
            <a href="#directions">方向主站</a>
            <a href="#admin">管理体系</a>
          </nav>

          <section className="v2-auth-intro-card v2-glass-card" id="platform">
            <p className="v2-kicker">graduate platform</p>
            <h1>登录或注册后进入平台</h1>
            <p className="v2-lead">
              这一版把游客态收口成说明与认证入口。进入系统后，默认从社区开始，再沿着你的方向功能与管理路径逐层深入。
            </p>
          </section>

          <section className="v2-auth-intro-grid">
            <article className="v2-auth-intro-mini v2-glass-card" id="directions">
              <strong>方向主站</strong>
              <p>考研、考公、就业、留学都按各自后端能力拆成独立菜单，不再摊在一个页面里。</p>
            </article>

            <article className="v2-auth-intro-mini v2-glass-card" id="admin">
              <strong>管理体系</strong>
              <p>管理员登录后直接进入社区治理，再延伸到题库、考研、考公与就业运营。</p>
            </article>
          </section>
        </aside>

        <main className="v2-auth-shell__panel">
          {children}
        </main>
      </div>
    </div>
  )
}
