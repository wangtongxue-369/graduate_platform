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
  const [messageType, setMessageType] = useState('success')

  function showSuccess(msg) { setMessage(msg); setMessageType('success') }
  function showError(msg) { setMessage(msg); setMessageType('error') }

  async function loadQuestions(nextPage = page) {
    const data = await adminQuestionBankApi.questions(bankId, nextPage, 20, token)
    setQuestions(data || { content: [], totalPages: 0 })
  }

  useEffect(() => {
    loadQuestions().catch((error) => { showError(error.message || '题库工作区加载失败。') })
  }, [bankId, page, token])

  function toggleSelected(id) {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ))
  }

  async function handleSaveQuestion(payload, question) {
    try {
      if (question?.id) {
        await adminQuestionBankApi.updateQuestion(question.id, payload, token)
        showSuccess('题目已更新。')
      } else {
        await adminQuestionBankApi.createQuestion(bankId, payload, token)
        showSuccess('题目已创建。')
      }

      setEditingQuestion(null)
      await loadQuestions()
    } catch (error) {
      showError(error.message || '题目保存失败，请稍后重试。')
    }
  }

  async function handleOpenSnapshots(questionId) {
    try {
      setSnapshotQuestionId(questionId)
      const items = await adminQuestionBankApi.snapshots(questionId, token)
      setSnapshots(items || [])
    } catch (error) {
      showError(error.message || '快照加载失败。')
    }
  }

  async function handleToggleStatus(question) {
    try {
      const nextStatus = question.active !== false ? 'inactive' : 'active'
      await adminQuestionBankApi.toggleQuestionStatus(question.id, nextStatus, token)
      showSuccess('题目状态已更新。')
      await loadQuestions()
    } catch (error) {
      showError(error.message || '题目状态更新失败。')
    }
  }

  async function handleDelete(questionId) {
    try {
      await adminQuestionBankApi.deleteQuestion(questionId, token)
      showSuccess('题目已删除。')
      await loadQuestions()
    } catch (error) {
      showError(error.message || '题目删除失败。')
    }
  }

  async function handleBatchCreate(batchText) {
    try {
      const parsed = JSON.parse(batchText)
      await adminQuestionBankApi.batchCreateQuestions(bankId, parsed, token)
      showSuccess('批量题目已导入。')
      await loadQuestions()
    } catch (error) {
      if (error instanceof SyntaxError) {
        showError('JSON 格式错误，请检查输入内容是否为合法的 JSON 数组。')
      } else {
        showError(error.message || '批量导入失败，请稍后重试。')
      }
    }
  }

  async function handleFileImport(file) {
    try {
      await adminQuestionBankApi.importQuestions(bankId, file, token)
      showSuccess('题库文件已导入。')
      await loadQuestions()
    } catch (error) {
      showError(error.message || '文件导入失败，请检查文件格式是否正确。')
    }
  }

  async function handleBatchStatus(status) {
    try {
      await adminQuestionBankApi.batchUpdateQuestions(selectedIds, { status }, token)
      showSuccess('选中题目状态已批量更新。')
      setSelectedIds([])
      await loadQuestions()
    } catch (error) {
      showError(error.message || '批量状态更新失败。')
    }
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

        {message ? <div className={messageType === 'error' ? 'v2-status-error' : 'v2-status-note'}>{message}</div> : null}

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
