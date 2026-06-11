export default function PageIntro({ kicker, title, lead, actions }) {
  return (
    <section className="v2-article-card v2-article-card--feature">
      {kicker ? <p className="v2-kicker">{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="v2-lead">{lead}</p> : null}
      {actions ? <div className="v2-inline-actions">{actions}</div> : null}
    </section>
  )
}
