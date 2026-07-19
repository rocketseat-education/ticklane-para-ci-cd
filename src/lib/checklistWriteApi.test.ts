import { checklistDetailsMock, checklistItemsMock } from '@mocks/data/checklists';

import { apiFetch } from './apiBase';
import {
  createChecklistRequest,
  updateChecklistRequest,
  type ChecklistWriteBody,
} from './checklistWriteApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

const writeBody: ChecklistWriteBody = {
  title: 'Deploy checklist',
  description: 'Passos',
  categoryId: 'cat-1',
  tags: ['deploy'],
  visibility: 'public',
  items: [{ title: 'Rodar testes', description: 'CI' }],
  links: [{ label: 'Docs', url: 'https://example.com' }],
};

const writeResponse = {
  checklist: checklistDetailsMock,
  checklistItems: checklistItemsMock,
  checklistLinks: checklistDetailsMock.links,
};

describe('checklistWriteApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  describe('createChecklistRequest', () => {
    it('should post checklist and return parsed data on 201', async () => {
      apiFetchMock.mockResolvedValue({
        status: 201,
        json: async () => writeResponse,
      });
      const signal = new AbortController().signal;

      await expect(createChecklistRequest(writeBody, signal)).resolves.toEqual({
        ok: true,
        data: {
          checklist: writeResponse.checklist,
          checklistItems: writeResponse.checklistItems,
          checklistLinks: writeResponse.checklistLinks,
        },
      });
      expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(writeBody),
        signal,
      });
    });

    it('should default missing checklistLinks to empty array', async () => {
      apiFetchMock.mockResolvedValue({
        status: 201,
        json: async () => ({
          checklist: writeResponse.checklist,
          checklistItems: writeResponse.checklistItems,
        }),
      });

      const result = await createChecklistRequest(writeBody);

      expect(result).toEqual({
        ok: true,
        data: {
          checklist: writeResponse.checklist,
          checklistItems: writeResponse.checklistItems,
          checklistLinks: [],
        },
      });
    });

    it('should return invalid response when payload is incomplete', async () => {
      apiFetchMock.mockResolvedValue({
        status: 201,
        json: async () => ({ checklist: writeResponse.checklist }),
      });

      await expect(createChecklistRequest(writeBody)).resolves.toEqual({
        ok: false,
        error: 'Resposta inválida do servidor.',
      });
    });

    it('should return api error or fallback for non-201', async () => {
      apiFetchMock.mockResolvedValueOnce({
        status: 400,
        json: async () => ({ error: 'Título obrigatório' }),
      });
      await expect(createChecklistRequest(writeBody)).resolves.toEqual({
        ok: false,
        error: 'Título obrigatório',
      });

      apiFetchMock.mockResolvedValueOnce({
        status: 500,
        json: async () => {
          throw new Error('bad');
        },
      });
      await expect(createChecklistRequest(writeBody)).resolves.toEqual({
        ok: false,
        error: 'Não foi possível criar a checklist.',
      });
    });
  });

  describe('updateChecklistRequest', () => {
    const updateBody = {
      ...writeBody,
      visibility: 'public' as const,
      links: writeBody.links ?? [],
    };

    it('should put checklist and return parsed data when ok', async () => {
      apiFetchMock.mockResolvedValue({
        ok: true,
        json: async () => writeResponse,
      });
      const signal = new AbortController().signal;

      await expect(updateChecklistRequest('checklist-1', updateBody, signal)).resolves.toEqual({
        ok: true,
        data: {
          checklist: writeResponse.checklist,
          checklistItems: writeResponse.checklistItems,
          checklistLinks: writeResponse.checklistLinks,
        },
      });
      expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists/checklist-1', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
        signal,
      });
    });

    it('should encode checklist id and return errors', async () => {
      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Sem permissão' }),
      });
      await expect(updateChecklistRequest('a/b', updateBody)).resolves.toEqual({
        ok: false,
        error: 'Sem permissão',
      });
      expect(apiFetchMock.mock.calls[0][0]).toBe('/api/checklists/a%2Fb');

      apiFetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('bad');
        },
      });
      await expect(updateChecklistRequest('checklist-1', updateBody)).resolves.toEqual({
        ok: false,
        error: 'Não foi possível guardar a checklist.',
      });
    });

    it('should return invalid response when success json is unusable', async () => {
      apiFetchMock.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('bad');
        },
      });

      await expect(updateChecklistRequest('checklist-1', updateBody)).resolves.toEqual({
        ok: false,
        error: 'Resposta inválida do servidor.',
      });
    });
  });
});
