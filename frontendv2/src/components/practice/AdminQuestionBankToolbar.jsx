export default function AdminQuestionBankToolbar({ onCreate }) {
  return (
    <section className="v2-article-card v2-practice-toolbar">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">治理入口</p>
          <h3>先定位题库，再进入单题库工作区处理题目</h3>
        </div>
        <button className="v2-primary-link" type="button" onClick={onCreate}>新建题库</button>
      </div>
    </section>
  )
}
