export default function CommunityPostActions({
  interactionSummary,
  liked,
  favorited,
  acting,
  onToggleLike,
  onToggleFavorite,
  onReportPost,
}) {
  return (
    <section className="v2-side-card">
      <p className="v2-kicker">帖子操作</p>
      <div className="v2-summary-stack">
        {interactionSummary.map((item) => (
          <div className="v2-summary-mini" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <div className="v2-side-action-stack">
        <button className="v2-primary-link" type="button" disabled={acting} onClick={onToggleLike}>
          {liked ? '取消点赞' : '点赞帖子'}
        </button>
        <button className="v2-secondary-link" type="button" disabled={acting} onClick={onToggleFavorite}>
          {favorited ? '取消收藏' : '收藏帖子'}
        </button>
        <button className="v2-ghost-link v2-ghost-link--danger" type="button" disabled={acting} onClick={onReportPost}>
          举报帖子
        </button>
      </div>
    </section>
  )
}
