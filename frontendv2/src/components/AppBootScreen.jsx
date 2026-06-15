export default function AppBootScreen({
  title = '正在准备页面',
  message = '正在加载页面模块，请稍候...',
}) {
  return (
    <div aria-label="app-loading" aria-live="polite" className="v2-boot-screen" role="status">
      <section className="v2-boot-card v2-glass-card">
        <p className="v2-kicker">graduate platform</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <div aria-hidden="true" className="v2-boot-pulse" />
      </section>
    </div>
  )
}
