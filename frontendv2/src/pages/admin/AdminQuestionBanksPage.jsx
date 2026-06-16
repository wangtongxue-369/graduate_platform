import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminQuestionBankApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import AdminQuestionBankGrid from '@/components/practice/AdminQuestionBankGrid.jsx'
import AdminQuestionBankToolbar from '@/components/practice/AdminQuestionBankToolbar.jsx'

const emptyBankForm = {
  name: '',
  target: '',
  subject: '',
  difficulty: 'middle',
  description: '',
}

export default function AdminQuestionBanksPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(0)
  const [payload, setPayload] = useState({ content: [], totalPages: 0 })
  const [editingBank, setEditingBank] = useState(null)
  const [form, setForm] = useState(emptyBankForm)
  const [message, setMessage] = useState('')

  async function loadBanks(nextPage = page) {
    const data = await adminQuestionBankApi.banks(nextPage, 20, token)
    setPayload(data || { content: [], totalPages: 0 })
  }

  useEffect(() => {
    loadBanks().catch((error) => setMessage(error.message || '题库治理总览加载失败。'))
  }, [page, token])

  function handleCreate() {
    setEditingBank({ id: null })
    setForm(emptyBankForm)
  }

  function handleEdit(bank) {
    setEditingBank(bank)
    setForm({
      name: bank.name || '',
      target: bank.target || '',
      subject: bank.subject || '',
      difficulty: bank.difficulty || 'middle',
      description: bank.description || '',
    })
  }

  async function handleSaveBank(event) {
    event.preventDefault()

    if (editingBank?.id) {
      await adminQuestionBankApi.updateBank(editingBank.id, form, token)
      setMessage('题库已更新。')
    } else {
      await adminQuestionBankApi.createBank(form, token)
      setMessage('题库已创建。')
    }

    setEditingBank(null)
    setForm(emptyBankForm)
    await loadBanks()
  }

  async function handleToggle(bank) {
    const nextStatus = bank.active !== false ? 'inactive' : 'active'
    await adminQuestionBankApi.toggleBankStatus(bank.id, nextStatus, token)
    setMessage('题库状态已更新。')
    await loadBanks()
  }

  async function handleDelete(bankId) {
    await adminQuestionBankApi.deleteBank(bankId, token)
    setMessage('题库已删除。')
    await loadBanks()
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="题库治理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '题库治理' },
          ]}
          title="题库治理总台"
          lead="先在总览页处理题库级动作，再进入单题库工作区处理题目、导入和快照。"
        />

        {message ? <div className="v2-status-note">{message}</div> : null}

        <AdminQuestionBankToolbar onCreate={handleCreate} />
        <AdminQuestionBankGrid
          banks={payload.content}
          page={page}
          totalPages={payload.totalPages}
          onPageChange={setPage}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      </div>

      <aside className="v2-side-column">
        {editingBank ? (
          <section className="v2-side-card v2-practice-drawer">
            <div className="v2-section-head">
              <div>
                <p className="v2-kicker">题库编辑</p>
                <h3>{editingBank.id ? `编辑题库 #${editingBank.id}` : '新建题库'}</h3>
              </div>
              <button className="v2-secondary-link" type="button" onClick={() => setEditingBank(null)}>关闭</button>
            </div>

            <form className="v2-filter-form" onSubmit={handleSaveBank}>
              <label className="v2-field">
                <span>题库名称</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="v2-field">
                <span>方向</span>
                <input value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))} />
              </label>
              <label className="v2-field">
                <span>科目</span>
                <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
              </label>
              <label className="v2-field">
                <span>难度</span>
                <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}>
                  <option value="easy">基础</option>
                  <option value="middle">进阶</option>
                  <option value="hard">冲刺</option>
                </select>
              </label>
              <label className="v2-field">
                <span>描述</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <div className="v2-inline-actions">
                <button className="v2-primary-link" type="submit">保存题库</button>
              </div>
            </form>
          </section>
        ) : (
          <section className="v2-side-card">
            <p className="v2-kicker">治理提示</p>
            <div className="v2-check-list">
              <article className="v2-check-row">
                <strong>总览页处理题库级动作</strong>
                <span>新建、编辑、上下架和删除都在这里完成。</span>
              </article>
              <article className="v2-check-row">
                <strong>工作区处理题目级动作</strong>
                <span>单题库详情页负责题目编辑、导入和快照回看。</span>
              </article>
            </div>
          </section>
        )}
      </aside>
    </>
  )
}
