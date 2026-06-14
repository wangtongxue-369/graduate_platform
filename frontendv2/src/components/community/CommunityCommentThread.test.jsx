import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CommunityCommentThread from './CommunityCommentThread.jsx'

describe('CommunityCommentThread', () => {
  it('collapses replies by default and shows the reply count toggle', () => {
    render(
      <CommunityCommentThread
        comments={[
          {
            id: 1,
            authorId: 10,
            authorName: 'Parent',
            content: 'Parent comment',
            editable: true,
            deleted: false,
            createdAt: '2026-06-14T00:00:00',
            updatedAt: '2026-06-14T00:00:00',
            replyCount: 2,
            replies: [
              {
                id: 2,
                authorId: 11,
                authorName: 'Child A',
                content: 'First reply',
                editable: true,
                deleted: false,
                createdAt: '2026-06-14T00:01:00',
                updatedAt: '2026-06-14T00:01:00',
                replyCount: 0,
                replies: [],
              },
              {
                id: 3,
                authorId: 12,
                authorName: 'Child B',
                content: 'Second reply',
                editable: true,
                deleted: false,
                createdAt: '2026-06-14T00:02:00',
                updatedAt: '2026-06-14T00:02:00',
                replyCount: 0,
                replies: [],
              },
            ],
          },
        ]}
        activeCommentId={null}
        currentUserId={10}
        isAdmin={false}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReport={vi.fn()}
      />,
    )

    expect(screen.getByText('Parent comment')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '展开 2 条回复' })).toBeInTheDocument()
    expect(screen.queryByText('First reply')).not.toBeInTheDocument()
    expect(screen.queryByText('Second reply')).not.toBeInTheDocument()
  })

  it('reveals replies after expanding the thread', () => {
    render(
      <CommunityCommentThread
        comments={[
          {
            id: 1,
            authorId: 10,
            authorName: 'Parent',
            content: 'Parent comment',
            editable: true,
            deleted: false,
            createdAt: '2026-06-14T00:00:00',
            updatedAt: '2026-06-14T00:00:00',
            replyCount: 1,
            replies: [
              {
                id: 2,
                authorId: 11,
                authorName: 'Child A',
                content: 'Visible after expand',
                editable: true,
                deleted: false,
                createdAt: '2026-06-14T00:01:00',
                updatedAt: '2026-06-14T00:01:00',
                replyCount: 0,
                replies: [],
              },
            ],
          },
        ]}
        activeCommentId={null}
        currentUserId={10}
        isAdmin={false}
        onReply={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onReport={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '展开 1 条回复' }))

    expect(screen.getByRole('button', { name: '收起回复' })).toBeInTheDocument()
    expect(screen.getByText('Visible after expand')).toBeInTheDocument()
  })
})
