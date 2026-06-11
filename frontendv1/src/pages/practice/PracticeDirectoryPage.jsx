import { Link } from 'react-router-dom'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import { createPracticePreview } from '@/lib/practicePreview.js'

const navItems = [
  { label: '题库目录', note: '先按方向与科目缩小范围', current: true },
  { label: '练习会话', note: '进入单次练习前先确认目录' },
  { label: '结果去向', note: '错题、历史、统计分开看' },
]

export default function PracticeDirectoryPage() {
  const preview = createPracticePreview()

  return (
    <section className="v1-practice-wrap">
      <div className="v1-stack-page v1-stack-page--practice">
        <aside className="v1-stack-sidebar">
          <section className="v1-stack-profile">
            <span className="v1-stack-avatar" aria-hidden="true">QB</span>
            <p className="v1-kicker">practice catalog</p>
            <h2>题库目录</h2>
            <p>题库先缩小范围，再进入练习。历史、统计和错题不要混进同一屏。</p>
            <div className="v1-stack-meta-row">
              <span>{preview.banks.length} 个训练入口</span>
              <span>目录先行</span>
              <span>结果分流</span>
            </div>
          </section>

          <nav className="v1-stack-nav" aria-label="题库训练阶段">
            {navItems.map((item) => (
              <div className={`v1-stack-nav-link ${item.current ? 'is-current' : ''}`} key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </div>
            ))}
          </nav>

          <section className="v1-stack-panel">
            <p className="v1-kicker">登录后继续</p>
            <p>游客可以先看目录；真正进入练习会话、保存答案和交卷，需要先进入身份语境。</p>
            <RoleAuthLink className="v1-btn">登录后继续</RoleAuthLink>
          </section>
        </aside>

        <div className="v1-stack-content v1-practice-main">
          <section className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">训练目录</p>
            <h1>开始练习前先选目录。</h1>
            <p className="v1-lead">
              题库不再把筛选、做题、统计揉进一页。先选题库，再进入练习会话；交卷之后再去看历史、统计和错题账本。
            </p>
            <div className="v1-action-row">
              <Link className="v1-btn v1-btn--primary" to="/practice/history">
                看练习历史
              </Link>
              <Link className="v1-btn" to="/practice/statistics">
                看统计
              </Link>
              <Link className="v1-btn" to="/practice/wrong-questions">
                看错题账本
              </Link>
            </div>
          </section>

          <section className="v1-ledger">
            <div className="v1-section-head">
              <p className="v1-kicker">题库目录</p>
              <h2>按方向和科目组织，不按大卡片平铺。</h2>
            </div>
            <div className="v1-ledger-rows">
              {preview.banks.map((bank) => (
                <Link className="v1-ledger-row" key={bank.id} to={`/practice/${bank.id}`}>
                  <div>
                    <strong>{bank.title}</strong>
                    <p>{bank.target} / {bank.subject} / {bank.chapter} / {bank.questionCount} 题</p>
                  </div>
                  <span>进入</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
