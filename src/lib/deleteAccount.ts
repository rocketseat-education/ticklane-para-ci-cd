import { apiFetch } from './apiBase';

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export async function deleteAccount(signal?: AbortSignal): Promise<DeleteAccountResult> {
  const res = await apiFetch('/api/users/me', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
    signal,
  });

  if (res.ok) {
    return { ok: true };
  }

  let error = 'Não foi possível eliminar a conta.';
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) {
      error = data.error;
    }
  } catch {
    /* ignore */
  }

  return { ok: false, error };
}
