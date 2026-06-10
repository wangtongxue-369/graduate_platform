import { Link } from 'react-router-dom'

const publicTracks = [
  { title: '就业公开入口', desc: '招聘会、岗位详情与公开企业信息。', to: '/job/fairs' },
  { title: '考研公开入口', desc: '院校、分数线、公开资料与经验交流。', to: '/community?category=kaoyan' },
  { title: '考公公开入口', desc: '岗位、分数线、考试日历与公开答疑。', to: '/community?category=kaogong' },
  { title: '留学公开入口', desc: '院校、案例、经验内容与公共清单。', to: '/community?category=liuxue' },
]

const publicModules = [
  { title: '社区', desc: '公开浏览帖子与详情，登录后再参与讨论与收藏。', to: '/community' },
  { title: '题库', desc: '先看题库目录与方向分布，完整练习闭环在登录后开启。', to: '/practice' },
]

export default function GuestMainPage() {
  return (
    <section className="v1-guest-main">
      <div className="v1-guest-hero">
        <div className="v1-guest-copy">
          <p className="v1-eyebrow">公共浏览站</p>
          <h1>先看清路，再决定要不要进入。</h1>
          <p className="v1-lead">
            游客先浏览公开内容、公开题库和公开方向入口；需要身份的动作不会悄悄灰掉，而是明确提示
            “登录后继续”。
          </p>
          <div className="v1-action-row">
            <Link className="v1-btn v1-btn--primary" to="/community">
              浏览社区
            </Link>
            <Link className="v1-btn" to="/practice">
              打开题库
            </Link>
            <Link className="v1-btn" to="/login">
              登录后继续
            </Link>
          </div>
        </div>

        <aside className="v1-gate-panel">
          <div className="v1-gate-badge">登录后解锁</div>
          <ul className="v1-gate-list">
            <li>发帖、评论、点赞、收藏</li>
            <li>进入个人方向工作站</li>
            <li>简历维护、投递跟踪、申请管理</li>
            <li>完整练习记录、错题与统计</li>
          </ul>
        </aside>
      </div>

      <div className="v1-guest-grid">
        <article className="v1-panel v1-panel--tracks">
          <div className="v1-panel-head">
            <p className="v1-eyebrow">方向总览</p>
            <h2>先按路径看，不按功能堆。</h2>
          </div>
          <div className="v1-card-stack">
            {publicTracks.map((item) => (
              <Link className="v1-list-card v1-list-card--interactive" key={item.to} to={item.to}>
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="v1-panel">
          <div className="v1-panel-head">
            <p className="v1-eyebrow">公共模块</p>
            <h2>游客不是空白身份。</h2>
          </div>
          <div className="v1-card-stack">
            {publicModules.map((item) => (
              <Link className="v1-list-card v1-list-card--interactive" key={item.to} to={item.to}>
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="v1-panel">
          <div className="v1-panel-head">
            <p className="v1-eyebrow">返回规则</p>
            <h2>公共层只负责公共层。</h2>
          </div>
          <div className="v1-card-stack">
            <div className="v1-list-card">
              <strong>公共详情页</strong>
              <span>返回原列表，不把游客直接扔进个人语境。</span>
            </div>
            <div className="v1-list-card">
              <strong>登录成功后</strong>
              <span>按角色与方向进入新主站，不强行回到游客深页继续编辑。</span>
            </div>
            <div className="v1-list-card">
              <strong>受限动作</strong>
              <span>直接说清楚“登录后继续”，不藏成不明显的小字。</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
