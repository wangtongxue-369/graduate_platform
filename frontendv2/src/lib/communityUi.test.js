import { describe, expect, it } from 'vitest'
import {
  countComments,
  deleteCommentFromTree,
  flattenCommentThreadForDisplay,
  normalizeCommunityNotification,
} from './communityUi.js'

describe('communityUi comment deletion helpers', () => {
  it('does not count deleted placeholder comments toward totals', () => {
    const comments = [
      {
        id: 1,
        deleted: true,
        replies: [
          { id: 2, deleted: false, replies: [] },
        ],
      },
      {
        id: 3,
        deleted: false,
        replies: [],
      },
    ]

    expect(countComments(comments)).toBe(2)
  })

  it('removes deleted leaf comments but keeps deleted parents with replies as placeholders', () => {
    const tree = [
      {
        id: 1,
        authorId: 10,
        authorName: 'Author',
        content: 'Parent',
        deleted: false,
        editable: true,
        replies: [
          {
            id: 2,
            authorId: 11,
            authorName: 'Child',
            content: 'Child reply',
            deleted: false,
            editable: true,
            replies: [],
            replyCount: 0,
          },
        ],
        replyCount: 1,
      },
      {
        id: 3,
        authorId: 12,
        authorName: 'Leaf',
        content: 'Leaf only',
        deleted: false,
        editable: true,
        replies: [],
        replyCount: 0,
      },
    ]

    const afterParentDelete = deleteCommentFromTree(tree, 1)
    expect(afterParentDelete).toHaveLength(2)
    expect(afterParentDelete[0]).toMatchObject({
      id: 1,
      deleted: true,
      editable: false,
      authorId: null,
      authorName: '',
      content: '该评论已被作者删除',
      replyCount: 1,
    })
    expect(afterParentDelete[0].replies).toHaveLength(1)

    const afterLeafDelete = deleteCommentFromTree(afterParentDelete, 3)
    expect(afterLeafDelete).toHaveLength(1)
    expect(afterLeafDelete[0].id).toBe(1)
  })

  it('flattens nested replies into a two-level display thread', () => {
    const comments = [
      {
        id: 1,
        authorId: 10,
        authorName: 'Root',
        content: 'Root comment',
        deleted: false,
        editable: true,
        replies: [
          {
            id: 2,
            authorId: 11,
            authorName: 'Child',
            content: 'Child reply',
            deleted: false,
            editable: true,
            replies: [
              {
                id: 3,
                authorId: 12,
                authorName: 'Nested',
                content: 'Nested reply',
                deleted: false,
                editable: true,
                replies: [],
                replyCount: 0,
              },
            ],
            replyCount: 1,
          },
        ],
        replyCount: 2,
      },
    ]

    const flattened = flattenCommentThreadForDisplay(comments)

    expect(flattened).toHaveLength(1)
    expect(flattened[0].replyCount).toBe(2)
    expect(flattened[0].replies).toHaveLength(2)
    expect(flattened[0].replies[0]).toMatchObject({
      id: 2,
      rootId: 1,
      replyToId: null,
    })
    expect(flattened[0].replies[1]).toMatchObject({
      id: 3,
      rootId: 1,
      replyToId: 2,
      replyToAuthorName: 'Child',
    })
    expect(flattened[0].replies[1].replies).toEqual([])
  })
})

describe('communityUi notification normalization', () => {
  it('treats backend readFlag as the canonical read state', () => {
    expect(
      normalizeCommunityNotification({
        id: 1,
        title: 'Read notification',
        readFlag: true,
      }),
    ).toMatchObject({ read: true })

    expect(
      normalizeCommunityNotification({
        id: 2,
        title: 'Unread notification',
        readFlag: false,
      }),
    ).toMatchObject({ read: false })
  })
})
