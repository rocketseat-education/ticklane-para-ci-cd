import type { ChecklistRating } from '@/types';

import { computeChecklistAverageRating } from './compute-checklist-average-rating';

const ratings: ChecklistRating[] = [
  {
    id: 'r1',
    checklistId: 'checklist-1',
    userId: 'user-1',
    score: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'r2',
    checklistId: 'checklist-1',
    userId: 'user-2',
    score: 3,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'r3',
    checklistId: 'checklist-1',
    userId: 'user-3',
    score: 0,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'r4',
    checklistId: 'checklist-2',
    userId: 'user-1',
    score: 4,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
];

describe('computeChecklistAverageRating', () => {
  it('should return 0 when there are no ratings for the checklist', () => {
    expect(computeChecklistAverageRating(ratings, 'missing')).toBe(0);
    expect(computeChecklistAverageRating([], 'checklist-1')).toBe(0);
  });

  it('should ignore scores of 0 and average the rest', () => {
    expect(computeChecklistAverageRating(ratings, 'checklist-1')).toBe(4);
  });

  it('should return the single valid score when only one remains', () => {
    expect(computeChecklistAverageRating(ratings, 'checklist-2')).toBe(4);
  });

  it('should return 0 when all scores for the checklist are zero', () => {
    const onlyZero: ChecklistRating[] = [
      {
        id: 'z1',
        checklistId: 'checklist-3',
        userId: 'user-1',
        score: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    expect(computeChecklistAverageRating(onlyZero, 'checklist-3')).toBe(0);
  });
});
