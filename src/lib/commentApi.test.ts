import { apiFetch } from './apiBase';
import { createCommentRequest } from './commentApi';

jest.mock('./apiBase', () => ({
  apiFetch: jest.fn(),
}));

const apiFetchMock = apiFetch as jest.Mock;

const commentFixture = {
  id: 'comment-1',
  authorId: 'user-2',
  content: 'Ótimo checklist',
  createdAt: '2026-01-12T10:00:00.000Z',
};

describe('createCommentRequest', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('should create a checklist comment without itemId', async () => {
    apiFetchMock.mockResolvedValue({
      status: 201,
      json: async () => ({
        comment: { ...commentFixture, checklistId: 'checklist-1' },
      }),
    });
    const signal = new AbortController().signal;

    await expect(
      createCommentRequest('checklist-1', 'Ótimo checklist', undefined, signal),
    ).resolves.toEqual({
      ok: true,
      comment: {
        ...commentFixture,
        checklistId: 'checklist-1',
        itemId: undefined,
      },
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/api/checklists/checklist-1/comments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Ótimo checklist' }),
      signal,
    });
  });

  it('should include itemId in body and normalize empty itemId', async () => {
    apiFetchMock.mockResolvedValue({
      status: 201,
      json: async () => ({
        comment: { ...commentFixture, itemId: '   ' },
      }),
    });

    const result = await createCommentRequest('checklist-1', 'nota', 'item-1');

    expect(apiFetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ content: 'nota', itemId: 'item-1' }),
    );
    expect(result).toEqual({
      ok: true,
      comment: {
        ...commentFixture,
        checklistId: 'checklist-1',
        itemId: undefined,
      },
    });
  });

  it('should default checklistId from request when missing in response', async () => {
    apiFetchMock.mockResolvedValue({
      status: 201,
      json: async () => ({
        comment: { ...commentFixture, itemId: 'item-1' },
      }),
    });

    const result = await createCommentRequest('checklist-9', 'ok', 'item-1');

    expect(result).toEqual({
      ok: true,
      comment: {
        ...commentFixture,
        checklistId: 'checklist-9',
        itemId: 'item-1',
      },
    });
  });

  it('should return invalid response errors', async () => {
    apiFetchMock.mockResolvedValueOnce({
      status: 201,
      json: async () => ({}),
    });
    await expect(createCommentRequest('c1', 'x', undefined)).resolves.toEqual({
      ok: false,
      error: 'Resposta inválida do servidor.',
    });

    apiFetchMock.mockResolvedValueOnce({
      status: 201,
      json: async () => {
        throw new Error('bad');
      },
    });
    await expect(createCommentRequest('c1', 'x', undefined)).resolves.toEqual({
      ok: false,
      error: 'Resposta inválida do servidor.',
    });
  });

  it('should return api error or fallback for non-201 responses', async () => {
    apiFetchMock.mockResolvedValueOnce({
      status: 400,
      json: async () => ({ error: 'Conteúdo vazio' }),
    });
    await expect(createCommentRequest('c1', '', undefined)).resolves.toEqual({
      ok: false,
      error: 'Conteúdo vazio',
    });

    apiFetchMock.mockResolvedValueOnce({
      status: 500,
      json: async () => {
        throw new Error('bad');
      },
    });
    await expect(createCommentRequest('c1', 'x', undefined)).resolves.toEqual({
      ok: false,
      error: 'Não foi possível enviar o comentário.',
    });
  });
});
