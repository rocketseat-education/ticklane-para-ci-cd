import type { CommentWithAuthor } from '@/types';

export const checklistCommentsMock: CommentWithAuthor[] = [
  {
    id: 'comment-1',
    checklistId: 'checklist-1',
    authorId: 'user-2',
    authorName: 'Bruno Costa',
    authorInitials: 'BC',
    content: 'Ótimo checklist de deploy.',
    createdAt: '2026-01-12T10:00:00.000Z',
    relativeCreatedAt: 'há 2 dias',
  },
];

export const itemCommentsMock: CommentWithAuthor[] = [
  {
    id: 'comment-item-1',
    checklistId: 'checklist-1',
    itemId: 'item-1',
    authorId: 'user-2',
    authorName: 'Bruno Costa',
    authorInitials: 'BC',
    content: 'Vale validar também o smoke no staging.',
    createdAt: '2026-01-12T11:00:00.000Z',
    relativeCreatedAt: 'há 1 dia',
  },
];
