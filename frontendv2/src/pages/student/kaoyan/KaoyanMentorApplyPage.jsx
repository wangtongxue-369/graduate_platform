import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { mentorApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createEmptyMentorProfileForm,
  normalizeMentorProfile,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'

export default function KaoyanMentorApplyPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [form, setForm] = useState(createEmptyMentorProfileForm())
  const [profile, setProfile] = useState(null)
  const [notice, setNotice] = useState(previewDataNotice('学长学姐入驻'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!canUseRemote) {
        setProfile(null)
        setForm(createEmptyMentorProfileForm())
        setNotice(previewDataNotice('学长学姐入驻'))
        return
      }

      setLoading(true)
      try {
        const data = await mentorApi.myProfile(token)
        if (!active) return
        const normalized = normalizeMentorProfile(data)
        setProfile(data || null)
        setForm(normalized)
        setNotice(remoteDataNotice('学长学姐入驻'))
      } catch (error) {
        if (!active) return
        setProfile(null)
        setForm(createEmptyMentorProfileForm())
        setNotice(fallbackDataNotice('学长学姐入驻', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return
    setShowConfirm(true)
  }

  async function confirmSubmit() {
    setShowConfirm(false)
    setSaving(true)
    try {
      await mentorApi.saveProfile({
        nickname: form.nickname.trim(),
        bio: form.bio.trim(),
        graduateSchool: form.graduateSchool.trim(),
        enrollmentYear: form.enrollmentYear.trim(),
        major: form.major.trim(),
        expertiseSubjects: form.expertiseSubjects.trim(),
        examSubjects: form.examSubjects.trim(),
      }, token)
      setProfile({ ...form })
      navigate('/station/kaoyan/support/mentors')
    } catch (error) {
      setNotice(error.message || '入驻提交失败。')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProfile() {
    if (!canUseRemote || !token) return

    setSaving(true)
    try {
      await mentorApi.deleteProfile(token)
      setProfile(null)
      setForm(createEmptyMentorProfileForm())
      setNotice('学长学姐入驻信息已注销。')
    } catch (error) {
      setNotice(error.message || '注销入驻失败。')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = profile ? '已入驻' : '未入驻'
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="学长学姐入驻"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '1v1咨询', to: '/station/kaoyan/support/mentors' },
            { label: '学长学姐入驻' },
          ]}
          title="学长学姐入驻"
          lead="你的经验，是后来者最好的灯塔。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/mentors">回到 1v1咨询</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/support/messages">查看咨询消息</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步入驻资料…</div> : null}

        <section className="v2-split-board v2-mentor-apply-strip" aria-label="入驻概览">
          <article className="v2-summary-card">
            <span>当前状态</span>
            <strong>{currentStatus}</strong>
            <p>保存后即可出现在 1v1咨询的学长学姐列表中。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前展示重点</span>
            <strong>{form.graduateSchool || form.expertiseSubjects || '待补充'}</strong>
            <p>优先补齐院校、专业方向和擅长科目，方便被检索命中。</p>
          </article>
        </section>

        <section className="v2-article-card v2-mentor-apply-form-card">
          <div className="v2-settings-section-head">
            <p className="v2-kicker">入驻表单</p>
            <h3>完善入驻信息</h3>
            <p>把公开展示字段一次填完整，后续有人检索到你时，会优先看到院校、专业方向、擅长科目和个人简介。</p>
          </div>

          <form className="v2-filter-form v2-mentor-apply-form" onSubmit={handleSubmit}>
            <div className="v2-form-grid">
              <label className="v2-field">
                <span>昵称</span>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
                />
                <small className="v2-field-hint">建议填写在咨询区希望别人看到的称呼。</small>
              </label>
              <label className="v2-field">
                <span>毕业院校</span>
                <input
                  type="text"
                  value={form.graduateSchool}
                  onChange={(event) => setForm((current) => ({ ...current, graduateSchool: event.target.value }))}
                />
                <small className="v2-field-hint">这是搜索结果里最先被看到的院校信息。</small>
              </label>
              <label className="v2-field">
                <span>入学年份</span>
                <input
                  type="text"
                  value={form.enrollmentYear}
                  onChange={(event) => setForm((current) => ({ ...current, enrollmentYear: event.target.value }))}
                />
                <small className="v2-field-hint">方便学弟学妹判断你的经验年份是否足够接近。</small>
              </label>
              <label className="v2-field">
                <span>专业方向</span>
                <input
                  type="text"
                  value={form.major}
                  onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))}
                />
                <small className="v2-field-hint">尽量写到专业或研究方向，不要只写大类。</small>
              </label>
              <label className="v2-field">
                <span>擅长科目</span>
                <input
                  type="text"
                  value={form.expertiseSubjects}
                  onChange={(event) => setForm((current) => ({ ...current, expertiseSubjects: event.target.value }))}
                />
                <small className="v2-field-hint">建议直接写别人会搜的关键词，例如英语复试、政治背诵、调剂规划。</small>
              </label>
              <label className="v2-field">
                <span>考试科目</span>
                <input
                  type="text"
                  value={form.examSubjects}
                  onChange={(event) => setForm((current) => ({ ...current, examSubjects: event.target.value }))}
                />
                <small className="v2-field-hint">补充你实际备考过的科目，帮助别人判断咨询匹配度。</small>
              </label>
            </div>

            <label className="v2-field">
              <span>个人简介</span>
              <textarea
                rows={6}
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              />
              <small className="v2-field-hint">可以重点写上岸经历、擅长回答的问题，以及适合来咨询你的同学类型。</small>
            </label>

            <div className="v2-form-actions">
              <button className="v2-segment-button is-active" disabled={saving || !canUseRemote} type="submit">
                {saving ? '提交中…' : '提交入驻申请'}
              </button>
              <button
                className="v2-segment-button"
                disabled={saving || !profile || !canUseRemote}
                type="button"
                onClick={handleDeleteProfile}
              >
                注销入驻
              </button>
            </div>
          </form>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">当前状态</p>
              <h3>{currentStatus}</h3>
            </div>
          </div>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>展示院校</strong>
              <span>{form.graduateSchool || '待填写'}</span>
            </div>
            <div className="v2-check-row">
              <strong>擅长科目</strong>
              <span>{form.expertiseSubjects || '待填写'}</span>
            </div>
            <div className="v2-check-row">
              <strong>最近动作</strong>
              <span>{profile ? '可继续更新档案，或选择注销入驻。' : '完成主区表单后即可提交入驻。'}</span>
            </div>
          </div>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">展示给谁看</p>
          <ul>
            <li>1v1咨询检索页会优先展示你的院校、专业方向和擅长科目。</li>
            <li>个人简介更适合写你能回答什么问题，而不是只写结果分数。</li>
            <li>如果你主要帮助复试、调剂或跨考，建议在擅长科目里直接写出来。</li>
          </ul>
        </section>

      </aside>

      {showConfirm ? (
        <div className="v2-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="v2-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>确认提交入驻申请</h3>
            <p style={{ margin: '12px 0 20px', color: 'var(--v2-soft-strong)' }}>
              提交后你的资料将出现在 1v1咨询的学长学姐列表中，确认要继续吗？
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="v2-segment-button" type="button" onClick={() => setShowConfirm(false)}>
                再检查一下
              </button>
              <button className="v2-segment-button is-active" type="button" disabled={saving} onClick={confirmSubmit}>
                {saving ? '提交中…' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
