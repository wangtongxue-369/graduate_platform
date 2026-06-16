export default function StudyAbroadActionPanel({
  onCreateApplication,
  onCreateTimeline,
  onCreateMaterial,
  onCreateExperience,
  onCreateCase,
}) {
  return (
    <section className="v2-side-card" data-testid="studyabroad-action-panel">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">行动面板</p>
          <h3>把低频写入操作收进这里</h3>
        </div>
      </div>
      <div className="v2-inline-actions">
        <button className="v2-segment-button is-active" type="button" onClick={onCreateApplication}>新建申请</button>
        <button className="v2-segment-button" type="button" onClick={onCreateTimeline}>新增时间线节点</button>
        <button className="v2-segment-button" type="button" onClick={onCreateMaterial}>新增材料</button>
        <button className="v2-segment-button" type="button" onClick={onCreateExperience}>发布经验</button>
        <button className="v2-segment-button" type="button" onClick={onCreateCase}>提交案例</button>
      </div>
      <p>总览页保留推进判断，高频创建动作集中在侧栏完成。</p>
    </section>
  )
}
