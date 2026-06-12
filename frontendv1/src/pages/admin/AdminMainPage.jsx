import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminDeskQueues, adminDomains, adminRecentActions } from '@/lib/adminStationPreview.js'

export default function AdminMainPage() {
  const { user } = useAuth()

  return (
    <section className="v1-admin-station-page">
      <div className="v1-stack-page v1-stack-page--admin">
        <aside className="v1-stack-sidebar">
          <section className="v1-stack-profile">
            <span className="v1-stack-avatar" aria-hidden="true">{(user?.name || '管').slice(0, 1)}</span>
            <p className="v1-kicker">governance desk</p>
            <h2>{user?.name || '管理员'}</h2>
            <p>总台先处理真实待办，再把人带进对应治理域，不做空泛的大屏仪表板。</p>
            <div className="v1-stack-meta-row">
              {adminDeskQueues.slice(0, 3).map((queue) => (
                <span key={queue.key}>{queue.label} {queue.count}</span>
              ))}
            </div>
          </section>

          <nav className="v1-stack-nav" aria-label="管理员值班总台阶段">
            <div className="v1-stack-nav-link is-current">
              <strong>值班总台</strong>
              <span>先分诊，再进入对应治理台</span>
            </div>
            {adminDomains.map((domain) => (
              <Link className="v1-stack-nav-link" key={domain.key} to={domain.to}>
                <strong>{domain.label}</strong>
                <span>{domain.summary}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="v1-stack-content v1-admin-desk-main">
          <header className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">总台首页</p>
            <h1>值班总台</h1>
            <p className="v1-lead">首页只负责分诊：先看真实待办，再进入对应治理台。审核、治理和运营在下一层分开，不堆在同一块面板里。</p>
          </header>

          <section className="v1-admin-queue-band" aria-label="真实待办">
            {adminDeskQueues.map((queue) => (
              <Link className="v1-admin-queue-chip" key={queue.key} to={queue.to}>
                <strong>{queue.label}</strong>
                <span>{queue.count}</span>
              </Link>
            ))}
          </section>

          <section className="v1-admin-domain-grid" aria-label="治理域入口">
            {adminDomains.map((domain) => (
              <Link className="v1-admin-domain-card" key={domain.key} to={domain.to}>
                <strong>{domain.label}</strong>
                <p>{domain.summary}</p>
              </Link>
            ))}
          </section>

          <section className="v1-ledger" aria-label="最近处理">
            <div className="v1-section-head">
              <p className="v1-kicker">处理记录</p>
              <h2>总台只保留有用的处理回声。</h2>
            </div>
            <div className="v1-ledger-rows">
              {adminRecentActions.map((item) => (
                <div className="v1-ledger-row" key={item}>
                  <div>
                    <strong>{item}</strong>
                    <p>处理完成后可以继续回到队列，不需要在首页读说明书。</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
