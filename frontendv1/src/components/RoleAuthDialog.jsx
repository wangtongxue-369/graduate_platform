import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { getStudentStationPath } from '@/lib/roleRouting.js'

const roleOptions = [
  {
    key: 'kaoyan',
    label: '考研',
    eyebrow: 'study planning',
    desc: '进入考研主站预览，查看学习计划、资料、院校与陪跑功能的展示结构。',
  },
  {
    key: 'kaogong',
    label: '考公',
    eyebrow: 'exam pipeline',
    desc: '进入考公主站预览，查看岗位、分数线、日历提醒与模拟面试的展示结构。',
  },
  {
    key: 'job',
    label: '就业',
    eyebrow: 'career station',
    desc: '进入就业主站预览，查看简历、推荐、岗位详情与投递跟踪的展示结构。',
  },
  {
    key: 'liuxue',
    label: '留学',
    eyebrow: 'overseas roadmap',
    desc: '进入留学主站预览，查看案例、申请、时间线与资料清单的展示结构。',
  },
  {
    key: 'admin',
    label: '管理员',
    eyebrow: 'governance console',
    desc: '进入管理员总台预览，查看审核、举报、用户治理与方向运营面板。',
  },
]

function resolveLandingPath(roleKey) {
  if (roleKey === 'admin') return '/admin'
  return getStudentStationPath(roleKey)
}

export default function RoleAuthDialog({
  standalone = false,
  onRequestClose,
  title = '选择你要进入的工作语境',
  description = '当前登录仅用于结构预览，点击身份后直接进入对应主站；退出时会回到游客门厅。',
}) {
  const navigate = useNavigate()
  const { switchDevUser } = useAuth()
  const [submittingKey, setSubmittingKey] = useState('')

  function handleClose() {
    if (submittingKey) return
    onRequestClose?.()
  }

  function handleSelect(roleKey) {
    if (submittingKey) return
    setSubmittingKey(roleKey)
    switchDevUser(roleKey)
    navigate(resolveLandingPath(roleKey), { replace: true })
  }

  const dialog = (
    <section
      aria-labelledby="v1-role-auth-title"
      aria-modal="true"
      className={`v1-role-auth-dialog ${standalone ? 'is-standalone' : ''}`}
      role="dialog"
    >
      <div className="v1-role-auth-head">
        <div>
          <p className="v1-eyebrow">preview identity gateway</p>
          <h1 id="v1-role-auth-title">{title}</h1>
          <p className="v1-lead">{description}</p>
        </div>
        <button
          aria-label="关闭身份选择"
          className="v1-role-auth-close"
          onClick={handleClose}
          type="button"
        >
          关闭
        </button>
      </div>

      <div className="v1-role-auth-meta">
        <span>点击任一身份后，直接进入对应主站。</span>
        <span>点击退出时，会回到游客门厅。</span>
      </div>

      <div className="v1-role-auth-grid">
        {roleOptions.map((item) => (
          <button
            className={`v1-role-auth-card ${submittingKey === item.key ? 'is-pending' : ''}`}
            key={item.key}
            onClick={() => handleSelect(item.key)}
            type="button"
          >
            <span className="v1-role-auth-card-kicker">{item.eyebrow}</span>
            <strong>{item.label}</strong>
            <p>{item.desc}</p>
            <span className="v1-role-auth-card-foot">
              {submittingKey === item.key ? '正在进入…' : '进入该主站'}
            </span>
          </button>
        ))}
      </div>

      <div className="v1-role-auth-actions">
        <button className="v1-btn" onClick={handleClose} type="button">
          继续游客浏览
        </button>
      </div>
    </section>
  )

  if (standalone) {
    return <main className="v1-role-auth-screen">{dialog}</main>
  }

  return (
    <div className="v1-role-auth-backdrop" onClick={handleClose}>
      <div onClick={(event) => event.stopPropagation()}>{dialog}</div>
    </div>
  )
}
