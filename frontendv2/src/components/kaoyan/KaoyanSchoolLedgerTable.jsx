import { Fragment } from 'react'

function formatRatio(value) {
  if (value === '' || value === null || value === undefined) {
    return '-'
  }
  return `${value}:1`
}

function renderTagRow(row) {
  const tags = [
    row.is985 ? '985' : '',
    row.is211 ? '211' : '',
    row.isDoubleFirstClass ? '双一流' : '',
  ].filter(Boolean)

  if (!tags.length) {
    return null
  }

  return (
    <div className="v2-ledger-mini-tags">
      {tags.map((tag) => <span key={tag}>{tag}</span>)}
    </div>
  )
}

function renderExpandedField(label, value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  return (
    <div className="v2-ledger-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function KaoyanSchoolLedgerTable({
  rows,
  compareIds,
  expandedRowIds,
  favoriteIds,
  page,
  totalPages,
  totalElements,
  compareEnabled = true,
  favoriteActionEnabled = true,
  paginationEnabled = true,
  emptyMessage = '当前筛选下没有可比较的分数线结果。',
  onToggleCompare = () => {},
  onToggleExpand = () => {},
  onToggleFavorite = () => {},
  onPageChange = () => {},
}) {
  if (!rows.length) {
    return (
      <section className="v2-ledger-card" aria-label="择校账本列表">
        <div className="v2-status-note">{emptyMessage}</div>
      </section>
    )
  }

  const detailColumnCount = compareEnabled
    ? (favoriteActionEnabled ? 13 : 12)
    : (favoriteActionEnabled ? 12 : 11)

  return (
    <section className="v2-ledger-card" aria-label="择校账本列表">
      <div className="v2-ledger-table-wrap">
        <table className="v2-ledger-table">
          <thead>
            <tr>
              {compareEnabled ? <th scope="col">对比</th> : null}
              <th scope="col">院校</th>
              <th scope="col">专业</th>
              <th scope="col">年份</th>
              <th scope="col">总分线</th>
              <th scope="col">政治</th>
              <th scope="col">外语</th>
              <th scope="col">业务课 1</th>
              <th scope="col">业务课 2</th>
              <th scope="col">计划招生</th>
              <th scope="col">报录比</th>
              {favoriteActionEnabled ? <th scope="col">操作</th> : null}
              <th scope="col">展开</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expanded = expandedRowIds.has(row.id)
              const compared = compareIds.includes(row.id)
              const favorited = favoriteIds.has(row.id)

              return (
                <Fragment key={row.id}>
                  <tr className={compared ? 'is-selected' : ''}>
                    {compareEnabled ? (
                      <td>
                        <input
                          aria-label={`选择 ${row.schoolName} 对比`}
                          checked={compared}
                          type="checkbox"
                          onChange={() => onToggleCompare(row.id)}
                        />
                      </td>
                    ) : null}
                    <td>
                      <strong>{row.schoolName}</strong>
                      {renderTagRow(row)}
                    </td>
                    <td>
                      <strong>{row.majorName || '-'}</strong>
                      <div className="v2-ledger-subtext">{row.majorCategory || '-'}</div>
                    </td>
                    <td>{row.year || '-'}</td>
                    <td>{row.totalScoreLine || '-'}</td>
                    <td>{row.politicsLine || '-'}</td>
                    <td>{row.foreignLangLine || '-'}</td>
                    <td>{row.subject1Line || '-'}</td>
                    <td>{row.subject2Line || '-'}</td>
                    <td>{row.plannedEnrollment || '-'}</td>
                    <td>{formatRatio(row.admissionRatio)}</td>
                    {favoriteActionEnabled ? (
                      <td>
                        <button
                          className={`v2-segment-button ${favorited ? 'is-active' : ''}`}
                          type="button"
                          onClick={() => onToggleFavorite(row)}
                        >
                          {favorited ? '取消收藏' : '收藏分数线'}
                        </button>
                      </td>
                    ) : null}
                    <td>
                      <button className="v2-segment-button" type="button" onClick={() => onToggleExpand(row.id)}>
                        {expanded ? '收起详情' : '展开详情'}
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="v2-ledger-expand-row">
                      <td colSpan={detailColumnCount}>
                        <div className="v2-ledger-detail-grid">
                          {renderExpandedField('地区 / 省份', [row.region, row.province].filter(Boolean).join(' / '))}
                          {renderExpandedField('985 / 211 / 双一流', [row.is985 ? '985' : '', row.is211 ? '211' : '', row.isDoubleFirstClass ? '双一流' : ''].filter(Boolean).join(' / '))}
                          {renderExpandedField('国家线 / 院线', row.isNationalLine ? '国家线' : '院线')}
                          {renderExpandedField('实际报考人数', row.actualApplicants)}
                          {renderExpandedField('备注', row.note)}
                          {renderExpandedField('来源', row.source)}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {paginationEnabled ? (
        <div className="v2-ledger-pagination">
          <button
            className="v2-segment-button"
            disabled={page <= 0}
            type="button"
            onClick={() => onPageChange(page - 1)}
          >
            上一页
          </button>
          <span>第 {page + 1} / {Math.max(totalPages, 1)} 页</span>
          <strong>共 {totalElements} 条</strong>
          <button
            className="v2-segment-button"
            disabled={page >= totalPages - 1}
            type="button"
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </button>
        </div>
      ) : null}
    </section>
  )
}
