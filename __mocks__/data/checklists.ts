import type { ChecklistDetails, ChecklistItem, ChecklistSummary } from '@/types';

export const checklistSummaryMock: ChecklistSummary = {
  id: 'checklist-1',
  title: 'Deploy checklist',
  description: 'Passos para publicar com segurança.',
  categoryId: 'cat-1',
  categoryName: 'DevOps',
  visibility: 'public',
  authorId: 'user-1',
  authorName: 'Ana Silva',
  authorInitials: 'AS',
  tags: ['deploy', 'ci'],
  averageRating: 4.5,
  favoritesCount: 12,
  executionsCount: 40,
  commentsCount: 3,
  itemsCount: 8,
  isFavorite: true,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

export const checklistSummariesMock: ChecklistSummary[] = [
  checklistSummaryMock,
  {
    ...checklistSummaryMock,
    id: 'checklist-2',
    title: 'Code review',
    categoryName: 'Engenharia',
    isFavorite: false,
    favoritesCount: 5,
    itemsCount: 4,
  },
];

export const checklistItemsMock: ChecklistItem[] = [
  {
    id: 'item-1',
    checklistId: 'checklist-1',
    title: 'Rodar testes',
    description: 'Garantir que a suíte passa no CI.',
    order: 0,
    priority: 'high',
  },
  {
    id: 'item-2',
    checklistId: 'checklist-1',
    title: 'Publicar build',
    description: 'Enviar o artefato para produção.',
    order: 1,
    priority: 'medium',
  },
];

export const checklistDetailsMock: ChecklistDetails = {
  ...checklistSummaryMock,
  description: 'Passos para publicar com segurança.',
  items: checklistItemsMock,
  links: [
    {
      id: 'link-1',
      checklistId: 'checklist-1',
      label: 'Playbook',
      url: 'https://example.com/playbook',
    },
  ],
  itemsCount: checklistItemsMock.length,
};
