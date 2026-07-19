import type { OfflineExecutionDetail, OfflineExecutionSummary } from '@/types';

import { checklistDetailsMock, checklistItemsMock } from './checklists';

export const offlineExecutionsMock: OfflineExecutionSummary[] = [
  {
    id: 'exec-1',
    sourceChecklistId: 'checklist-1',
    title: 'Deploy checklist',
    categoryName: 'DevOps',
    doneCount: 2,
    totalCount: 8,
    startedAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T11:00:00.000Z',
  },
  {
    id: 'exec-2',
    sourceChecklistId: 'checklist-2',
    title: 'Code review',
    categoryName: 'Engenharia',
    doneCount: 1,
    totalCount: 4,
    startedAt: '2026-01-11T10:00:00.000Z',
    updatedAt: '2026-01-11T11:00:00.000Z',
  },
];

export const offlineExecutionDetailMock: OfflineExecutionDetail = {
  id: 'exec-1',
  sourceChecklistId: checklistDetailsMock.id,
  title: checklistDetailsMock.title,
  description: checklistDetailsMock.description,
  categoryName: checklistDetailsMock.categoryName,
  links: checklistDetailsMock.links,
  items: [
    {
      ...checklistItemsMock[0],
      checked: true,
      checkedAt: '2026-01-10T10:30:00.000Z',
    },
    {
      ...checklistItemsMock[1],
      checked: false,
    },
  ],
};
