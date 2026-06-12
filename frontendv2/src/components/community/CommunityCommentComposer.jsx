export default function CommunityCommentComposer({
  mode,
  target,
  targetPreview,
  value,
  acting,
  onChange,
  onReset,
  onSubmit,
}) {
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

  return (
    <div className="v2-comment-editor">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">评论编辑器</p>
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

      {target ? (
        <div className="v2-status-note">
          <strong>回复目标</strong>
          <p>{`当前目标：${target.authorName || '匿名用户'}`}</p>
          <span>{targetPreview || '请选择要继续处理的评论内容。'}</span>
        </div>
      ) : null}

      <label className="v2-field">
        <span>{mode === 'edit' ? '修改内容' : '输入评论'}</span>
        <textarea
          rows="6"
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
