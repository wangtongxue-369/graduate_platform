import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsComments } from '@/lib/settingsPreview.js'

export default function SettingsCommentsPage() {
  const { token } = useAuth()
  const [comments, setComments] = useState(createSettingsComments())
  const [notice, setNotice] = useState('当前显示的是评论记录预览。')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return
      try {
        const data = await userApi.myComments(0, 8, token)
        if (!active) return
        setComments(data?.content?.length ? data.content : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '评论记录暂时不可用，已切换到预览数据。')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="my comments"
        title="我的评论"
        lead="对应后端 myComments 分页结构，强调评论内容与原帖回链。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-check-card">
        <div className="v2-check-list">
          {comments.map((comment) => (
            <div className="v2-check-row" key={comment.id}>
              <strong>{comment.postTitle || '原帖已移除'}</strong>
              <span>{comment.content}</span>
              <Link className="v2-inline-link" to={`/community/${comment.postId || ''}`}>回到原帖</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
