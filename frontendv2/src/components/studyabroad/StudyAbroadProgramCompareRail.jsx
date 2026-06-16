export default function StudyAbroadProgramCompareRail({ rows = [], onRemove }) {
  if (!rows.length) return null

  return (
    <section className="v2-side-card v2-studyabroad-compare-rail">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">对比带</p>
          <h3>项目对比</h3>
        </div>
      </div>
      <div className="v2-compare-table-wrap">
        <table className="v2-compare-table">
          <thead>
            <tr>
              <th>院校</th>
              <th>项目</th>
              <th>学费</th>
              <th>学制</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.schoolName}</td>
                <td>{row.programName}</td>
                <td>{row.tuitionRange}</td>
                <td>{row.durationText}</td>
                <td>
                  <button className="v2-secondary-link" type="button" onClick={() => onRemove(row.id)}>移除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
