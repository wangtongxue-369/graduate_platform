import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = dirname(fileURLToPath(import.meta.url))
const resumeSource = readFileSync(resolve(currentDir, './ResumePage.jsx'), 'utf8')
const recommendSource = readFileSync(resolve(currentDir, './JobRecommendPage.jsx'), 'utf8')
const detailSource = readFileSync(resolve(currentDir, './JobPostingDetailPage.jsx'), 'utf8')
const applicationsSource = readFileSync(resolve(currentDir, './ApplicationTrackingPage.jsx'), 'utf8')

describe('frontendv1 employment task pages', () => {
  it('keeps explicit attachment and return-path copy in the resume page', () => {
    expect(resumeSource).toContain('附件不参与自动解析')
    expect(resumeSource).toContain('返回就业工作站')
  })

  it('keeps explicit no-auto-apply copy in the recommendations page', () => {
    expect(recommendSource).toContain('平台内不会自动投递')
    expect(recommendSource).toContain('返回就业工作站')
  })

  it('keeps explicit detail-page boundaries before users jump out or start tracking', () => {
    expect(detailSource).toContain('加入投递跟踪')
    expect(detailSource).toContain('打开申请链接会跳转站外')
    expect(detailSource).toContain('返回岗位推荐')
  })

  it('keeps explicit return-path copy and separate file status in the applications page', () => {
    expect(applicationsSource).toContain('当前简历附件')
    expect(applicationsSource).toContain('返回就业工作站')
    expect(applicationsSource).not.toContain('record.resumeFile')
  })
})
