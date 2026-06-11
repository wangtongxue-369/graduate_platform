import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsPosts } from '@/lib/settingsPreview.js'

export default function SettingsPostsPage() {
  const { token } = useAuth()
  const [posts, setPosts] = useState(createSettingsPosts())
  const [notice, setNotice] = useState('当前显示的是发帖列表预览。')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return
      try {
        const data = await userApi.myPosts(0, 8, token)
        if (!active) return
        setPosts(data?.content?.length ? data.content : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '发帖记录暂时不可用，已切换到预览数据。')
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
        kicker="my posts"
        pathItems={[
          { label: '个人设置', to: '/settings/profile' },
          { label: '我的发帖' },
        ]}
        title="我的发帖"
        lead="对应后端 myPosts 分页结构，列表优先显示状态、分类与回到社区的路径。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-feed-list" aria-label="我的发帖列表">
        {posts.map((post) => (
          <Link className="v2-feed-item" key={post.id} to={`/community/${post.id}`}>
            <div className="v2-feed-index">P</div>
            <div className="v2-feed-body">
              <strong>{post.title}</strong>
              <p>{post.category || '未分类'} / {post.status || 'draft'}</p>
            </div>
            <span className="v2-feed-action">{String(post.createdAt || '').slice(5, 10) || '查看'}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
