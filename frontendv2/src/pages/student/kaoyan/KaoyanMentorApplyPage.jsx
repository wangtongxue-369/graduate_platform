import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [form, setForm] = useState(createEmptyMentorProfileForm())
  const [profile, setProfile] = useState(null)
  const [notice, setNotice] = useState(previewDataNotice('学长学姐入驻'))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

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
      setNotice('学长学姐入驻信息已提交。')
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

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="学长学姐入驻"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '陪跑协同', to: '/station/kaoyan/support' },
            { label: '学长学姐入驻' },
          ]}
          title="把你的上岸经验整理成可持续回答别人的一份公开履历。"
          lead="这里不再弹旧版模态框，而是把入驻资料、当前状态和注销动作拆成独立工作页。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/support/messages">查看咨询消息</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步入驻资料…</div> : null}

        <section className="v2-summary-strip" aria-label="入驻摘要">
          <article className="v2-summary-card">
            <span>当前状态</span>
            <strong>{profile ? '已入驻' : '未入驻'}</strong>
            <p>保存后即可出现在陪跑协同的咨询池中。</p>
          </article>
          <article className="v2-summary-card">
            <span>展示院校</span>
            <strong>{form.graduateSchool || '待补充'}</strong>
            <p>建议填写你最有把握回答问题的学校和专业方向。</p>
          </article>
          <article className="v2-summary-card">
            <span>擅长科目</span>
            <strong>{form.expertiseSubjects || '待补充'}</strong>
            <p>尽量写清楚是公共课还是专业课，方便别人筛选。</p>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">入驻表单</p>
          <form className="v2-filter-form" onSubmit={handleSubmit}>
            <label className="v2-field">
              <span>昵称</span>
              <input
                type="text"
                value={form.nickname}
                onChange={(event) => setForm((current) => ({ ...current, nickname: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>毕业院校</span>
              <input
                type="text"
                value={form.graduateSchool}
                onChange={(event) => setForm((current) => ({ ...current, graduateSchool: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>入学年份</span>
              <input
                type="text"
                value={form.enrollmentYear}
                onChange={(event) => setForm((current) => ({ ...current, enrollmentYear: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业方向</span>
              <input
                type="text"
                value={form.major}
                onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>擅长科目</span>
              <input
                type="text"
                value={form.expertiseSubjects}
                onChange={(event) => setForm((current) => ({ ...current, expertiseSubjects: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>考试科目</span>
              <input
                type="text"
                value={form.examSubjects}
                onChange={(event) => setForm((current) => ({ ...current, examSubjects: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>个人简介</span>
              <textarea
                rows={5}
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              />
            </label>
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
          </form>
        </section>
      </aside>
    </>
  )
}
