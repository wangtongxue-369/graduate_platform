function formatRatio(value) {
  if (value === '' || value === null || value === undefined) {
    return '-'
  }
  return `${value}:1`
}

function renderRow(label, rows, getter) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {rows.map((row) => (
        <td key={`${row.id}-${label}`}>{getter(row)}</td>
      ))}
    </tr>
  )
}

export default function KaoyanSchoolCompareModal({ rows, onClose, onRemove }) {
  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="v2-modal-head">
          <h3>分数线对比</h3>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        <div className="v2-compare-table-wrap">
          <table className="v2-compare-table">
            <thead>
              <tr>
                <th>项目</th>
                {rows.map((row) => (
                  <th key={row.id}>
                    <strong>{row.schoolName}</strong>
                    <div className="v2-compare-subhead">
                      {row.majorName} {row.year ? `· ${row.year}` : ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderRow('总分线', rows, (row) => row.totalScoreLine || '-')}
              {renderRow('政治线', rows, (row) => row.politicsLine || '-')}
              {renderRow('外语线', rows, (row) => row.foreignLangLine || '-')}
              {renderRow('业务课 1', rows, (row) => row.subject1Line || '-')}
              {renderRow('业务课 2', rows, (row) => row.subject2Line || '-')}
              {renderRow('计划招生', rows, (row) => row.plannedEnrollment || '-')}
              {renderRow('报考人数', rows, (row) => row.actualApplicants || '-')}
              {renderRow('报录比', rows, (row) => formatRatio(row.admissionRatio))}
              {renderRow('国家线 / 院线', rows, (row) => (row.isNationalLine ? '国家线' : '院线'))}
              <tr>
                <th scope="row">操作</th>
                {rows.map((row) => (
                  <td key={`${row.id}-remove`}>
                    <button className="v2-segment-button" type="button" onClick={() => onRemove(row.id)}>
                      移除对比项
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
