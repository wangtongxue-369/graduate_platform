export default function CommunityCommentComposer({
  mode,
  target,
  targetPreview,
  value,
  acting,
  variant = 'panel',
  onChange,
  onReset,
  onSubmit,
}) {
  const isInline = variant === 'inline'
  const isDock = variant === 'dock'
  const composerTitle = mode === 'edit'
    ? '编辑评论'
    : mode === 'reply'
      ? `回复 ${target?.authorName || '当前评论'}`
      : '写评论'

  const submitLabel = mode === 'edit'
    ? '保存修改'
    : mode === 'reply'
      ? '提交回复'
      : '发布评论'

  if (isDock) {
    return (
      <div className="v2-comment-editor v2-comment-editor--dock">
        {mode !== 'new' ? (
          <div className="v2-comment-editor__dock-context">
            <div>
              <strong>{composerTitle}</strong>
              {targetPreview ? <span>{targetPreview}</span> : null}
            </div>
            <button className="v2-ghost-link" type="button" onClick={onReset}>
              {mode === 'reply' ? '取消回复' : '取消编辑'}
            </button>
          </div>
        ) : null}
        <div className="v2-comment-editor__dock-main">
          <label className="v2-comment-editor__dock-field">
            <span className="v2-comment-editor__dock-label">输入评论</span>
            <textarea
              rows="1"
              aria-label="输入评论"
              value={value}
              placeholder="写下你的评论"
              onChange={(event) => onChange(event.target.value)}
            />
          </label>
          <div className="v2-comment-editor__dock-actions">
            {mode === 'new' && value ? (
              <button
                className="v2-ghost-link v2-comment-editor__dock-icon"
                type="button"
                aria-label="重置评论"
                title="重置评论"
                onClick={onReset}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
            <button className="v2-primary-link" type="button" disabled={acting} onClick={onSubmit}>
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`v2-comment-editor ${isInline ? 'v2-comment-editor--inline' : ''}`}>
      <div className="v2-section-head">
        <div>
          {!isInline ? <p className="v2-kicker">评论编辑器</p> : null}
          <h3>{composerTitle}</h3>
        </div>
        {(mode !== 'new' || value) ? (
          <button
            className="v2-ghost-link"
            type="button"
            onClick={onReset}
          >
            {mode === 'reply' ? '取消回复' : mode === 'edit' ? '取消编辑' : '重置'}
          </button>
        ) : null}
      </div>

      {target && !isInline ? (
        <div className="v2-status-note">
          <strong>回复目标</strong>
          <p>{`当前目标：${target.authorName || '匿名用户'}`}</p>
          <span>{targetPreview || '请选择要继续处理的评论内容。'}</span>
        </div>
      ) : null}

      {target && isInline && targetPreview ? (
        <div className="v2-comment-editor__context">
          <strong>{target.authorName || '匿名用户'}</strong>
          <span>{targetPreview}</span>
        </div>
      ) : null}

      <label className="v2-field">
        <span>{mode === 'edit' ? '修改内容' : '输入评论'}</span>
        <textarea
          rows={isInline ? 4 : 6}
          value={value}
          placeholder={mode === 'reply' ? '写下你要回复的内容' : '写下你的评论'}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>

      <div className="v2-inline-actions">
        <button className="v2-primary-link" type="button" disabled={acting} onClick={onSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
