export default function PreviewBanner({
  children = '当前为结构预览：页面使用后端字段对应的虚拟数据展示最终布局。',
  className = '',
}) {
  return (
    <div className={`v1-preview-banner ${className}`.trim()} role="status">
      {children}
    </div>
  )
}
