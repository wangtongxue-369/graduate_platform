import { communityAttachmentOptions } from '@/lib/communityUi.js'

export default function CommunityFilterPanel({
  keywordInput,
  activeAttachment,
  onKeywordChange,
  onSubmit,
  onAttachmentChange,
}) {
  return (
    <section className="v2-side-card">
      <p className="v2-kicker">目录筛选</p>
      <form className="v2-filter-form" onSubmit={onSubmit}>
        <label className="v2-field">
          <span>关键词</span>
          <input
            type="text"
            value={keywordInput}
            placeholder="搜索标题、正文或标签"
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>

        <label className="v2-field">
          <span>附件筛选</span>
          <div className="v2-segment-group" role="group" aria-label="附件筛选">
            {communityAttachmentOptions.map((item) => (
              <button
                key={item.value}
                className={`v2-segment-button ${activeAttachment === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => onAttachmentChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </label>

        <button className="v2-sidebar-button" type="submit">更新目录</button>
      </form>
    </section>
  )
}
