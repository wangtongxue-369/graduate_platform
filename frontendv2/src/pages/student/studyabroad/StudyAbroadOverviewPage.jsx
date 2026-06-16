import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadActionPanel from '@/components/studyabroad/StudyAbroadActionPanel.jsx'
import StudyAbroadApplicationEditorDrawer from '@/components/studyabroad/StudyAbroadApplicationEditorDrawer.jsx'
import StudyAbroadCaseSubmitModal from '@/components/studyabroad/StudyAbroadCaseSubmitModal.jsx'
import StudyAbroadCommandDeck from '@/components/studyabroad/StudyAbroadCommandDeck.jsx'
import StudyAbroadExperienceComposerDrawer from '@/components/studyabroad/StudyAbroadExperienceComposerDrawer.jsx'
import StudyAbroadMaterialEditorDrawer from '@/components/studyabroad/StudyAbroadMaterialEditorDrawer.jsx'
import StudyAbroadTimelineEditorModal from '@/components/studyabroad/StudyAbroadTimelineEditorModal.jsx'
import {
  buildAdmissionCasePayload,
  buildApplicationPayload,
  buildExperiencePayload,
  buildMaterialPayload,
  buildTimelinePayload,
  createEmptyStudyAbroadApplicationForm,
  createEmptyStudyAbroadCaseForm,
  createEmptyStudyAbroadExperienceForm,
  createEmptyStudyAbroadMaterialForm,
  createEmptyStudyAbroadTimelineForm,
} from '@/lib/studyabroad/studyAbroadForms.js'
import {
  buildOverviewState,
  createFallbackApplications,
  createFallbackCases,
  createFallbackExperiences,
  createFallbackMaterials,
  createFallbackPrograms,
  createFallbackTimeline,
  normalizeApplications,
  normalizeCasesPage,
  normalizeExperiencesPage,
  normalizeMaterialItems,
  normalizeProgramsPage,
  normalizeTimelineItems,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [programs, setPrograms] = useState(createFallbackPrograms())
  const [cases, setCases] = useState(createFallbackCases())
  const [applications, setApplications] = useState(createFallbackApplications())
  const [timeline, setTimeline] = useState(createFallbackTimeline())
  const [materials, setMaterials] = useState(createFallbackMaterials())
  const [experiences, setExperiences] = useState(createFallbackExperiences())
  const [notice, setNotice] = useState(previewDataNotice('留学总览'))
  const [applicationDrawerOpen, setApplicationDrawerOpen] = useState(false)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [materialDrawerOpen, setMaterialDrawerOpen] = useState(false)
  const [experienceDrawerOpen, setExperienceDrawerOpen] = useState(false)
  const [caseModalOpen, setCaseModalOpen] = useState(false)
  const [applicationForm, setApplicationForm] = useState(createEmptyStudyAbroadApplicationForm())
  const [timelineForm, setTimelineForm] = useState(createEmptyStudyAbroadTimelineForm(applications))
  const [materialForm, setMaterialForm] = useState(createEmptyStudyAbroadMaterialForm(applications))
  const [experienceForm, setExperienceForm] = useState(createEmptyStudyAbroadExperienceForm())
  const [caseForm, setCaseForm] = useState(createEmptyStudyAbroadCaseForm())

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setNotice(previewDataNotice('留学总览'))
        return
      }

      try {
        const [programData, caseData, applicationData, timelineData, materialData, experienceData] = await withRequestTimeout(
          Promise.all([
            studyAbroadApi.schoolProgramsPage({ page: 0, size: 8 }),
            studyAbroadApi.admissionCasesPage({ page: 0, size: 8 }),
            studyAbroadApi.applications(token),
            studyAbroadApi.timeline(token),
            studyAbroadApi.materials(token),
            studyAbroadApi.experiencesPage({ page: 0, size: 8 }),
          ]),
          8000,
          '留学总览数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const nextPrograms = normalizeProgramsPage(programData).content
        const nextCases = normalizeCasesPage(caseData).content
        const nextApplications = normalizeApplications(applicationData)
        const nextTimeline = normalizeTimelineItems(timelineData)
        const nextMaterials = normalizeMaterialItems(materialData)
        const nextExperiences = normalizeExperiencesPage(experienceData).content

        setPrograms(nextPrograms)
        setCases(nextCases)
        setApplications(nextApplications)
        setTimeline(nextTimeline)
        setMaterials(nextMaterials)
        setExperiences(nextExperiences)
        setNotice(remoteDataNotice('留学总览'))
      } catch (error) {
        if (!active) return
        setNotice(fallbackDataNotice('留学总览', error))
      }
    }

    loadOverview()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  useEffect(() => {
    setTimelineForm((current) => {
      if (current.applicationId || !applications.length) return current
      return createEmptyStudyAbroadTimelineForm(applications)
    })
    setMaterialForm((current) => {
      if (current.applicationId || !applications.length) return current
      return createEmptyStudyAbroadMaterialForm(applications)
    })
  }, [applications])

  const overviewState = useMemo(() => buildOverviewState({
    programs,
    cases,
    applications,
    timeline,
    materials,
    experiences,
  }), [programs, cases, applications, timeline, materials, experiences])

  async function handleCreateApplication() {
    const payload = buildApplicationPayload(applicationForm)
    const created = canUseRemote
      ? await studyAbroadApi.createApplication(payload, token)
      : { ...payload, id: Date.now() }
    setApplications((current) => [normalizeApplications([created])[0], ...current])
    setApplicationForm(createEmptyStudyAbroadApplicationForm())
    setApplicationDrawerOpen(false)
    setNotice('申请项目已加入总览。')
  }

  async function handleCreateTimeline() {
    const payload = buildTimelinePayload(timelineForm)
    const created = canUseRemote
      ? await studyAbroadApi.createTimeline(payload, token)
      : { ...payload, id: Date.now(), applicationSchool: applications.find((item) => String(item.id) === String(payload.applicationId))?.school || '' }
    setTimeline((current) => [normalizeTimelineItems([created])[0], ...current])
    setTimelineForm(createEmptyStudyAbroadTimelineForm(applications))
    setTimelineModalOpen(false)
    setNotice('时间线节点已加入总览。')
  }

  async function handleCreateMaterial() {
    const payload = buildMaterialPayload(materialForm)
    const created = canUseRemote
      ? await studyAbroadApi.createMaterial(payload, token)
      : { ...payload, id: Date.now(), attachments: [] }
    setMaterials((current) => [normalizeMaterialItems([created])[0], ...current])
    setMaterialForm(createEmptyStudyAbroadMaterialForm(applications))
    setMaterialDrawerOpen(false)
    setNotice('材料条目已加入总览。')
  }

  async function handleCreateExperience() {
    const payload = buildExperiencePayload(experienceForm)
    const created = canUseRemote
      ? await studyAbroadApi.createExperience(payload, token)
      : { ...payload, id: Date.now(), authorId: 9, createdAt: new Date().toISOString() }
    setExperiences((current) => [normalizeExperiencesPage({ content: [created] }).content[0], ...current])
    setExperienceForm(createEmptyStudyAbroadExperienceForm())
    setExperienceDrawerOpen(false)
    setNotice('经验内容已发布。')
  }

  async function handleCreateCase() {
    const payload = buildAdmissionCasePayload(caseForm)
    const created = canUseRemote
      ? await studyAbroadApi.createAdmissionCase(payload, token)
      : { ...payload, id: Date.now(), authorId: 9 }
    setCases((current) => [normalizeCasesPage({ content: [created] }).content[0], ...current])
    setCaseForm(createEmptyStudyAbroadCaseForm())
    setCaseModalOpen(false)
    setNotice('案例样本已提交。')
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="留学总览"
          title="先看推进态势，再决定去哪个子页继续把申请往前推。"
          lead="Command Deck 把申请、风险、目录和案例放进同一张调度视图。"
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <StudyAbroadCommandDeck
          summaryItems={overviewState.summaryItems}
          lanes={overviewState.lanes}
          programPreview={overviewState.programPreview}
          casePreview={overviewState.casePreview}
          riskItems={overviewState.riskItems}
        />
      </div>
      <aside className="v2-side-column">
        <StudyAbroadActionPanel
          onCreateApplication={() => setApplicationDrawerOpen(true)}
          onCreateTimeline={() => setTimelineModalOpen(true)}
          onCreateMaterial={() => setMaterialDrawerOpen(true)}
          onCreateExperience={() => setExperienceDrawerOpen(true)}
          onCreateCase={() => setCaseModalOpen(true)}
        />
        <StudyAbroadApplicationEditorDrawer
          open={applicationDrawerOpen}
          form={applicationForm}
          editingItem={null}
          onChange={setApplicationForm}
          onSubmit={handleCreateApplication}
          onClose={() => setApplicationDrawerOpen(false)}
        />
        <StudyAbroadMaterialEditorDrawer
          open={materialDrawerOpen}
          applications={applications}
          form={materialForm}
          onChange={setMaterialForm}
          onSubmit={handleCreateMaterial}
          onClose={() => setMaterialDrawerOpen(false)}
        />
        <StudyAbroadExperienceComposerDrawer
          open={experienceDrawerOpen}
          form={experienceForm}
          editingItem={null}
          onChange={setExperienceForm}
          onSubmit={handleCreateExperience}
          onClose={() => setExperienceDrawerOpen(false)}
        />
      </aside>

      <StudyAbroadTimelineEditorModal
        open={timelineModalOpen}
        applications={applications}
        form={timelineForm}
        onChange={setTimelineForm}
        onSubmit={handleCreateTimeline}
        onClose={() => setTimelineModalOpen(false)}
      />
      <StudyAbroadCaseSubmitModal
        open={caseModalOpen}
        form={caseForm}
        onChange={setCaseForm}
        onSubmit={handleCreateCase}
        onClose={() => setCaseModalOpen(false)}
      />
    </>
  )
}
