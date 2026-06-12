import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { getStudentStationPath } from '@/lib/roleRouting.js'

const roleOptions = [
  {
    key: 'kaoyan',
    label: '考研',
    eyebrow: 'study planning',
    desc: '进入考研主站，查看院校比较、学习计划、资料架和陪跑协同。',
  },
  {
    key: 'kaogong',
    label: '考公',
    eyebrow: 'exam pipeline',
    desc: '进入考公主站，查看岗位匹配、分数线账本、考试日历与模拟面试。',
  },
  {
    key: 'job',
    label: '就业',
    eyebrow: 'career station',
    desc: '进入就业主站，查看简历中心、岗位推荐、投递跟踪和招聘会目录。',
  },
  {
    key: 'liuxue',
    label: '留学',
    eyebrow: 'overseas roadmap',
    desc: '进入留学主站，查看项目目录、案例档案、申请路线和材料清单。',
  },
  {
    key: 'admin',
    label: '管理员',
    eyebrow: 'governance desk',
    desc: '进入管理员总台，查看社区治理、题库治理、考研考公治理与就业运营。',
  },
]

function resolveLandingPath(roleKey) {
  if (roleKey === 'admin') return '/admin'
  return getStudentStationPath(roleKey)
}

export default function RoleAuthDialog({
  standalone = false,
  onRequestClose,
  title = '选择进入的工作语境',
  description = '这里先解锁方向入口，方便你在不接后端真实登录的前提下切换不同主站效果。',
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
      aria-labelledby="v2-role-auth-title"
      aria-modal="true"
      className={`v2-role-auth-dialog ${standalone ? 'is-standalone' : ''}`}
      role="dialog"
    >
      <div className="v2-role-auth-head">
        <div>
          <p className="v2-kicker">身份入口</p>
          <h1 id="v2-role-auth-title">{title}</h1>
          <p className="v2-lead">{description}</p>
        </div>
        {!standalone ? (
          <button
            aria-label="关闭身份选择"
            className="v2-role-auth-close"
            onClick={handleClose}
            type="button"
          >
            关闭
          </button>
        ) : null}
      </div>

      <div className="v2-role-auth-meta">
        <span>点击任一身份后，直接进入对应主站。</span>
        <span>退出登录后，会回到游客状态，只保留社区与题库浏览。</span>
      </div>

      <div className="v2-role-auth-grid">
        {roleOptions.map((item) => (
          <button
            className={`v2-role-auth-card ${submittingKey === item.key ? 'is-pending' : ''}`}
            key={item.key}
            onClick={() => handleSelect(item.key)}
            type="button"
          >
            <span className="v2-role-auth-card-kicker">{item.eyebrow}</span>
            <strong>{item.label}</strong>
            <p>{item.desc}</p>
            <span className="v2-role-auth-card-foot">
              {submittingKey === item.key ? '正在进入' : '进入该主站'}
            </span>
          </button>
        ))}
      </div>

      <div className="v2-role-auth-actions">
        <button className="v2-secondary-link" onClick={handleClose} type="button">
          继续游客浏览
        </button>
      </div>
    </section>
  )

  if (standalone) {
    return <main className="v2-role-auth-screen">{dialog}</main>
  }

  return (
    <div className="v2-role-auth-backdrop" onClick={handleClose}>
      <div onClick={(event) => event.stopPropagation()}>{dialog}</div>
    </div>
  )
}
