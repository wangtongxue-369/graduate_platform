import { useEffect, useState } from 'react'
import { communityAttachmentOptions, communitySortOptions } from '@/lib/communityUi.js'

export default function CommunityFilterPanel({
  categories,
  activeCategory,
  activeSort,
  keywordInput,
  activeAttachment,
  onKeywordChange,
  onSubmit,
  onCategoryChange,
  onSortChange,
  onAttachmentChange,
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(activeAttachment !== 'all')

  useEffect(() => {
    if (activeAttachment !== 'all') {
      setShowAdvancedFilters(true)
    }
  }, [activeAttachment])

  return (
    <section className="v2-side-card">
      <p className="v2-kicker">目录控制</p>
      <form className="v2-filter-form" onSubmit={onSubmit}>
        <div className="v2-field">
          <span>分类</span>
          <div className="v2-chip-group" role="group" aria-label="分类筛选">
            <button
              className={`v2-filter-chip ${activeCategory === '' ? 'is-active' : ''}`}
              type="button"
              onClick={() => onCategoryChange('')}
            >
              全部
            </button>
            {categories.map((item) => (
              <button
                key={item.id || item.code}
                className={`v2-filter-chip ${activeCategory === item.code ? 'is-active' : ''}`}
                type="button"
                onClick={() => onCategoryChange(item.code)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="v2-field">
          <span>排序</span>
          <div className="v2-segment-group" role="group" aria-label="排序方式">
            {communitySortOptions.map((item) => (
              <button
                key={item.value}
                className={`v2-segment-button ${activeSort === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => onSortChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="v2-field">
          <span>关键词</span>
          <input
            type="text"
            value={keywordInput}
            placeholder="搜索标题、正文或标签"
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>

        <button
          className="v2-secondary-link"
          type="button"
          onClick={() => setShowAdvancedFilters((current) => !current)}
        >
          {showAdvancedFilters ? '收起筛选' : '更多筛选'}
        </button>

        {showAdvancedFilters ? (
          <div className="v2-field">
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
          </div>
        ) : null}

        <button className="v2-sidebar-button" type="submit">更新目录</button>
      </form>
    </section>
  )
}
