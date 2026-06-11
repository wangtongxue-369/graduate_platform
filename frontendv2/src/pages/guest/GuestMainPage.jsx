import { Link } from 'react-router-dom'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import WorkspaceSidebar from '@/components/WorkspaceSidebar.jsx'

const publicEntries = [
  { title: '社区目录', desc: '先浏览真实讨论、资料帖子和经验复盘。', to: '/community' },
  { title: '题库目录', desc: '先按方向和科目看题库，再决定是否进入练习。', to: '/practice' },
  { title: '方向入口', desc: '登录后根据考研、考公、就业、留学进入各自主站。', to: '/login' },
]

const publicHighlights = [
  '游客不是空白状态，可以直接浏览社区与题库。',
  '需要身份的动作会明确提示，不会悄悄失效。',
  '登录后回到对应方向主站，而不是继续堆在公共页里。',
]

export default function GuestMainPage() {
  return (
    <section className="v2-stack-page">
      <WorkspaceSidebar
        badge="PUB"
        currentPath="/"
        description="这一层只保留所有人都能用的浏览能力，把进入方向主站这件事单独拎出来。"
        footer={<RoleAuthLink className="v2-sidebar-button">选择身份</RoleAuthLink>}
        kicker="public gateway"
        metrics={[
          { label: '开放模块', value: '2' },
          { label: '方向入口', value: '5' },
        ]}
        navItems={[
          { label: '公共大厅', to: '/', summary: '游客先从公共浏览层进入' },
          { label: '社区目录', to: '/community', summary: '帖子、资料、经验都先公开浏览' },
          { label: '题库目录', to: '/practice', summary: '题库与训练入口分层展开' },
        ]}
        title="游客大厅"
      />

      <div className="v2-main-column">
        <PageIntro
          actions={(
            <>
              <Link className="v2-primary-link" to="/community">进入社区</Link>
              <Link className="v2-secondary-link" to="/practice">打开题库</Link>
              <RoleAuthLink className="v2-secondary-link">登录后继续</RoleAuthLink>
            </>
          )}
          kicker="公共首页"
          lead="公共层不承担深度操作，只负责让人先看清内容，再决定要不要进入某个方向。"
          title="先看内容，再决定进入哪一种身份语境。"
        />

        <section className="v2-feed-list" aria-label="公共入口">
          {publicEntries.map((item, index) => (
            <Link className="v2-feed-item" key={item.title} to={item.to}>
              <div className="v2-feed-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="v2-feed-body">
                <strong>{item.title}</strong>
                <p>{item.desc}</p>
              </div>
              <span className="v2-feed-action">进入</span>
            </Link>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">使用规则</p>
          <h3>公共层只保留真正有用的动作。</h3>
          <ul>
            {publicHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </aside>
    </section>
  )
}
