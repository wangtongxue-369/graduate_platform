import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import StatCard from '@/components/StatCard.jsx'

const steps = [
  {
    title: '先补齐简历中的项目经历与技能关键词',
    desc: '推荐排序会读取在线简历字段，附件只保存与下载，不参与自动解析。',
    to: '/job/resume',
    cta: '进入简历页',
  },
  {
    title: '再看推荐结果，只处理适合今天投递的岗位',
    desc: '推荐页先筛，再看匹配原因，再进岗位详情，不和简历编辑页混在一起。',
    to: '/job/recommend',
    cta: '进入推荐页',
  },
  {
    title: '最后维护投递进度，不让下一步事项断掉',
    desc: '岗位详情只允许加入投递跟踪或跳站外申请，不误导为站内自动投递。',
    to: '/job/applications',
    cta: '进入投递跟踪',
  },
]

export default function JobStationPage() {
  const { user } = useAuth()

  return (
    <section className="v1-station v1-station--job">
      <div className="v1-station-hero">
        <div className="v1-station-copy">
          <p className="v1-eyebrow">student / job target</p>
          <h1>今天先把最该推进的 3 步做掉。</h1>
          <p className="v1-lead">
            {user?.name || '当前用户'} 进入主站后，不需要一次看完所有就业功能，只需要按“简历 → 推荐 → 跟踪”的
            顺序继续推进。
          </p>
        </div>

        <div className="v1-station-stats">
          <StatCard label="方向" value="就业" tone="accent" />
          <StatCard label="今日主路径" value="3 步" />
          <StatCard label="公共模块" value="社区 / 题库" />
        </div>
      </div>

      <div className="v1-step-grid">
        {steps.map((item, index) => (
          <article className="v1-step-card" key={item.to}>
            <span className="v1-step-index">0{index + 1}</span>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <Link className="v1-btn v1-btn--primary" to={item.to}>
              {item.cta}
            </Link>
          </article>
        ))}
      </div>

      <div className="v1-subnav-panel">
        <div>
          <p className="v1-eyebrow">公共能力</p>
          <h2>方向工作站之外，公共模块始终在。</h2>
        </div>
        <div className="v1-action-row">
          <Link className="v1-btn" to="/community">
            去社区
          </Link>
          <Link className="v1-btn" to="/practice">
            去题库
          </Link>
          <Link className="v1-btn" to="/profile">
            个人中心
          </Link>
        </div>
      </div>
    </section>
  )
}
