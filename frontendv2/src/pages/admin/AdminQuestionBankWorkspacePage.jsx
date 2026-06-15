import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminQuestionBankApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import AdminQuestionBatchPanels from '@/components/practice/AdminQuestionBatchPanels.jsx'
import AdminQuestionEditorDrawer from '@/components/practice/AdminQuestionEditorDrawer.jsx'
import AdminQuestionSnapshotDrawer from '@/components/practice/AdminQuestionSnapshotDrawer.jsx'
import AdminQuestionWorkspaceTable from '@/components/practice/AdminQuestionWorkspaceTable.jsx'

export default function AdminQuestionBankWorkspacePage() {
  const { bankId } = useParams()
  const { token } = useAuth()
  const [page, setPage] = useState(0)
  const [questions, setQuestions] = useState({ content: [], totalPages: 0 })
  const [selectedIds, setSelectedIds] = useState([])
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [snapshotQuestionId, setSnapshotQuestionId] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [message, setMessage] = useState('')

  async function loadQuestions(nextPage = page) {
    const data = await adminQuestionBankApi.questions(bankId, nextPage, 20, token)
    setQuestions(data || { content: [], totalPages: 0 })
  }

  useEffect(() => {
    loadQuestions().catch((error) => setMessage(error.message || '题库工作区加载失败。'))
  }, [bankId, page, token])

  function toggleSelected(id) {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ))
  }

  async function handleSaveQuestion(payload, question) {
    if (question?.id) {
      await adminQuestionBankApi.updateQuestion(question.id, payload, token)
      setMessage('题目已更新。')
    } else {
      await adminQuestionBankApi.createQuestion(bankId, payload, token)
      setMessage('题目已创建。')
    }

    setEditingQuestion(null)
    await loadQuestions()
  }

  async function handleOpenSnapshots(questionId) {
    setSnapshotQuestionId(questionId)
    const items = await adminQuestionBankApi.snapshots(questionId, token)
    setSnapshots(items || [])
  }

  async function handleToggleStatus(question) {
    const nextStatus = question.active !== false ? 'inactive' : 'active'
    await adminQuestionBankApi.toggleQuestionStatus(question.id, nextStatus, token)
    setMessage('题目状态已更新。')
    await loadQuestions()
  }

  async function handleDelete(questionId) {
    await adminQuestionBankApi.deleteQuestion(questionId, token)
    setMessage('题目已删除。')
    await loadQuestions()
  }

  async function handleBatchCreate(batchText) {
    const parsed = JSON.parse(batchText)
    await adminQuestionBankApi.batchCreateQuestions(bankId, parsed, token)
    setMessage('批量题目已导入。')
    await loadQuestions()
  }

  async function handleFileImport(file) {
    await adminQuestionBankApi.importQuestions(bankId, file, token)
    setMessage('题库文件已导入。')
    await loadQuestions()
  }

  async function handleBatchStatus(status) {
    await adminQuestionBankApi.batchUpdateQuestions(selectedIds, { status }, token)
    setMessage('选中题目状态已批量更新。')
    setSelectedIds([])
    await loadQuestions()
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="题库工作区"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '题库治理', to: '/admin/question-banks' },
            { label: `题库 ${bankId}` },
          ]}
          title="题库工作区"
          lead="在单题库上下文中完成题目编辑、批量导入、状态切换和快照回看。"
        />

        {message ? <div className="v2-status-note">{message}</div> : null}

        <AdminQuestionWorkspaceTable
          questions={questions.content}
          selectedIds={selectedIds}
          onToggleSelected={toggleSelected}
          onCreate={() => setEditingQuestion({ bankId: Number(bankId) })}
          onEdit={setEditingQuestion}
          onSnapshots={handleOpenSnapshots}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          page={page}
          totalPages={questions.totalPages}
          onPageChange={setPage}
        />
      </div>

      <aside className="v2-side-column">
        <AdminQuestionEditorDrawer
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveQuestion}
        />
        <AdminQuestionSnapshotDrawer
          questionId={snapshotQuestionId}
          snapshots={snapshots}
          onClose={() => setSnapshotQuestionId(null)}
        />
        <AdminQuestionBatchPanels
          selectedIds={selectedIds}
          onBatchCreate={handleBatchCreate}
          onFileImport={handleFileImport}
          onBatchStatus={handleBatchStatus}
        />
      </aside>
    </>
  )
}
