import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { studyAbroadApi } from '../../lib/api.js'
import { countryLabelMap, countryOptions, createLocalId } from './studyAbroadUtils.js'
import '../../App.css'

const countries = ['all', ...countryOptions.filter((item) => item.value !== 'General').map((item) => item.value)]

const resultOptions = [
  { value: 'all', label: '全部结果' },
  { value: 'admit', label: '录取' },
  { value: 'reject', label: '拒信' },
  { value: 'waitlist', label: '候补' },
]

const resultLabelMap = Object.fromEntries(resultOptions.map((item) => [item.value, item.label]))

const emptyForm = {
  applicationYear: '2026',
  studentMajor: '',
  gpa: '',
  rankPercent: '',
  languageType: 'IELTS',
  languageScore: '',
  standardizedScore: '',
  softBackground: '',
  country: 'UK',
  school: '',
  program: '',
  degree: 'Master',
  admissionResult: 'admit',
  scholarship: '',
  applicationMode: 'DIY',
  tags: '',
  summary: '',
  contact: '',
}

const demoCases = [
  {
    id: 'case-ucl-cs',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '计算机科学',
    gpa: '3.72/4.0',
    rankPercent: '前 20%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: 'GRE 324',
    softBackground: '一段科研项目、两段开发实习、一次数学建模竞赛。',
    country: 'UK',
    school: '伦敦大学学院',
    program: 'Computer Science MSc',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['低科研', 'DIY', 'CS'],
    contact: 'wx_admitcase_ucl',
    summary: '课程匹配和项目经历写得比较具体，PS 没有只重复简历，是这次申请里比较关键的一点。',
  },
  {
    id: 'case-hkust-ds',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '软件工程',
    gpa: '88/100',
    rankPercent: '前 15%',
    languageType: 'TOEFL',
    languageScore: '101',
    standardizedScore: '无',
    softBackground: '校内大创、互联网产品实习、数据库课程项目。',
    country: 'Hong Kong',
    school: '香港科技大学',
    program: 'Data-Driven Modeling MSc',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: '中介申请',
    tags: ['港新', '数据方向', '实习突出'],
    contact: 'grad_admit_hkust@qq.com',
    summary: '港校比较看重递交节奏和材料完整度，提前准备成绩单和推荐信能减少后期压力。',
  },
  {
    id: 'case-nus-ai',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '人工智能',
    gpa: '3.48/4.0',
    rankPercent: '前 35%',
    languageType: 'IELTS',
    languageScore: '6.5',
    standardizedScore: '无',
    softBackground: '一段算法实习、两个课程项目，无论文。',
    country: 'Singapore',
    school: '新加坡国立大学',
    program: 'Artificial Intelligence MSc',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: 'DIY',
    tags: ['拒信复盘', '语言偏弱', 'AI'],
    contact: '论坛 ID nus_reject_26',
    summary: '语言和 GPA 都没有优势时，单靠课程项目比较吃亏，建议补强可量化项目或扩大匹配院校范围。',
  },
  {
    id: 'case-columbia-stat',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '统计学',
    gpa: '3.65/4.0',
    rankPercent: '前 10%',
    languageType: 'TOEFL',
    languageScore: '108',
    standardizedScore: 'GRE 328',
    softBackground: '一段量化私募实习（因子研究）、一段券商金工组实习、全国大学生数学竞赛省一。',
    country: 'US',
    school: '哥伦比亚大学',
    program: 'MA in Statistics',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['美硕', '统计', 'GRE 高分', 'DIY'],
    contact: 'wx_columbia_stat25',
    summary: '哥大统计系 MA 项目 STEM 认证，30 学分可选 4 门核心 + 6 门选修。PS 里把实习和竞赛跟课程方向做了很细的映射，三段量化经历是主要加分项。NYC 地理位置对找实习帮助大。',
  },
  {
    id: 'case-edinburgh-ai',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '计算机科学',
    gpa: '3.58/4.0',
    rankPercent: '前 25%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '无',
    softBackground: '两段 Kaggle 比赛（最高银牌）、一段 NLP 方向科研、一个开源项目 200+ star。',
    country: 'UK',
    school: '爱丁堡大学',
    program: 'MSc Artificial Intelligence',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: 'DIY',
    tags: ['拒信复盘', 'AI', '英国', '开源'],
    contact: 'ed_reject_25@163.com',
    summary: '爱丁堡 AI 项目在 Informatics 学院，雅思要求 7.0 单项不低于 6.5。同年申请者背景很强竞争激烈，PS 里对 AI 方向的兴趣点写得不够具体可能是主要问题，建议把科研和开源经历跟目标教授的研究组做对应。',
  },
  {
    id: 'case-melbourne-it',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '信息管理与信息系统',
    gpa: '82/100',
    rankPercent: '前 20%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '无',
    softBackground: '校内全栈开发项目、一段互联网后端实习、蓝桥杯省二。',
    country: 'Australia',
    school: '墨尔本大学',
    program: 'Master of Information Technology',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: '中介申请',
    tags: ['澳洲', 'IT', '跨专业友好'],
    contact: 'wx_melb_it_2026',
    summary: '墨尔本 MIT 项目对非 CS 背景友好（2 年制只需一门编程课），但雅思要求 6.5 单项不低于 6.0，写作小分低于 6.0 会被卡，申请前一定确认语言小分。',
  },
  {
    id: 'case-manchester-ds',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '应用数学',
    gpa: '3.45/4.0',
    rankPercent: '前 30%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '无',
    softBackground: '一段字节跳动数据团队实习、毕业论文涉及机器学习模型。',
    country: 'UK',
    school: '曼彻斯特大学',
    program: 'MSc Data Science',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['英国', '数据科学', '数学背景'],
    contact: 'manc_ds_case@gmail.com',
    summary: '曼大 Data Science 有多个方向（Statistics / CS / Business），选对方向很重要。PS 侧重统计和 ML 课程基础，实习中做的 A/B 测试和特征工程经历匹配度高。注意奖学金需要单独申请，常规录取不自带奖。',
  },
  {
    id: 'case-ntu-fintech',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '金融科技',
    gpa: '3.68/4.0',
    rankPercent: '前 20%',
    languageType: 'IELTS',
    languageScore: '6.5',
    standardizedScore: 'GRE 319',
    softBackground: '量化私募实习（因子回测）、区块链 DeFi 竞赛三等奖、CFA Level 1 通过。',
    country: 'Singapore',
    school: '南洋理工大学',
    program: 'MSc in Financial Technology',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['港新', '金融科技', 'CFA'],
    contact: 'wx_ntu_fintech26',
    summary: 'NTU FinTech 在数理学院 (SPMS) 下，有 IPA 和 DFS 两个 track。项目对量化背景友好，雅思最低 6.0。PS 里把实习经历和未来职业规划做了很清晰的串联，CFA L1 和竞赛增加了金融侧的可信度。',
  },
  {
    id: 'case-ubc-mds',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '数据科学与大数据技术',
    gpa: '83/100',
    rankPercent: '前 30%',
    languageType: 'TOEFL',
    languageScore: '102',
    standardizedScore: '无',
    softBackground: '一段数据标注和清洗实习、课程项目（推荐系统）。',
    country: 'Canada',
    school: '英属哥伦比亚大学',
    program: 'Master of Data Science',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: '中介申请',
    tags: ['拒信复盘', '加拿大', '数据科学'],
    contact: 'ubc_mds_fail@outlook.com',
    summary: 'UBC MDS 是 CS + 统计联合项目，仅 10 个月加速制，毕业可拿 3 年工签。竞争激烈，录取者普遍有 2 年以上工作经验，纯应届背景竞争力偏弱。建议补充更扎实的项目经历或考虑 UBC 其他 CS 研究型项目。',
  },
  {
    id: 'case-cuhk-cs',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '计算机科学与技术',
    gpa: '87/100',
    rankPercent: '前 15%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '无',
    softBackground: '一段腾讯后台开发实习、ACM/ICPC 区域赛银牌、毕业设计涉及分布式系统。',
    country: 'Hong Kong',
    school: '香港中文大学',
    program: 'MSc in Computer Science',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: 'DIY',
    tags: ['港三', 'CS', '竞赛', 'DIY'],
    contact: 'wx_cuhk_cs_offer',
    summary: '港中文 CSE 在工程学院下，雅思要求 6.5+，申请费 HKD 400。11 月底递交，1 月中旬拿到 offer。ACM 银牌和腾讯实习在 CV 里很加分，港三 CS 对竞赛经历认可度高，PS 侧重算法能力的具体体现。',
  },
  {
    id: 'case-uva-ai',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '数学与应用数学',
    gpa: '3.55/4.0',
    rankPercent: '前 25%',
    languageType: 'IELTS',
    languageScore: '6.5',
    standardizedScore: '无',
    softBackground: '一篇计算机视觉方向二作论文（在投）、一段校内实验室科研。',
    country: 'Netherlands',
    school: '阿姆斯特丹大学',
    program: 'MSc Artificial Intelligence',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: 'DIY',
    tags: ['拒信复盘', '欧洲', 'AI', '课程匹配'],
    contact: 'uva_ai_reject26@gmail.com',
    summary: 'UvA AI 是 2 年制（120EC）研究导向项目，在理学院 Informatics Institute 下，雅思要求 7.0 单项 6.5。欧洲项目对课程匹配度要求严格，数学转 AI 即使有科研也补不了先修课缺口。建议提前补修编程和 AI 相关课程。',
  },
  {
    id: 'case-kcl-law',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '法学',
    gpa: '3.65/4.0',
    rankPercent: '前 15%',
    languageType: 'IELTS',
    languageScore: '7.5',
    standardizedScore: 'GRE 320',
    softBackground: '模拟法庭全国赛最佳辩手、法律援助中心志愿者、红圈所非诉实习。',
    country: 'UK',
    school: '伦敦国王学院',
    program: 'LLM International Business Law',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: '中介申请',
    tags: ['英国', '法学', 'LLM', '跨专业'],
    contact: 'wx_kcl_llm25',
    summary: 'KCL 法学 LLM 在 Dickson Poon 法学院下，国际商法是其中一个专业方向。雅思 7.0 单项 6.5。法学跨方向申请（如法本申商法方向）PS 叙事逻辑非常关键，需要讲清为什么选这个方向以及职业规划。红圈所实习对 PS 支撑很大。',
  },
  {
    id: 'case-duke-ece',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '电子信息工程',
    gpa: '3.80/4.0',
    rankPercent: '前 5%',
    languageType: 'TOEFL',
    languageScore: '108',
    standardizedScore: 'GRE 328',
    softBackground: '一段字节跳动推荐系统组实习、MSRA（微软亚洲研究院）实习、两篇顶会 workshop。',
    country: 'US',
    school: '杜克大学',
    program: 'MS in ECE',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: 'Merit-based $5,000',
    applicationMode: 'DIY',
    tags: ['美硕', 'ECE', '顶会', '奖学金', 'DIY'],
    contact: 'duke_ece26@163.com',
    summary: '杜克 ECE 在 Pratt 工程学院下，可选 coursework / project / thesis 三条 track，有 ML、量子计算等多个方向。强推 + 顶会 workshop 在美国申请中加成明显，GRE 328 过线后不再是短板。$5000 是 Merit-based 入学奖。',
  },
  {
    id: 'case-usyd-commerce',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '工商管理',
    gpa: '3.30/4.0',
    rankPercent: '前 40%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: 'GMAT 640',
    softBackground: '校内创业孵化项目（团队负责人）、一段创业公司财务实习。',
    country: 'Australia',
    school: '悉尼大学',
    program: 'Master of Commerce (Finance)',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '无奖学金',
    applicationMode: '中介申请',
    tags: ['澳洲', '商科', '低 GPA 逆袭', 'GMAT'],
    contact: 'wx_usyd_mcom25',
    summary: '悉尼 MCom 在商学院下，Finance 方向 1.5 年制，三重认证（AACSB / EQUIS / AMBA）。雅思 7.0 单项 6.0。GPA 不高但 GMAT 640 弥补了短板，PS 详细写了两段创业实践和商业计划书经历。低 GPA 同学可以考虑用 GMAT 拉分。',
  },
  {
    id: 'case-utokyo-ist',
    authorId: null,
    applicationYear: '2026',
    studentMajor: '通信工程',
    gpa: '3.60/4.0',
    rankPercent: '前 20%',
    languageType: 'IELTS',
    languageScore: '7.0',
    standardizedScore: '无',
    softBackground: '一段校内实验室科研（无线通信优化）、一段索尼中国实习、JLPT N2。',
    country: 'Japan',
    school: '东京大学',
    program: '情報理工学系研究科',
    degree: 'Master',
    admissionResult: 'reject',
    scholarship: '无',
    applicationMode: 'DIY',
    tags: ['拒信复盘', '日本', '研究导向'],
    contact: 'utokyo_ist_26@qq.com',
    summary: '东大情报理工需要参加入学考试（笔试 + 面试），非纯申请制。研究计划书质量是核心，套磁的教授研究方向与自己感兴趣的 ML 应用不太匹配。日本顶尖院校很看研究室 fit，建议提前联系教授确认接收意愿。',
  },
  {
    id: 'case-utoronto-mscac',
    authorId: null,
    applicationYear: '2025',
    studentMajor: '软件工程',
    gpa: '3.75/4.0',
    rankPercent: '前 10%',
    languageType: 'TOEFL',
    languageScore: '105',
    standardizedScore: 'GRE 321',
    softBackground: '一段大厂后端实习、个人开源项目（200+ commits）、校内操作系统课程项目。',
    country: 'Canada',
    school: '多伦多大学',
    program: 'MScAC Applied Computing',
    degree: 'Master',
    admissionResult: 'admit',
    scholarship: '$2,000 CAD Entrance Award',
    applicationMode: 'DIY',
    tags: ['加拿大', 'CS', '带薪实习', 'DIY'],
    contact: 'wx_utm_scac25',
    summary: '多大 MScAC 是 8 个月课程 + 8 个月强制带薪 co-op 实习，在 CS 系下，不要求 GRE。项目对编程能力和工程经验要求较高，PS 里需要写清楚职业规划，开源贡献和系统课项目是主要亮点。',
  },
]

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags
  if (!tags) return []
  return tags.split(',').map((tag) => tag.trim()).filter(Boolean)
}

function resultClass(result) {
  if (result === 'admit') return 'done'
  if (result === 'reject') return 'danger'
  return 'warning'
}

export default function AdmissionCasesPage() {
  const { token, user } = useAuth()
  const isDevMode = token === 'dev-token'
  const canUseRemote = Boolean(token && token !== 'dev-token')
  const [cases, setCases] = useState([])
  const [filters, setFilters] = useState({ country: 'all', result: 'all', major: '', keyword: '' })
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
  const [form, setForm] = useState(emptyForm)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [localCases, setLocalCases] = useState(demoCases)

  const remoteFilters = useMemo(() => ({
    country: filters.country,
    result: filters.result,
    major: filters.major.trim(),
    keyword: filters.keyword.trim(),
  }), [filters.country, filters.keyword, filters.major, filters.result])

  useEffect(() => {
    setPage(0)
  }, [remoteFilters])

  useEffect(() => {
    let active = true

    async function loadCases() {
      setLoading(true)
      try {
        const data = await studyAbroadApi.admissionCasesPage({ ...remoteFilters, page, size: 6 })
        if (!active) return
        setCases(data.content || [])
        setPageInfo({
          page: data.page ?? page,
          size: data.size ?? 6,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || 0,
        })
      } catch (error) {
        if (!active) return
        if (isDevMode) {
          setCases(localCases)
          setPageInfo({ page: 0, size: localCases.length, totalPages: 1, totalElements: localCases.length })
          setNotice('后端案例库暂不可用，当前展示本地演示案例。')
        } else {
          setCases([])
          setPageInfo({ page: 0, size: 6, totalPages: 1, totalElements: 0 })
          setNotice(error.message || '录取案例加载失败，请稍后重试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCases()
    return () => {
      active = false
    }
  }, [isDevMode, localCases, page, remoteFilters])

  const visibleCases = useMemo(() => {
    if (!isDevMode) return cases
    const major = filters.major.trim().toLowerCase()
    const keyword = filters.keyword.trim().toLowerCase()
    return cases.filter((item) => {
      const text = `${item.school} ${item.program} ${item.studentMajor} ${normalizeTags(item.tags).join(' ')}`.toLowerCase()
      return (filters.country === 'all' || item.country === filters.country)
        && (filters.result === 'all' || item.admissionResult === filters.result)
        && (!major || String(item.studentMajor || '').toLowerCase().includes(major))
        && (!keyword || text.includes(keyword))
    })
  }, [cases, filters.country, filters.keyword, filters.major, filters.result, isDevMode])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function canDeleteCase(item) {
    return isDevMode || (canUseRemote && user?.id != null && String(item.authorId) === String(user.id))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    )
    const requiredFields = ['applicationYear', 'studentMajor', 'gpa', 'languageType', 'languageScore', 'country', 'school', 'program', 'degree', 'admissionResult', 'summary']
    if (requiredFields.some((key) => !payload[key])) {
      setNotice('请补全申请年份、背景、成绩、录取学校和案例总结。')
      return
    }

    try {
      if (canUseRemote) {
        const saved = await studyAbroadApi.createAdmissionCase(payload, token)
        setCases((current) => [saved, ...current])
        setPageInfo((current) => ({ ...current, totalElements: current.totalElements + 1 }))
        setNotice('录取案例已匿名发布到后端案例库。')
      } else if (isDevMode) {
        const saved = { ...payload, id: createLocalId('case'), authorId: null, tags: normalizeTags(payload.tags) }
        setLocalCases((current) => [saved, ...current])
        setCases((current) => [saved, ...current])
        setPageInfo((current) => ({ ...current, totalElements: current.totalElements + 1 }))
        setNotice('本地演示案例已创建，正式发布需要登录真实账号。')
      } else {
        setNotice('请先登录，再匿名提交自己的录取或拒信案例。')
        return
      }
      setForm(emptyForm)
    } catch (error) {
      setNotice(error.message || '案例保存失败，请稍后重试。')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('确认删除这条录取案例吗？')) return
    try {
      if (canUseRemote) {
        await studyAbroadApi.deleteAdmissionCase(id, token)
      }
      setCases((current) => current.filter((item) => item.id !== id))
      setLocalCases((current) => current.filter((item) => item.id !== id))
      setPageInfo((current) => ({ ...current, totalElements: Math.max(0, current.totalElements - 1) }))
      setNotice('录取案例已删除。')
    } catch (error) {
      setNotice(error.message || '删除失败，只能删除自己提交的案例。')
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section admission-page">
          <div className="detail-header">
            <div>
              <p className="eyebrow">留学 / 录取案例库</p>
              <h2>匿名校友录取案例库</h2>
              <p className="muted">按国家、结果、专业背景和关键词筛选真实申请结果，帮助学生做选校定位和风险判断。</p>
            </div>
            <Link className="btn ghost" to="/studyabroad">返回工作台</Link>
          </div>

          <div className="feature-card admission-filters">
            <div className="filter-grid">
              <label className="field">
                <span>国家 / 地区</span>
                <select value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })}>
                  {countries.map((item) => (
                    <option key={item} value={item}>{item === 'all' ? '全部国家' : countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>申请结果</span>
                <select value={filters.result} onChange={(event) => setFilters({ ...filters, result: event.target.value })}>
                  {resultOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>本科专业</span>
                <input value={filters.major} placeholder="例如：计算机、软件工程、金融" onChange={(event) => setFilters({ ...filters, major: event.target.value })} />
              </label>
              <label className="field">
                <span>关键词</span>
                <input value={filters.keyword} placeholder="学校、项目、标签" onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} />
              </label>
            </div>
          </div>

          {notice ? (
            <div className="notice-box">
              <strong>案例库状态</strong>
              <p className="muted">{notice}</p>
            </div>
          ) : null}

          <div className="track-grid admission-grid">
            {visibleCases.map((item) => (
              <article className="track-card admission-card" key={item.id}>
                <div className="track-head">
                  <h3>{item.school}</h3>
                  <span className={`study-status ${resultClass(item.admissionResult)}`}>
                    {resultLabelMap[item.admissionResult] || item.admissionResult}
                  </span>
                </div>
                <p className="muted">{item.program} / {item.degree} / {item.applicationYear}</p>
                <div className="case-profile">
                  <span>{item.studentMajor}</span>
                  <span>GPA {item.gpa}</span>
                  <span>{item.languageType} {item.languageScore}</span>
                  <span>{item.standardizedScore || '无标化'}</span>
                </div>
                <p className="muted">{item.summary}</p>
                {item.contact ? (
                  <div className="case-contact">
                    <strong>联系方式</strong>
                    <span>{item.contact}</span>
                  </div>
                ) : null}
                <div className="case-soft">
                  <strong>软背景</strong>
                  <span>{item.softBackground || '暂未补充'}</span>
                </div>
                <div className="tag-row">
                  <span className="tag subtle">{countryLabelMap[item.country] || item.country}</span>
                  <span className="tag subtle">{item.applicationMode || '匿名分享'}</span>
                  {normalizeTags(item.tags).map((tag) => (
                    <span className="tag subtle" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="detail-meta">
                  <span>排名 {item.rankPercent || '未填写'}</span>
                  <span>奖学金 {item.scholarship || '未说明'}</span>
                </div>
                {canDeleteCase(item) ? (
                  <div className="hero-actions experience-card-actions">
                    <button className="btn outline small" type="button" onClick={() => handleDelete(item.id)}>删除案例</button>
                  </div>
                ) : null}
              </article>
            ))}
            {loading ? (
              <div className="notice-box"><p className="muted">正在加载录取案例...</p></div>
            ) : null}
            {!loading && !visibleCases.length ? (
              <div className="feature-card soft">
                <div className="card-title">暂无匹配案例</div>
                <p className="muted">可以放宽筛选条件，或登录后提交第一条本校留学申请案例。</p>
              </div>
            ) : null}
          </div>

          <div className="pagination">
            <span className="pagination-count">共 {pageInfo.totalElements} 条，第 {pageInfo.page + 1} / {pageInfo.totalPages} 页</span>
            <div className="pagination-actions">
              <button className="btn outline small" type="button" disabled={page <= 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
              <button className="btn outline small" type="button" disabled={page + 1 >= pageInfo.totalPages} onClick={() => setPage((current) => current + 1)}>下一页</button>
            </div>
          </div>

          <form className="feature-card admission-form" onSubmit={handleSubmit}>
            <div className="section-head compact">
              <h2>匿名提交录取 / 拒信案例</h2>
              <span className="tag subtle">{canUseRemote ? '后端保存' : isDevMode ? '本地演示' : '登录后提交'}</span>
            </div>
            <div className="filter-grid">
              <label className="field">
                <span>申请年份</span>
                <input value={form.applicationYear} onChange={(event) => updateForm('applicationYear', event.target.value)} />
              </label>
              <label className="field">
                <span>本科专业</span>
                <input value={form.studentMajor} onChange={(event) => updateForm('studentMajor', event.target.value)} />
              </label>
              <label className="field">
                <span>GPA / 均分</span>
                <input value={form.gpa} placeholder="例如：3.6/4.0 或 86/100" onChange={(event) => updateForm('gpa', event.target.value)} />
              </label>
              <label className="field">
                <span>排名区间</span>
                <input value={form.rankPercent} placeholder="例如：前 20%" onChange={(event) => updateForm('rankPercent', event.target.value)} />
              </label>
              <label className="field">
                <span>语言类型</span>
                <select value={form.languageType} onChange={(event) => updateForm('languageType', event.target.value)}>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="Duolingo">Duolingo</option>
                  <option value="Other">其他</option>
                </select>
              </label>
              <label className="field">
                <span>语言成绩</span>
                <input value={form.languageScore} placeholder="例如：7.0 / 101" onChange={(event) => updateForm('languageScore', event.target.value)} />
              </label>
              <label className="field">
                <span>GRE / GMAT</span>
                <input value={form.standardizedScore} placeholder="没有可留空" onChange={(event) => updateForm('standardizedScore', event.target.value)} />
              </label>
              <label className="field">
                <span>国家 / 地区</span>
                <select value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                  {countries.slice(1).map((item) => (
                    <option key={item} value={item}>{countryLabelMap[item] || item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>学校名称</span>
                <input value={form.school} onChange={(event) => updateForm('school', event.target.value)} />
              </label>
              <label className="field">
                <span>项目名称</span>
                <input value={form.program} onChange={(event) => updateForm('program', event.target.value)} />
              </label>
              <label className="field">
                <span>学位</span>
                <select value={form.degree} onChange={(event) => updateForm('degree', event.target.value)}>
                  <option value="Master">硕士</option>
                  <option value="PhD">博士</option>
                  <option value="Bachelor">本科</option>
                  <option value="Exchange">交换</option>
                </select>
              </label>
              <label className="field">
                <span>申请结果</span>
                <select value={form.admissionResult} onChange={(event) => updateForm('admissionResult', event.target.value)}>
                  {resultOptions.slice(1).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>奖学金</span>
                <input value={form.scholarship} placeholder="例如：无 / 半奖 / 全奖" onChange={(event) => updateForm('scholarship', event.target.value)} />
              </label>
              <label className="field">
                <span>申请方式</span>
                <select value={form.applicationMode} onChange={(event) => updateForm('applicationMode', event.target.value)}>
                  <option value="DIY">DIY</option>
                  <option value="中介申请">中介申请</option>
                  <option value="合作项目">合作项目</option>
                </select>
              </label>
              <label className="field">
                <span>标签</span>
                <input value={form.tags} placeholder="低 GPA 逆袭, 跨专业, 全奖" onChange={(event) => updateForm('tags', event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>软背景</span>
              <textarea rows="3" value={form.softBackground} placeholder="科研、实习、竞赛、交换经历等" onChange={(event) => updateForm('softBackground', event.target.value)} />
            </label>
            <label className="field">
              <span>案例总结</span>
              <textarea rows="3" value={form.summary} placeholder="这次申请最关键的优势、遗憾或建议" onChange={(event) => updateForm('summary', event.target.value)} />
            </label>
            <label className="field">
              <span>联系方式（选填，供浏览者联系你）</span>
              <input value={form.contact} placeholder="微信号 / 邮箱 / 其他" onChange={(event) => updateForm('contact', event.target.value)} />
            </label>
            <div className="hero-actions">
              <button className="btn primary" type="submit" disabled={!canUseRemote && !isDevMode}>提交案例</button>
              {!canUseRemote && !isDevMode ? <Link className="btn outline" to="/login">去登录</Link> : null}
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
