import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import MarkdownContent from '../components/MarkdownContent.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { userApi } from '../lib/api.js'
import '../App.css'

const statusLabelMap = {
  inactive: '未激活',
  normal: '正常',
  muted: '禁言',
  upload_limited: '限制上传',
  temporary_locked: '临时锁定',
  banned: '封禁',
  deleting: '注销申请中',
  deleted: '已注销',
}

const rolePermissions = {
  visitor: ['浏览首页公开内容', '查看公开帖子与公告', '按分类筛选公开信息'],
  user: [
    '社区发帖、评论、点赞、收藏、举报',
    '资料上传下载与分类检索',
    '题库练习、错题本、历史统计',
    '学习打卡、提醒订阅、投递跟踪',
  ],
  admin: [
    '审核帖子、评论、资料',
    '处理举报与违规账号',
    '维护题库、分数线、岗位信息',
    '维护分类、标签与提醒规则',
  ],
}

const categoryOptions = [
  { code: 'kaoyan', name: '考研' },
  { code: 'kaogong', name: '考公考编' },
  { code: 'job', name: '就业' },
  { code: 'liuxue', name: '留学' },
  { code: 'experience', name: '经验分享' },
  { code: 'resource', name: '资料互助' },
]

const POST_TITLE_MIN = 6
const POST_TITLE_MAX = 60
const POST_CONTENT_MIN = 20
const POST_CONTENT_MAX = 50000

const defaultForm = {
  name: '',
  school: '',
  major: '',
  grade: '',
  target: 'kaoyan',
  intentRegion: '',
}

const emptyPaged = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 8,
}

function parseBooleanFilter(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

function ProfilePage() {
  const { token, user, isAuthed, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [activeTab, setActiveTab] = useState('posts')

  const [postsData, setPostsData] = useState(emptyPaged)
  const [commentsData, setCommentsData] = useState(emptyPaged)
  const [attemptsData, setAttemptsData] = useState(emptyPaged)
  const [postsPage, setPostsPage] = useState(0)
  const [commentsPage, setCommentsPage] = useState(0)
  const [attemptsPage, setAttemptsPage] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)

  const [editingPost, setEditingPost] = useState(null)
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    categoryCode: 'kaoyan',
    tags: '',
    visibility: 'public',
    anonymous: false,
  })
  const [postSaving, setPostSaving] = useState(false)
  const [postActionMessage, setPostActionMessage] = useState('')
  const postContentLength = postForm.content.trim().length

  const [attemptFilters, setAttemptFilters] = useState({
    correct: 'all',
    keyword: '',
    dateFrom: '',
    dateTo: '',
  })

  const normalizedRole = useMemo(() => {
    const role = (profile?.role || user?.role || 'user').toLowerCase()
    if (role.includes('admin')) return 'admin'
    if (role.includes('visitor')) return 'visitor'
    return 'user'
  }, [profile?.role, user?.role])

  const normalizedStatus = (profile?.status || user?.status || 'normal').toLowerCase()
  const securityInfo = profile?.security || {}

  async function loadProfileAndDashboard() {
    const [profileData, dashboardData] = await Promise.all([
      userApi.profile(token),
      userApi.dashboard(token),
    ])
    setProfile(profileData)
    setDashboard(dashboardData)
    setForm({
      name: profileData?.name || '',
      school: profileData?.school || '',
      major: profileData?.major || '',
      grade: profileData?.grade || '',
      target: profileData?.target || 'kaoyan',
      intentRegion: profileData?.intentRegion || '',
    })
  }

  async function loadPosts(page = postsPage) {
    const data = await userApi.myPosts(page, 8, token)
    setPostsData(data || emptyPaged)
    setPostsPage(data?.number ?? page)
  }

  async function loadComments(page = commentsPage) {
    const data = await userApi.myComments(page, 8, token)
    setCommentsData(data || emptyPaged)
    setCommentsPage(data?.number ?? page)
  }

  async function loadAttempts(page = attemptsPage, filters = attemptFilters) {
    const payload = {
      correct: parseBooleanFilter(filters.correct),
      keyword: filters.keyword.trim() || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }
    const data = await userApi.myAttempts(page, 8, payload, token)
    setAttemptsData(data || emptyPaged)
    setAttemptsPage(data?.number ?? page)
  }

  useEffect(() => {
    let active = true
    async function load() {
      if (!token) return
      setError('')
      try {
        await Promise.all([
          loadProfileAndDashboard(),
          loadPosts(0),
          loadComments(0),
          loadAttempts(0),
        ])
      } catch (err) {
        if (active) setError(err.message || '加载用户信息失败')
      }
    }
    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function refreshActiveTab() {
    if (!token) return
    setHistoryLoading(true)
    setError('')
    try {
      if (activeTab === 'posts') await loadPosts(postsPage)
      if (activeTab === 'comments') await loadComments(commentsPage)
      if (activeTab === 'attempts') await loadAttempts(attemptsPage)
      await loadProfileAndDashboard()
    } catch (err) {
      setError(err.message || '刷新数据失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  function startEdit() {
    setSaveMessage('')
    setEditing(true)
    setForm({
      name: profile?.name || '',
      school: profile?.school || '',
      major: profile?.major || '',
      grade: profile?.grade || '',
      target: profile?.target || 'kaoyan',
      intentRegion: profile?.intentRegion || '',
    })
  }

  function cancelEdit() {
    setEditing(false)
    setSaveMessage('')
    setForm({
      name: profile?.name || '',
      school: profile?.school || '',
      major: profile?.major || '',
      grade: profile?.grade || '',
      target: profile?.target || 'kaoyan',
      intentRegion: profile?.intentRegion || '',
    })
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setSaveMessage('昵称不能为空')
      return
    }
    setSaving(true)
    setSaveMessage('')
    try {
      const updated = await userApi.updateProfile(
        {
          name: form.name.trim(),
          school: form.school.trim(),
          major: form.major.trim(),
          grade: form.grade.trim(),
          target: form.target,
          intentRegion: form.intentRegion.trim(),
        },
        token,
      )
      setProfile(updated)
      setEditing(false)
      setSaveMessage('资料已更新')
    } catch (err) {
      setSaveMessage(err.message || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  function _startEditPost(post) {
    setPostActionMessage('')
    setEditingPost(post)
    setPostForm({
      title: post.title || '',
      content: post.content || '',
      categoryCode: post.categoryCode || 'kaoyan',
      tags: post.tags || '',
      visibility: post.visibility || 'public',
      anonymous: Boolean(post.anonymous),
    })
  }

  function cancelEditPost() {
    setEditingPost(null)
    setPostActionMessage('')
  }

  async function handleSavePost(event) {
    event.preventDefault()
    if (!editingPost) return
    if (postForm.title.trim().length < POST_TITLE_MIN || postForm.title.trim().length > POST_TITLE_MAX) {
      setPostActionMessage(`标题需在 ${POST_TITLE_MIN}-${POST_TITLE_MAX} 个字符之间`)
      return
    }
    if (postContentLength < POST_CONTENT_MIN || postContentLength > POST_CONTENT_MAX) {
      setPostActionMessage(`Markdown 正文需在 ${POST_CONTENT_MIN}-${POST_CONTENT_MAX} 个字符之间`)
      return
    }
    setPostSaving(true)
    setPostActionMessage('')
    try {
      await userApi.updateMyPost(
        editingPost.id,
        {
          title: postForm.title.trim(),
          content: postForm.content.trim(),
          categoryCode: postForm.categoryCode,
          tags: postForm.tags,
          visibility: postForm.visibility,
          anonymous: postForm.anonymous,
        },
        token,
      )
      await loadPosts(postsPage)
      setEditingPost(null)
      setPostActionMessage('帖子已更新')
    } catch (err) {
      setPostActionMessage(err.message || '更新帖子失败')
    } finally {
      setPostSaving(false)
    }
  }

  async function handleDeletePost(postId) {
    const ok = window.confirm('确定删除这条帖子吗？删除后不可恢复。')
    if (!ok) return
    setPostActionMessage('')
    try {
      await userApi.deleteMyPost(postId, token)
      await loadPosts(Math.max(0, postsPage))
      await loadProfileAndDashboard()
      setPostActionMessage('帖子已删除')
    } catch (err) {
      setPostActionMessage(err.message || '删除帖子失败')
    }
  }

  async function handleDeleteComment(commentId) {
    const ok = window.confirm('确定删除这条评论吗？删除后不可恢复。')
    if (!ok) return
    setPostActionMessage('')
    try {
      await userApi.deleteMyComment(commentId, token)
      await loadComments(Math.max(0, commentsPage))
      await loadProfileAndDashboard()
      setPostActionMessage('评论已删除')
    } catch (err) {
      setPostActionMessage(err.message || '删除评论失败')
    }
  }

  async function applyAttemptFilters(event) {
    event.preventDefault()
    setHistoryLoading(true)
    setError('')
    try {
      await loadAttempts(0, attemptFilters)
    } catch (err) {
      setError(err.message || '筛选失败')
    } finally {
      setHistoryLoading(false)
    }
  }

  function renderPager(data, onPrev, onNext) {
    if (!data || (data.totalPages ?? 0) <= 1) return null
    return (
      <div className="comment-actions">
        <button className="btn outline small" type="button" disabled={(data.number ?? 0) <= 0} onClick={onPrev}>
          上一页
        </button>
        <span className="muted">第 {(data.number ?? 0) + 1} / {data.totalPages} 页</span>
        <button
          className="btn outline small"
          type="button"
          disabled={(data.number ?? 0) >= (data.totalPages - 1)}
          onClick={onNext}
        >
          下一页
        </button>
      </div>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">用户中心</p>
            <h2>{profile?.name || user?.name} 的个人面板</h2>
            <p className="muted">{profile?.email || user?.email}</p>
          </div>
          {error ? <div className="error-text">{error}</div> : null}
          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">账号信息管理</div>
              {!editing ? (
                <>
                  <ul className="feature-list compact">
                    <li>昵称：{profile?.name || user?.name || '未设置'}</li>
                    <li>用户名：{profile?.username || user?.username || '未设置'}</li>
                    <li>手机号：{profile?.phone || '未绑定'}</li>
                    <li>邮箱：{profile?.email || user?.email || '未设置'}</li>
                    <li>学校：{profile?.school || '未设置'}</li>
                    <li>专业：{profile?.major || '未设置'}</li>
                    <li>年级：{profile?.grade || '未设置'}</li>
                    <li>目标方向：{profile?.target || user?.target || '未设置'}</li>
                    <li>意向地区：{profile?.intentRegion || '未设置'}</li>
                    <li>账号状态：{statusLabelMap[normalizedStatus] || normalizedStatus}</li>
                  </ul>
                  <div className="comment-actions">
                    <button className="btn outline" type="button" onClick={startEdit}>编辑资料</button>
                    <button className="btn ghost" type="button" onClick={logout}>退出登录</button>
                  </div>
                </>
              ) : (
                <form className="modal-body" onSubmit={handleSaveProfile}>
                  <label className="field">
                    <span>昵称</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                    />
                  </label>
                  <div className="grid-two compact">
                    <label className="field">
                      <span>学校</span>
                      <input
                        type="text"
                        value={form.school}
                        onChange={(event) => setForm({ ...form, school: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>专业</span>
                      <input
                        type="text"
                        value={form.major}
                        onChange={(event) => setForm({ ...form, major: event.target.value })}
                      />
                    </label>
                  </div>
                  <div className="grid-two compact">
                    <label className="field">
                      <span>年级</span>
                      <input
                        type="text"
                        value={form.grade}
                        onChange={(event) => setForm({ ...form, grade: event.target.value })}
                      />
                    </label>
                    <label className="field">
                      <span>目标方向</span>
                      <select
                        value={form.target}
                        onChange={(event) => setForm({ ...form, target: event.target.value })}
                      >
                        <option value="kaoyan">考研</option>
                        <option value="kaogong">考公考编</option>
                        <option value="job">就业</option>
                        <option value="liuxue">留学</option>
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    <span>意向地区</span>
                    <input
                      type="text"
                      value={form.intentRegion}
                      onChange={(event) => setForm({ ...form, intentRegion: event.target.value })}
                    />
                  </label>
                  {saveMessage ? <div className="muted">{saveMessage}</div> : null}
                  <div className="comment-actions">
                    <button className="btn ghost" type="button" onClick={cancelEdit}>取消</button>
                    <button className="btn primary" type="submit" disabled={saving}>
                      {saving ? '保存中...' : '保存资料'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="feature-card metrics">
              <div className="card-title">学习与互动统计</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{dashboard?.postCount ?? 0}</div>
                  <div className="mini-label">发帖数</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{dashboard?.commentCount ?? 0}</div>
                  <div className="mini-label">评论数</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{dashboard?.attemptCount ?? 0}</div>
                  <div className="mini-label">答题数</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{dashboard?.checkinCount ?? 0}</div>
                  <div className="mini-label">打卡数</div>
                </div>
              </div>
              <div className="notice-box">
                <strong>访问角色：{normalizedRole}</strong>
                <p className="muted">权限由账号状态与角色共同控制。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="feature-card">
            <div className="card-title">我的数据管理</div>
            {postActionMessage ? <div className="muted">{postActionMessage}</div> : null}
            <div className="tag-row">
              {[
                { key: 'posts', label: `我的帖子 (${postsData.totalElements || 0})` },
                { key: 'comments', label: `我的评论 (${commentsData.totalElements || 0})` },
                { key: 'attempts', label: `练习记录 (${attemptsData.totalElements || 0})` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`tag tag-btn ${activeTab === item.key ? 'selected' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
              <button className="btn outline small" type="button" onClick={refreshActiveTab} disabled={historyLoading}>
                {historyLoading ? '刷新中...' : '刷新当前列表'}
              </button>
            </div>

            {activeTab === 'posts' ? (
              <>
                {postsData.content?.length ? (
                  <div className="track-grid">
                    {postsData.content.map((item) => (
                      <article className="track-card" key={item.id}>
                        <div className="track-head">
                          <h3>{item.title}</h3>
                          <span className="tag subtle">{item.status}</span>
                        </div>
                        <div className="metric-row">
                          <span>分类 {item.category || '未分类'}</span>
                          <span>浏览 {item.viewCount || 0}</span>
                          <span>评论 {item.commentCount || 0}</span>
                        </div>
                        <div className="metric-row">
                          <span>点赞 {item.likeCount || 0}</span>
                          <span>收藏 {item.favoriteCount || 0}</span>
                        </div>
                        <div className="muted">{item.createdAt?.replace('T', ' ').slice(0, 16)}</div>
                        <div className="comment-actions">
                          <Link className="btn ghost small" to={`/community/${item.id}`}>查看</Link>
                          <Link className="btn outline small" to={`/profile/posts/${item.id}/edit`}>
                            编辑
                          </Link>
                          <button
                            className="btn outline small"
                            type="button"
                            onClick={() => handleDeletePost(item.id)}
                            style={{ color: '#b91c1c', borderColor: '#b91c1c' }}
                          >
                            删除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="muted">暂无帖子记录。</div>
                )}
                {renderPager(
                  postsData,
                  () => loadPosts(Math.max(0, postsPage - 1)),
                  () => loadPosts(postsPage + 1),
                )}
              </>
            ) : null}

            {activeTab === 'comments' ? (
              <>
                {commentsData.content?.length ? (
                  <div className="track-grid">
                    {commentsData.content.map((item) => (
                      <article className="track-card" key={item.id}>
                        <div className="track-head">
                          <h3>评论 #{item.id}</h3>
                          <span className="tag subtle">{item.status}</span>
                        </div>
                        <p className="muted">{item.content}</p>
                        <div className="metric-row">
                          <span>帖子: {item.postTitle || '未知帖子'}</span>
                        </div>
                        <div className="muted">{item.createdAt?.replace('T', ' ').slice(0, 16)}</div>
                        <div className="comment-actions">
                          {item.postId ? <Link className="btn ghost small" to={`/community/${item.postId}`}>查看原帖</Link> : null}
                          <button
                            className="btn outline small"
                            type="button"
                            onClick={() => handleDeleteComment(item.id)}
                            style={{ color: '#b91c1c', borderColor: '#b91c1c' }}
                          >
                            删除评论
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="muted">暂无评论记录。</div>
                )}
                {renderPager(
                  commentsData,
                  () => loadComments(Math.max(0, commentsPage - 1)),
                  () => loadComments(commentsPage + 1),
                )}
              </>
            ) : null}

            {activeTab === 'attempts' ? (
              <>
                <form className="grid-two compact" onSubmit={applyAttemptFilters}>
                  <label className="field">
                    <span>结果筛选</span>
                    <select
                      value={attemptFilters.correct}
                      onChange={(event) => setAttemptFilters({ ...attemptFilters, correct: event.target.value })}
                    >
                      <option value="all">全部</option>
                      <option value="true">仅正确</option>
                      <option value="false">仅错误</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>关键词</span>
                    <input
                      type="text"
                      placeholder="按题干关键词筛选"
                      value={attemptFilters.keyword}
                      onChange={(event) => setAttemptFilters({ ...attemptFilters, keyword: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>开始日期</span>
                    <input
                      type="date"
                      value={attemptFilters.dateFrom}
                      onChange={(event) => setAttemptFilters({ ...attemptFilters, dateFrom: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>结束日期</span>
                    <input
                      type="date"
                      value={attemptFilters.dateTo}
                      onChange={(event) => setAttemptFilters({ ...attemptFilters, dateTo: event.target.value })}
                    />
                  </label>
                  <button className="btn primary small" type="submit" disabled={historyLoading}>
                    {historyLoading ? '筛选中...' : '应用筛选'}
                  </button>
                </form>
                {attemptsData.content?.length ? (
                  <div className="track-grid">
                    {attemptsData.content.map((item) => (
                      <article className="track-card" key={item.id}>
                        <div className="track-head">
                          <h3>题目 #{item.questionId}</h3>
                          <span className="tag subtle">{item.correct ? '正确' : '错误'}</span>
                        </div>
                        <p className="muted">{item.questionStem?.slice(0, 80)}...</p>
                        <div className="metric-row">
                          <span>作答: {item.answer}</span>
                        </div>
                        <div className="muted">{item.createdAt?.replace('T', ' ').slice(0, 16)}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="muted">暂无练习记录。</div>
                )}
                {renderPager(
                  attemptsData,
                  () => loadAttempts(Math.max(0, attemptsPage - 1)),
                  () => loadAttempts(attemptsPage + 1),
                )}
              </>
            ) : null}
          </div>
        </section>

        <section className="section">
          <div className="grid-two">
            <div className="feature-card soft">
              <div className="card-title">角色权限说明</div>
              <div className="permission-group">
                <div className="permission-title">游客权限</div>
                <ul className="feature-list compact">
                  {rolePermissions.visitor.map((item) => (
                    <li key={`visitor-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="permission-group">
                <div className="permission-title">注册用户权限</div>
                <ul className="feature-list compact">
                  {rolePermissions.user.map((item) => (
                    <li key={`user-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="permission-group">
                <div className="permission-title">管理员权限</div>
                <ul className="feature-list compact">
                  {rolePermissions.admin.map((item) => (
                    <li key={`admin-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="feature-card">
              <div className="card-title">账号安全记录</div>
              <ul className="feature-list compact">
                <li>最近登录时间：{securityInfo.lastLoginAt || profile?.lastLoginAt || '暂无记录'}</li>
                <li>最近登录设备：{securityInfo.lastDevice || profile?.lastDevice || '暂无记录'}</li>
                <li>最近登录地点：{securityInfo.lastLocation || profile?.lastLocation || '暂无记录'}</li>
                <li>最近登录 IP：{securityInfo.lastIp || profile?.lastIp || '暂无记录'}</li>
              </ul>
              <div className="notice-box">
                <strong>敏感操作二次校验</strong>
                <p className="muted">修改手机号、绑定邮箱、重置密码建议启用验证码确认。</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {editingPost ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card composer-modal markdown-edit-modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">编辑帖子</div>
                <div className="muted">左侧预览，右侧实时编辑 Markdown 内容</div>
              </div>
              <button className="icon-btn" type="button" onClick={cancelEditPost}>x</button>
            </div>
            <form className="modal-body" onSubmit={handleSavePost}>
              <label className="field">
                <span>标题</span>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(event) => {
                    setPostActionMessage('')
                    setPostForm({ ...postForm, title: event.target.value })
                  }}
                  required
                />
              </label>
              <label className="field">
                <span>分类</span>
                <select
                  value={postForm.categoryCode}
                  onChange={(event) => {
                    setPostActionMessage('')
                    setPostForm({ ...postForm, categoryCode: event.target.value })
                  }}
                >
                  {categoryOptions.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>标签</span>
                <input
                  type="text"
                  value={postForm.tags}
                  onChange={(event) => {
                    setPostActionMessage('')
                    setPostForm({ ...postForm, tags: event.target.value })
                  }}
                />
              </label>
              <div className="grid-two compact">
                <label className="field">
                  <span>可见范围</span>
                  <select
                    value={postForm.visibility}
                    onChange={(event) => {
                      setPostActionMessage('')
                      setPostForm({ ...postForm, visibility: event.target.value })
                    }}
                  >
                    <option value="public">公开可见</option>
                    <option value="members">仅注册用户可见</option>
                  </select>
                </label>
                <label className="switch-item">
                  <input
                    type="checkbox"
                    checked={postForm.anonymous}
                    onChange={(event) => {
                      setPostActionMessage('')
                      setPostForm({ ...postForm, anonymous: event.target.checked })
                    }}
                  />
                  <span>匿名发布</span>
                </label>
              </div>
              <div className="markdown-edit-grid">
                <section className="markdown-edit-pane">
                  <div className="markdown-edit-pane-head">
                    <span>预览</span>
                  </div>
                  <div className="markdown-edit-preview">
                    {postForm.content.trim() ? (
                      <MarkdownContent content={postForm.content} />
                    ) : (
                      <p className="muted">在右侧输入 Markdown 后，这里会实时显示渲染效果。</p>
                    )}
                  </div>
                </section>
                <label className="field markdown-edit-pane">
                  <div className="markdown-edit-pane-head">
                    <span>Markdown 编辑</span>
                    <span className="field-tip">{postContentLength}/{POST_CONTENT_MAX}</span>
                  </div>
                  <textarea
                    className="markdown-edit-textarea"
                    value={postForm.content}
                    onChange={(event) => {
                      setPostActionMessage('')
                      setPostForm({ ...postForm, content: event.target.value })
                    }}
                    required
                  ></textarea>
                </label>
              </div>
              {postActionMessage ? <div className="error-text">{postActionMessage}</div> : null}
              <div className="modal-actions">
                <button className="btn ghost" type="button" onClick={cancelEditPost}>取消</button>
                <button className="btn primary" type="submit" disabled={postSaving}>
                  {postSaving ? '保存中...' : '保存帖子'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  )
}

export default ProfilePage
