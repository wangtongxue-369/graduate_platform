import { describe, expect, it } from 'vitest'
import {
  isSubjectiveQuestionType,
  normalizePagedResult,
  normalizePracticeQuestion,
  parseQuestionOptions,
} from './normalizers.js'

describe('practice normalizers', () => {
  it('parses question options from json strings', () => {
    expect(parseQuestionOptions('["A","B"]')).toEqual(['A', 'B'])
  })

  it('recognizes all subjective question types', () => {
    expect(isSubjectiveQuestionType('subjective')).toBe(true)
    expect(isSubjectiveQuestionType('essay')).toBe(true)
    expect(isSubjectiveQuestionType('short_answer')).toBe(true)
  })

  it('normalizes both items and content based paged payloads', () => {
    expect(
      normalizePagedResult({
        items: [{ id: 1 }],
        total: 1,
        page: 0,
        size: 20,
        totalPages: 1,
      }).items,
    ).toHaveLength(1)

    expect(
      normalizePagedResult({
        content: [{ id: 2 }],
        totalElements: 1,
        number: 0,
        size: 20,
        totalPages: 1,
      }).items[0].id,
    ).toBe(2)
  })

  it('adds defaults to practice questions', () => {
    expect(
      normalizePracticeQuestion({
        id: 3,
        optionsJson: '["A"]',
        questionType: null,
        chapter: null,
      }),
    ).toMatchObject({
      id: 3,
      options: ['A'],
      questionType: 'single',
      chapter: '未分章节',
    })
  })
})
