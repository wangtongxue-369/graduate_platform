import { Link, useLocation } from 'react-router-dom'

const copyMap = {
  '/station/kaoyan': {
    eyebrow: 'student / kaoyan target',
    title: '考研工作站会在下一阶段单独展开。',
    desc: '当前先保留公共模块入口与主路径占位，不伪造还没完成的深层工作流。',
  },
  '/station/kaogong': {
    eyebrow: 'student / kaogong target',
    title: '考公工作站会在下一阶段单独展开。',
    desc: '当前先保留公共模块入口与主路径占位，不把多个方向摊成一张混合页面。',
  },
  '/station/studyabroad': {
    eyebrow: 'student / studyabroad target',
    title: '留学工作站会在下一阶段单独展开。',
    desc: '当前先保留公共模块入口与主路径占位，不伪造不存在的统一流程。',
  },
}

export default function DirectionHoldingPage() {
  const location = useLocation()
  const current = copyMap[location.pathname] || copyMap['/station/kaoyan']

  return (
    <section className="v1-station v1-station--holding">
      <div className="v1-panel">
        <p className="v1-eyebrow">{current.eyebrow}</p>
        <h1>{current.title}</h1>
        <p className="v1-lead">{current.desc}</p>
        <div className="v1-action-row">
          <Link className="v1-btn v1-btn--primary" to="/community">
            先看社区
          </Link>
          <Link className="v1-btn" to="/practice">
            先看题库
          </Link>
          <Link className="v1-btn" to="/profile">
            回个人中心
          </Link>
        </div>
      </div>
    </section>
  )
}
