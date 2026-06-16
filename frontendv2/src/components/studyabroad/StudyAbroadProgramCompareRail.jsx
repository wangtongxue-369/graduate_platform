import { useState } from 'react'
import { getCountryLabel } from '@/lib/studyabroad/studyAbroadLabels.js'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'

export default function StudyAbroadProgramCompareRail({ rows = [], onRemove }) {
  const [modalOpen, setModalOpen] = useState(false)

  if (!rows.length) return null

  return (
    <>
      <section className="v2-side-card v2-studyabroad-compare-rail">
        <div className="v2-side-card__head">
          <div>
            <p className="v2-kicker">已选项目</p>
            <h3>项目对比</h3>
          </div>
          <button className="v2-primary-link" type="button" onClick={() => setModalOpen(true)}>放大查看</button>
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

      <StudyAbroadPageModal
        open={modalOpen}
        kicker="院校项目对比"
        title="已选院校项目对比"
        lead="横向查看已加入对比的院校项目，重点比较排名、学费、学制、申请要求、签证政策和就业政策。"
        onClose={() => setModalOpen(false)}
        className="v2-studyabroad-compare-modal"
        testId="studyabroad-program-compare-modal"
      >
        <div className="v2-compare-table-wrap">
          <table className="v2-compare-table v2-studyabroad-compare-table">
            <thead>
              <tr>
                <th>院校</th>
                <th>项目</th>
                <th>地区</th>
                <th>排名</th>
                <th>学费</th>
                <th>学制</th>
                <th>截止</th>
                <th>申请要求</th>
                <th>政策与风险</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.schoolName}</strong></td>
                  <td>{row.programName}</td>
                  <td>{getCountryLabel(row.country)}</td>
                  <td>{row.qsRank}</td>
                  <td>{row.tuitionRange}</td>
                  <td>{row.durationText}</td>
                  <td>{row.deadlineText}</td>
                  <td>{row.applicationRequirements}</td>
                  <td>
                    <div className="v2-studyabroad-compare-cell">
                      <span>{row.visaPolicy}</span>
                      <span>{row.employmentPolicy}</span>
                      <span>{row.riskSummary}</span>
                    </div>
                  </td>
                  <td>
                    <button className="v2-secondary-link" type="button" onClick={() => onRemove(row.id)}>移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StudyAbroadPageModal>
    </>
  )
}
