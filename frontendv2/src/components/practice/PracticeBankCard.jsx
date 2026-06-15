import { Link } from 'react-router-dom'

const targetLabelMap = {
  kaoyan: '考研',
  kaogong: '考公',
  job: '就业',
  liuxue: '留学',
}

const difficultyLabelMap = {
  easy: '基础',
  middle: '进阶',
  hard: '冲刺',
}

const modeLabelMap = {
  chapter: '章节',
  random: '随机',
  mock: '模考',
  wrong_retry: '错题重练',
}

export default function PracticeBankCard({ bank }) {
  const modes = bank.supportedModes?.length ? bank.supportedModes : ['chapter', 'random']

  return (
    <Link className="v2-preview-panel v2-practice-bank-card" to={`/practice/banks/${bank.id}`}>
      <div className="v2-preview-panel__head">
        <strong>{bank.name}</strong>
        <span className="v2-inline-link">进入</span>
      </div>

      <p>{bank.description || '进入题库详情页后选择模式并开始练习。'}</p>

      <div className="v2-article-meta">
        <span>{targetLabelMap[bank.target] || bank.target || '通用'}</span>
        <span>{bank.subject || '未分类科目'}</span>
        <span>{difficultyLabelMap[bank.difficulty] || bank.difficulty || '进阶'}</span>
      </div>

      <div className="v2-summary-stack">
        <article className="v2-summary-mini">
          <strong>{bank.questionCount || 0}</strong>
          <span>题目</span>
        </article>
        <article className="v2-summary-mini">
          <strong>{bank.chapterCount || 0}</strong>
          <span>章节</span>
        </article>
        <article className="v2-summary-mini">
          <strong>{modes.length}</strong>
          <span>模式</span>
        </article>
      </div>

      <div className="v2-tag-row">
        {modes.map((mode) => (
          <span key={`${bank.id}-${mode}`}>{modeLabelMap[mode] || mode}</span>
        ))}
      </div>
    </Link>
  )
}
