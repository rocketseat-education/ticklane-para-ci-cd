import type { User } from '@/types';

export const authenticatedUserMock: User = {
  id: 'user-1',
  username: 'ana',
  displayName: 'Ana Silva',
  initials: 'AS',
  email: 'ana@example.com',
  authProvider: 'email',
};

export const guestUserMock: User = {
  id: 'guest',
  username: 'visitante',
  displayName: 'Visitante',
  initials: 'VS',
  isGuest: true,
};
