import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeResultSummary from '@/components/practice/PracticeResultSummary.jsx'
import PracticeSessionNavigator from '@/components/practice/PracticeSessionNavigator.jsx'
import PracticeSessionQuestionCard from '@/components/practice/PracticeSessionQuestionCard.jsx'
import { normalizePracticeQuestion } from '@/lib/practice/normalizers.js'

export default function PracticeSessionPage() {
  const { sessionId } = useParams()
  const { token, isAuthed } = useAuth()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthed || !token || token === 'dev-token') {
      setSession(null)
      setQuestions([])
      setAnswers({})
      setMessage('登录后才可以继续练习会话。')
      return undefined
    }

    let active = true

    async function loadSession() {
      try {
        const data = await practiceApi.session(sessionId, token)
        if (!active) return

        const normalizedQuestions = (data?.questions || []).map(normalizePracticeQuestion)
        setSession(data)
        setQuestions(normalizedQuestions)
        setAnswers(
          normalizedQuestions.reduce((result, question) => {
            if (question.userAnswer) {
              result[question.id] = question.userAnswer
            }
            return result
          }, {}),
        )
        setCurrentIndex(0)
        setMessage('')
      } catch (error) {
        if (!active) return
        setSession(null)
        setQuestions([])
        setAnswers({})
        setMessage(error.message || '练习会话暂时不可用。')
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [isAuthed, sessionId, token])

  const currentQuestion = questions[currentIndex] || null
  const submittedResult = useMemo(() => (
    session?.result
      ? {
          ...session.result,
          wrongQuestions: session.result.wrongQuestions || [],
        }
      : null
  ), [session])

  async function handleAnswer(question, value) {
    if (!session || session.status === 'submitted' || !question) return

    setAnswers((current) => ({ ...current, [question.id]: value }))

    try {
      await practiceApi.saveAnswer(session.id, question.id, value, token)
    } catch (error) {
      setMessage(error.message || '保存答案失败，请稍后重试。')
    }
  }

  async function handleSubmit() {
    if (!session || session.status === 'submitted') return

    try {
      await practiceApi.submitSession(session.id, token)
      const refreshed = await practiceApi.session(session.id, token)
      const normalizedQuestions = (refreshed?.questions || []).map(normalizePracticeQuestion)

      setSession(refreshed)
      setQuestions(normalizedQuestions)
      setMessage('练习已提交，正在展示结果讲评。')
    } catch (error) {
      setMessage(error.message || '交卷失败，请稍后再试。')
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="练习会话"
          pathItems={[
            { label: '题库目录', to: '/practice' },
            { label: `会话 ${sessionId}` },
          ]}
          title="练习会话"
          lead="答题区、导航区和结果讲评会在这一个闭环里切换完成。"
          actions={(
            <div className="v2-inline-actions">
              <Link className="v2-secondary-link" to="/practice/history">练习历史</Link>
              {session?.status !== 'submitted' ? (
                <button className="v2-primary-link" type="button" onClick={handleSubmit}>提交练习</button>
              ) : null}
            </div>
          )}
        />

        {message ? <div className="v2-status-note">{message}</div> : null}

        {!isAuthed || !token || token === 'dev-token' ? (
          <section className="v2-article-card">
            <div className="v2-check-list">
              <article className="v2-check-row">
                <strong>会话需要登录</strong>
                <span>游客可以浏览题库，但会话页只对真实登录用户开放。</span>
              </article>
            </div>
          </section>
        ) : null}

        {session?.status === 'submitted' && submittedResult ? (
          <PracticeResultSummary
            result={submittedResult}
            wrongQuestions={submittedResult.wrongQuestions}
            actions={<Link className="v2-secondary-link" to="/practice/wrong-questions">查看错题回练</Link>}
          />
        ) : null}

        {session?.status !== 'submitted' && currentQuestion ? (
          <PracticeSessionQuestionCard
            question={currentQuestion}
            value={answers[currentQuestion.id]}
            onAnswer={(value) => handleAnswer(currentQuestion, value)}
            isFirst={currentIndex === 0}
            isLast={currentIndex === questions.length - 1}
            onPrev={() => setCurrentIndex(currentIndex - 1)}
            onNext={() => setCurrentIndex(currentIndex + 1)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </div>

      {session?.status !== 'submitted' && questions.length ? (
        <aside className="v2-side-column">
          <PracticeSessionNavigator
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
          <section className="v2-side-card">
            <p className="v2-kicker">会话提示</p>
            <div className="v2-check-list">
              <article className="v2-check-row">
                <strong>自动保存</strong>
                <span>每次切换答案都会调用保存接口。</span>
              </article>
              <article className="v2-check-row">
                <strong>交卷后讲评</strong>
                <span>结果页会展示正确率、得分和错题讲评。</span>
              </article>
            </div>
          </section>
        </aside>
      ) : null}
    </>
  )
}
