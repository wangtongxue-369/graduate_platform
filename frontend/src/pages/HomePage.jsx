import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import '../App.css'

const tracks = [
  {
    id: 'kaoyan',
    title: '考研党',
    subtitle: '院校数据 + 复习管理',
    desc: '查询分数线与报录比，制定复习计划打卡，共享备考资料，加入自习室与1v1咨询。',
    to: '/kaoyan',
    color: '#0f766e',
  },
  {
    id: 'kaogong',
    title: '考公考编党',
    subtitle: '岗位匹配 + 考试提醒',
    desc: '智能筛选可报考岗位，查询进面分数线，订阅考试日历提醒，模拟面试训练。',
    to: '/kaogong',
    color: '#d97706',
  },
  {
    id: 'job',
    title: '就业党',
    subtitle: '校招信息 + 投递追踪',
    desc: '获取宣讲会与网申推送，维护在线简历，查看岗位推荐，跟踪投递状态。',
    to: '/job',
    color: '#2563eb',
  },
  {
    id: 'liuxue',
    title: '留学用户',
    subtitle: '申请节点 + 资料沉淀',
    desc: '管理申请时间线，查阅文书资料库，浏览与分享留学经验。',
    to: '/studyabroad',
    color: '#7c3aed',
  },
]

const generalFeatures = [
  {
    title: '社区交流',
    desc: '发帖、评论、点赞、收藏、举报。游客可浏览公开内容，注册用户可参与互动。分类覆盖考研/考公考编/就业/留学/经验分享/资料互助。',
    to: '/community',
  },
  {
    title: '题库练习',
    desc: '按方向、科目、章节、难度组织题库。支持章节练习、随机练习、模拟练习三种模式，自动评分生成错题本与历史统计。',
    to: '/practice',
  },
]

const stats = [
  { label: '目标方向', value: '4' },
  { label: '通用模块', value: '2' },
  { label: '专属功能', value: '16+' },
  { label: '角色类型', value: '3' },
]

export default function HomePage() {
  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="hero" id="top">
          <div className="hero-content">
            <p className="eyebrow">毕业去向导航与交流平台</p>
            <h1>把"找信息、做决策、跑流程"放进同一套前端体验</h1>
            <p className="lead">
              通用功能统一入口，方向专属功能按角色聚集。覆盖社区交流、题库练习与四大方向的差异化服务。
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/register">创建账号</Link>
              <Link className="btn outline" to="/community">浏览社区</Link>
            </div>
            <div className="hero-stats">
              {stats.map((item) => (
                <div className="stat" key={item.label}>
                  <div className="stat-value">{item.value}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-card">
              <div className="panel-title">通用功能</div>
              {generalFeatures.map((item) => (
                <Link className="panel-item" to={item.to} key={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="pill">{item.title.slice(0, 2)}</span>
                  <div>
                    <div className="panel-main">{item.title}</div>
                    <div className="panel-sub">{item.desc.slice(0, 35)}...</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="panel-card accent">
              <div className="panel-title">选择你的方向</div>
              {tracks.map((track) => (
                <Link className="room-row" to={track.to} key={track.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div className="room-title">{track.title}</div>
                    <div className="room-sub">{track.subtitle}</div>
                  </div>
                  <span className="tag subtle" style={{ background: track.color + '18', color: track.color }}>进入</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="tracks">
          <div className="section-head">
            <p className="eyebrow">方向专属</p>
            <h2>四类用户方向，一套统一交互框架</h2>
            <p className="muted">选择你的目标方向，进入专属功能面板。通用模块（社区、题库）对所有方向开放。</p>
          </div>
          <div className="track-grid four">
            {tracks.map((track) => (
              <div className="track-card" key={track.id}>
                <div className="track-head">
                  <h3>{track.title}</h3>
                  <span className="tag subtle" style={{ background: track.color + '18', color: track.color }}>{track.subtitle}</span>
                </div>
                <p className="muted">{track.desc}</p>
                <Link className="btn primary small" to={track.to}>进入方向</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="section cta" id="cta">
          <div>
            <h2>开始搭建你的毕业去向作战面板</h2>
            <p className="muted">先完成注册建档选择方向，再进入专属功能面板配置计划、练习与提醒。</p>
          </div>
          <div className="cta-actions">
            <Link className="btn primary" to="/register">立即注册</Link>
            <Link className="btn ghost" to="/community">先逛社区</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
