import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import '../../App.css'

const features = [
  {
    title: '招聘会与网申入口',
    desc: '浏览校园招聘会、线上申请链接、截止时间，并按城市、行业、岗位、薪资和企业类型保存站内提醒偏好。',
    to: '/job/fairs',
  },
  {
    title: '在线简历',
    desc: '维护一份可持久保存的结构化简历，包含基本信息、教育经历、项目经历、实习经历、技能和自我评价。',
    to: '/job/resume',
  },
  {
    title: '规则化岗位推荐',
    desc: '基于城市、行业、岗位、专业和简历技能，在本平台数据内生成确定性的岗位匹配结果。',
    to: '/job/recommend',
  },
  {
    title: '投递进度跟踪',
    desc: '记录平台外投递，维护投递状态、下一步安排和备注，帮助管理个人求职流程。',
    to: '/job/applications',
  },
]

const sharedFeatures = [
  { title: '社区交流', desc: '与同学发帖、评论、点赞和收藏，交流毕业去向经验。', to: '/community' },
  { title: '题库练习', desc: '按章节、随机或模拟模式练习，并保存成绩记录。', to: '/practice' },
]

export default function JobPage() {
  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">就业方向</p>
            <h2>就业功能面板</h2>
            <p className="muted">招聘会、在线简历、规则化推荐、站内提醒与投递状态跟踪。</p>
          </div>
          <div className="track-grid">
            {features.map((item) => (
              <article className="track-card" key={item.to}>
                <div className="track-head">
                  <h3>{item.title}</h3>
                  <span className="tag subtle">就业</span>
                </div>
                <p className="muted">{item.desc}</p>
                <Link className="btn primary small" to={item.to}>进入功能</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>通用功能入口</h2>
            <p className="muted">以下功能面向所有方向的注册用户开放。</p>
          </div>
          <div className="grid-two">
            {sharedFeatures.map((item) => (
              <div className="feature-card soft" key={item.to}>
                <div className="card-title">{item.title}</div>
                <p className="muted">{item.desc}</p>
                <Link className="btn outline small" to={item.to}>前往</Link>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
