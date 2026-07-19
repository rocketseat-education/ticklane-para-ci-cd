import { libraryStateMock } from '@mocks/data/libraryState';

import type { ChecklistWriteResponse } from '@/lib/checklistWriteApi';

import { applyChecklistWriteResponse } from './apply-checklist-write';

describe('applyChecklistWriteResponse', () => {
  it('should insert a new checklist with its items and links', () => {
    const write: ChecklistWriteResponse = {
      checklist: {
        id: 'checklist-new',
        title: 'Nova lista',
        description: 'Criada via API',
        categoryId: 'cat-1',
        visibility: 'public',
        authorId: 'user-1',
        tags: ['nova'],
        averageRating: 0,
        favoritesCount: 0,
        executionsCount: 0,
        commentsCount: 0,
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-01T10:00:00.000Z',
      },
      checklistItems: [
        {
          id: 'item-new-1',
          checklistId: 'checklist-new',
          title: 'Passo 1',
          order: 0,
        },
      ],
      checklistLinks: [
        {
          id: 'link-new-1',
          checklistId: 'checklist-new',
          label: 'Docs',
          url: 'https://example.com/docs',
        },
      ],
    };

    const next = applyChecklistWriteResponse(libraryStateMock, write);

    expect(next.checklists).toHaveLength(libraryStateMock.checklists.length + 1);
    expect(next.checklists.find((entry) => entry.id === 'checklist-new')).toEqual(write.checklist);
    expect(next.checklistItems.filter((item) => item.checklistId === 'checklist-new')).toEqual(
      write.checklistItems,
    );
    expect(next.checklistLinks.filter((link) => link.checklistId === 'checklist-new')).toEqual(
      write.checklistLinks,
    );
    expect(next.comments).toBe(libraryStateMock.comments);
    expect(next.favorites).toBe(libraryStateMock.favorites);
  });

  it('should replace an existing checklist and wipe previous items/links for that id', () => {
    const write: ChecklistWriteResponse = {
      checklist: {
        ...libraryStateMock.checklists[0],
        title: 'Deploy atualizado',
        updatedAt: '2026-02-02T10:00:00.000Z',
      },
      checklistItems: [
        {
          id: 'item-replaced',
          checklistId: 'checklist-1',
          title: 'Único item',
          order: 0,
        },
      ],
      checklistLinks: [],
    };

    const next = applyChecklistWriteResponse(libraryStateMock, write);

    expect(next.checklists.filter((entry) => entry.id === 'checklist-1')).toHaveLength(1);
    expect(next.checklists.find((entry) => entry.id === 'checklist-1')?.title).toBe(
      'Deploy atualizado',
    );
    expect(next.checklistItems.filter((item) => item.checklistId === 'checklist-1')).toEqual(
      write.checklistItems,
    );
    expect(next.checklistLinks.filter((link) => link.checklistId === 'checklist-1')).toEqual([]);
    expect(next.checklistItems.filter((item) => item.checklistId === 'checklist-2')).toEqual(
      libraryStateMock.checklistItems.filter((item) => item.checklistId === 'checklist-2'),
    );
  });
});
