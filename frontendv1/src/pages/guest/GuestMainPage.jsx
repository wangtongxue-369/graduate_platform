import { Link } from 'react-router-dom'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'

const navItems = [
  { label: '社区目录', note: '公开讨论与资料帖', to: '/community', current: true },
  { label: '题库目录', note: '按方向与科目浏览', to: '/practice' },
  { label: '方向入口', note: '先看公开信息，再决定进入哪个主站', to: '/community?category=experience' },
]

const readingRows = [
  {
    title: '社区目录',
    desc: '先看公开讨论、资料帖和经验帖，发帖与互动动作统一放到登录后继续。',
    to: '/community',
  },
  {
    title: '题库目录',
    desc: '先按方向和科目浏览题库，再决定是否进入练习会话。',
    to: '/practice',
  },
  {
    title: '方向公开入口',
    desc: '就业看招聘会与岗位，考研看院校与资料，考公看日历与分数线，留学看项目与案例。',
    to: '/community?category=experience',
  },
]

const unlockedRows = [
  '发帖、评论、点赞、收藏',
  '完整练习会话、错题账本与统计',
  '进入就业、考研、考公、留学对应主站',
  '管理员治理总台与运营队列',
]

export default function GuestMainPage() {
  return (
    <section className="v1-guest-hall-wrap">
      <div className="v1-stack-page v1-stack-page--guest">
        <aside className="v1-stack-sidebar">
          <section className="v1-stack-profile">
            <span className="v1-stack-avatar" aria-hidden="true">GP</span>
            <p className="v1-kicker">public gateway</p>
            <h2>公共浏览</h2>
            <p>游客先浏览社区与题库，真正需要身份的动作在进入时再解锁。</p>
            <div className="v1-stack-meta-row">
              <span>社区公开流</span>
              <span>题库目录</span>
              <span>四个方向主站</span>
            </div>
            <RoleAuthLink className="v1-btn v1-btn--primary">
              选择身份
            </RoleAuthLink>
          </section>

          <nav className="v1-stack-nav" aria-label="游客门厅阶段">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className={`v1-stack-nav-link ${item.current ? 'is-current' : ''}`}
                to={item.to}
              >
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="v1-stack-content v1-guest-catalogue">
          <section className="v1-sheet v1-sheet--hero" aria-labelledby="guest-hall-heading">
            <p className="v1-kicker">公开浏览</p>
            <h1 id="guest-hall-heading">先看内容，再决定是否进入身份语境。</h1>
            <p className="v1-lead">
              游客不是空白身份。你可以先浏览社区、题库和四类方向的公开信息；
              真正需要账号的动作，页面会明确提示“登录后继续”，不会藏成不起眼的小字。
            </p>
            <div className="v1-action-row">
              <Link className="v1-btn v1-btn--primary" to="/community">
                进入社区目录
              </Link>
              <Link className="v1-btn" to="/practice">
                打开题库目录
              </Link>
              <RoleAuthLink className="v1-btn">
                登录后继续
              </RoleAuthLink>
            </div>
          </section>

          <section className="v1-portal-strip" aria-label="登录后解锁">
            <div className="v1-section-head">
              <p className="v1-kicker">登录后继续</p>
              <h2>公共浏览只负责阅读，身份动作进入对应主站再展开。</h2>
            </div>
            <div className="v1-stack-meta-row v1-stack-meta-row--wrap">
              {unlockedRows.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>

          <section className="v1-ledger" aria-label="今日可浏览内容">
            <div className="v1-section-head">
              <p className="v1-kicker">公开内容导览</p>
              <h2>先按路径看，不按功能名词堆。</h2>
            </div>
            <div className="v1-ledger-rows">
              {readingRows.map((item) => (
                <Link className="v1-ledger-row" key={item.title} to={item.to}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                  <span>进入</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="v1-portal-card-grid" aria-label="方向公开入口">
            {readingRows.map((item) => (
              <Link className="v1-portal-card" key={`${item.title}-card`} to={item.to}>
                <p className="v1-kicker">公开入口</p>
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </section>
  )
}
