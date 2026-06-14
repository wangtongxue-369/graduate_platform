import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminMaterialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'all', label: '全部' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
]

export default function AdminKaoyanMaterialsPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  async function loadMaterials(nextTab = activeTab) {
    setLoading(true)
    try {
      let data
      if (nextTab === 'pending') {
        data = await adminMaterialApi.pending({ page: 0, size: 12 }, token)
      } else if (nextTab === 'all') {
        data = await adminMaterialApi.listPage({ page: 0, size: 12 }, token)
      } else {
        data = await adminMaterialApi.listPage({ status: nextTab, page: 0, size: 12 }, token)
      }
      setRows(data?.content || [])
      setNotice('资料审核队列已同步。')
    } catch (error) {
      setRows([])
      setNotice(error.message || '资料审核队列加载失败。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMaterials(activeTab)
  }, [activeTab, token])

  async function handleReview(id, status) {
    try {
      await adminMaterialApi.review(id, status, token)
      await loadMaterials(activeTab)
    } catch (error) {
      setNotice(error.message || '资料审核操作失败。')
    }
  }

  async function handleDelete(id) {
    try {
      await adminMaterialApi.delete(id, token)
      await loadMaterials(activeTab)
    } catch (error) {
      setNotice(error.message || '资料删除失败。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料审核"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理', to: '/admin/kaoyan' },
            { label: '资料审核' },
          ]}
          title="把待审、通过和拒绝的资料拆成明确队列，而不是继续沿用旧版混排卡片。"
          lead="切换状态时只刷新当前队列，审核动作也就地完成，不需要跳回总览。"
          actions={<Link className="v2-secondary-link" to="/admin/kaoyan">返回考研治理总览</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-side-card">
          <div className="v2-segment-group" role="group" aria-label="资料审核状态">
            {tabs.map((item) => (
              <button
                className={`v2-segment-button ${activeTab === item.key ? 'is-active' : ''}`}
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? <div className="v2-status-note">正在同步资料审核队列…</div> : null}

        <section className="v2-card-grid" aria-label="资料审核列表">
          {rows.map((item) => (
            <article className="v2-module-card" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.school || '院校待补充'} / {item.major || '专业待补充'}</p>
              <p>{item.subject || '科目待补充'} / {item.materialType || '类型待补充'}</p>
              <p>{item.description || '暂无资料说明。'}</p>
              <div className="v2-tag-row">
                <span>{item.status || 'PENDING'}</span>
                <span>附件 {item.attachments?.length || 0}</span>
              </div>
              <div className="v2-inline-actions">
                {item.status === 'PENDING' ? (
                  <>
                    <button className="v2-segment-button is-active" type="button" onClick={() => handleReview(item.id, 'APPROVED')}>
                      通过
                    </button>
                    <button className="v2-segment-button" type="button" onClick={() => handleReview(item.id, 'REJECTED')}>
                      拒绝
                    </button>
                  </>
                ) : null}
                <button className="v2-segment-button" type="button" onClick={() => handleDelete(item.id)}>
                  删除资料
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? <article className="v2-module-card"><p>当前状态下没有资料记录。</p></article> : null}
        </section>
      </div>
    </>
  )
}
