import { checklistDetailsMock } from '@mocks/data/checklists';

import {
  createOfflineExecutionFromChecklist,
  getOfflineExecutionWithItems,
  listOfflineExecutions,
  setOfflineExecutionItemChecked,
} from './store';

const mockGetOfflineExecutionsDb = jest.fn();

jest.mock('./db', () => ({
  getOfflineExecutionsDb: (...args: unknown[]) => mockGetOfflineExecutionsDb(...args),
}));

jest.mock('./uuid', () => ({
  createExecutionId: () => 'exec-generated-id',
}));

describe('offlineExecution/store', () => {
  const runAsync = jest.fn().mockResolvedValue(undefined);
  const getAllAsync = jest.fn();
  const getFirstAsync = jest.fn();
  const withTransactionAsync = jest.fn(async (fn: () => Promise<void>) => fn());

  const db = {
    runAsync,
    getAllAsync,
    getFirstAsync,
    withTransactionAsync,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOfflineExecutionsDb.mockResolvedValue(db);
    withTransactionAsync.mockImplementation(async (fn: () => Promise<void>) => fn());
  });

  describe('createOfflineExecutionFromChecklist', () => {
    it('should return null when db is unavailable', async () => {
      mockGetOfflineExecutionsDb.mockResolvedValue(null);

      await expect(createOfflineExecutionFromChecklist(checklistDetailsMock)).resolves.toBeNull();
    });

    it('should insert execution and item states then return id', async () => {
      const id = await createOfflineExecutionFromChecklist(checklistDetailsMock);

      expect(id).toBe('exec-generated-id');
      expect(withTransactionAsync).toHaveBeenCalledTimes(1);
      expect(runAsync).toHaveBeenCalled();
      expect(runAsync.mock.calls[0][0]).toContain('INSERT INTO offline_executions');
      expect(runAsync.mock.calls.length).toBe(1 + checklistDetailsMock.items.length);
    });
  });

  describe('listOfflineExecutions', () => {
    it('should return empty array when db is unavailable', async () => {
      mockGetOfflineExecutionsDb.mockResolvedValue(null);

      await expect(listOfflineExecutions()).resolves.toEqual([]);
    });

    it('should map rows to OfflineExecutionSummary', async () => {
      getAllAsync.mockResolvedValue([
        {
          id: 'exec-1',
          source_checklist_id: 'checklist-1',
          title: 'Deploy',
          category_name: 'DevOps',
          started_at: '2026-01-10T10:00:00.000Z',
          updated_at: '2026-01-10T11:00:00.000Z',
          done_count: 2,
          total_count: 8,
        },
      ]);

      await expect(listOfflineExecutions()).resolves.toEqual([
        {
          id: 'exec-1',
          sourceChecklistId: 'checklist-1',
          title: 'Deploy',
          categoryName: 'DevOps',
          doneCount: 2,
          totalCount: 8,
          startedAt: '2026-01-10T10:00:00.000Z',
          updatedAt: '2026-01-10T11:00:00.000Z',
        },
      ]);
    });
  });

  describe('getOfflineExecutionWithItems', () => {
    it('should return null when db is unavailable', async () => {
      mockGetOfflineExecutionsDb.mockResolvedValue(null);

      await expect(getOfflineExecutionWithItems('exec-1')).resolves.toBeNull();
    });

    it('should return null when execution row is missing', async () => {
      getFirstAsync.mockResolvedValue(null);

      await expect(getOfflineExecutionWithItems('missing')).resolves.toBeNull();
    });

    it('should merge item states and sort by order', async () => {
      getFirstAsync.mockResolvedValue({
        id: 'exec-1',
        source_checklist_id: checklistDetailsMock.id,
        title: checklistDetailsMock.title,
        description: checklistDetailsMock.description,
        category_name: checklistDetailsMock.categoryName,
        links_json: JSON.stringify(checklistDetailsMock.links),
        items_json: JSON.stringify(checklistDetailsMock.items),
      });
      getAllAsync.mockResolvedValue([
        {
          item_id: checklistDetailsMock.items[0].id,
          checked: 1,
          checked_at: '2026-01-10T12:00:00.000Z',
        },
      ]);

      const detail = await getOfflineExecutionWithItems('exec-1');

      expect(detail?.id).toBe('exec-1');
      expect(detail?.items[0].checked).toBe(true);
      expect(detail?.items[0].checkedAt).toBe('2026-01-10T12:00:00.000Z');
      if (detail && detail.items.length > 1) {
        expect(detail.items[1].checked).toBe(false);
      }
    });
  });

  describe('setOfflineExecutionItemChecked', () => {
    it('should no-op when db is unavailable', async () => {
      mockGetOfflineExecutionsDb.mockResolvedValue(null);

      await setOfflineExecutionItemChecked('exec-1', 'item-1', true);

      expect(withTransactionAsync).not.toHaveBeenCalled();
    });

    it('should update item state and execution timestamp', async () => {
      await setOfflineExecutionItemChecked('exec-1', 'item-1', true);

      expect(withTransactionAsync).toHaveBeenCalledTimes(1);
      expect(runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE offline_execution_item_state'),
        [1, expect.any(String), 'exec-1', 'item-1'],
      );
      expect(runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE offline_executions SET updated_at'),
        [expect.any(String), 'exec-1'],
      );
    });

    it('should clear checked_at when unchecked', async () => {
      await setOfflineExecutionItemChecked('exec-1', 'item-1', false);

      expect(runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE offline_execution_item_state'),
        [0, null, 'exec-1', 'item-1'],
      );
    });
  });
});
