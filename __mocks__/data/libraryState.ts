import type { LibraryState } from '@/state/library/library-types';

import { categoriesMock } from './categories';
import { checklistItemsMock } from './checklists';
import { authenticatedUserMock, guestUserMock } from './users';

export const libraryStateMock: LibraryState = {
  categories: categoriesMock,
  users: [
    authenticatedUserMock,
    {
      id: 'user-2',
      username: 'bruno',
      displayName: 'Bruno Costa',
      initials: 'BC',
      email: 'bruno@example.com',
      authProvider: 'email',
    },
    guestUserMock,
  ],
  checklists: [
    {
      id: 'checklist-1',
      title: 'Deploy checklist',
      description: 'Passos para publicar com segurança.',
      categoryId: 'cat-1',
      visibility: 'public',
      authorId: 'user-1',
      tags: ['deploy', 'ci'],
      averageRating: 4.5,
      favoritesCount: 12,
      executionsCount: 40,
      commentsCount: 3,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'checklist-2',
      title: 'Code review',
      description: 'Revisão de código com ênfase.',
      categoryId: 'cat-2',
      visibility: 'public',
      authorId: 'user-2',
      tags: ['review'],
      averageRating: 3,
      favoritesCount: 5,
      executionsCount: 10,
      commentsCount: 8,
      createdAt: '2026-01-11T10:00:00.000Z',
      updatedAt: '2026-01-16T10:00:00.000Z',
    },
    {
      id: 'checklist-3',
      title: 'Onboarding',
      description: 'Primeiros passos',
      categoryId: 'missing-cat',
      visibility: 'public',
      authorId: 'missing-author',
      tags: ['novo'],
      averageRating: 5,
      favoritesCount: 20,
      executionsCount: 100,
      commentsCount: 1,
      createdAt: '2026-01-12T10:00:00.000Z',
      updatedAt: '2026-01-14T10:00:00.000Z',
    },
  ],
  checklistItems: [
    ...checklistItemsMock,
    {
      id: 'item-3',
      checklistId: 'checklist-1',
      title: 'Rollback plan',
      order: 2,
      priority: 'low',
    },
    {
      id: 'item-4',
      checklistId: 'checklist-2',
      title: 'Abrir PR',
      order: 0,
      priority: 'medium',
    },
  ],
  checklistLinks: [
    {
      id: 'link-1',
      checklistId: 'checklist-1',
      label: 'Playbook',
      url: 'https://example.com/playbook',
    },
  ],
  comments: [
    {
      id: 'comment-1',
      checklistId: 'checklist-1',
      authorId: 'user-2',
      content: 'Ótimo checklist de deploy.',
      createdAt: '2026-01-12T10:00:00.000Z',
    },
    {
      id: 'comment-2',
      checklistId: 'checklist-1',
      authorId: 'user-1',
      content: 'Mais antigo',
      createdAt: '2026-01-11T10:00:00.000Z',
    },
    {
      id: 'comment-item-1',
      checklistId: 'checklist-1',
      itemId: 'item-1',
      authorId: 'user-2',
      content: 'Vale validar também o smoke no staging.',
      createdAt: '2026-01-12T11:00:00.000Z',
    },
    {
      id: 'comment-orphan',
      checklistId: 'checklist-2',
      authorId: 'missing-author',
      content: 'Autor desconhecido',
      createdAt: '2026-01-13T10:00:00.000Z',
    },
  ],
  favorites: [
    {
      userId: 'user-1',
      checklistId: 'checklist-1',
      createdAt: '2026-01-13T10:00:00.000Z',
    },
    {
      userId: 'user-1',
      checklistId: 'checklist-2',
      createdAt: '2026-01-14T10:00:00.000Z',
    },
    {
      userId: 'user-2',
      checklistId: 'checklist-1',
      createdAt: '2026-01-14T12:00:00.000Z',
    },
  ],
  ratings: [
    {
      id: 'rating-1',
      checklistId: 'checklist-1',
      userId: 'user-1',
      score: 5,
      createdAt: '2026-01-13T10:00:00.000Z',
    },
    {
      id: 'rating-2',
      checklistId: 'checklist-1',
      userId: 'user-2',
      score: 4,
      createdAt: '2026-01-14T10:00:00.000Z',
    },
    {
      id: 'rating-zero',
      checklistId: 'checklist-2',
      userId: 'user-1',
      score: 0,
      createdAt: '2026-01-14T10:00:00.000Z',
    },
  ],
};
