import { Alert } from 'react-native';

import { act, renderHook, waitFor } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';

import {
  MAX_BIO,
  MAX_DISPLAY_NAME,
  useProfileEditScreen,
} from './use-profile-edit-screen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockApplySessionUser = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUploadAvatar = jest.fn();
const mockDeleteAvatar = jest.fn();
const mockRequestPermissions = jest.fn();
const mockLaunchImageLibrary = jest.fn();
const mockManipulateAsync = jest.fn();
const mockAlert = jest.fn();

/** Stable router identity — useEffect depends on `router` and would reset form state otherwise. */
const mockRouter = {
  back: (...args: unknown[]) => mockBack(...args),
  replace: (...args: unknown[]) => mockReplace(...args),
  canGoBack: () => mockCanGoBack(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestPermissions(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibrary(...args),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
}));

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/updateProfile', () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

jest.mock('@/lib/uploadAvatar', () => ({
  uploadAvatar: (...args: unknown[]) => mockUploadAvatar(...args),
  deleteAvatar: (...args: unknown[]) => mockDeleteAvatar(...args),
}));

import { useAuth } from '@/modules/auth/context';

const useAuthMock = useAuth as jest.Mock;
const copy = COPY.screens.profileEdit;

const userWithProfile = {
  ...authenticatedUserMock,
  bio: 'Bio actual',
  avatarUrl: 'https://example.com/avatar.jpg',
};

describe('useProfileEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(mockAlert);
    useAuthMock.mockReturnValue({
      currentUser: userWithProfile,
      isAuthenticated: true,
      authResolved: true,
      applySessionUser: mockApplySessionUser,
    });
    mockCanGoBack.mockReturnValue(true);
    mockUpdateProfile.mockResolvedValue({ ok: true, user: userWithProfile });
    mockUploadAvatar.mockResolvedValue({ ok: true, user: userWithProfile });
    mockDeleteAvatar.mockResolvedValue({
      ok: true,
      user: { ...userWithProfile, avatarUrl: undefined },
    });
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true });
    mockManipulateAsync.mockResolvedValue({ uri: 'file://cropped.jpg' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return copy, form state and handlers for authenticated users', () => {
    const { result } = renderHook(() => useProfileEditScreen());

    expect(result.current.copy).toBe(copy);
    expect(result.current.authResolved).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.currentUser).toEqual(userWithProfile);
    expect(result.current.displayName).toBe(userWithProfile.displayName);
    expect(result.current.bio).toBe(userWithProfile.bio);
    expect(result.current.dirty).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.pendingAvatar).toBeNull();
    expect(result.current.feedback).toBeNull();
    expect(result.current.MAX_BIO).toBe(MAX_BIO);
    expect(result.current.MAX_DISPLAY_NAME).toBe(MAX_DISPLAY_NAME);
    expect(result.current.styles).toBeDefined();
  });

  it('should redirect to auth when not authenticated after auth resolves', async () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isAuthenticated: false,
      authResolved: true,
      applySessionUser: mockApplySessionUser,
    });

    renderHook(() => useProfileEditScreen());

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.auth);
    });
  });

  it('should mark dirty when display name or bio changes', () => {
    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.setDisplayName('Novo nome');
    });

    expect(result.current.dirty).toBe(true);

    act(() => {
      result.current.setDisplayName(userWithProfile.displayName);
      result.current.setBio('Nova bio');
    });

    expect(result.current.dirty).toBe(true);
  });

  it('should go back when handleClose is called and history exists', () => {
    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.handleClose();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('should replace with profile tab when handleClose has no history', () => {
    mockCanGoBack.mockReturnValue(false);
    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.handleClose();
    });

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.tabs.profile);
  });

  it('should reject empty display name on submit', async () => {
    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.setDisplayName('   ');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: `Nome deve ter entre 1 e ${MAX_DISPLAY_NAME} caracteres.`,
    });
  });

  it('should reject bio longer than MAX_BIO on submit', async () => {
    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.setBio('x'.repeat(MAX_BIO + 1));
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: `Bio com máx ${MAX_BIO} caracteres.`,
    });
  });

  it('should update profile and apply session user on success', async () => {
    const updatedUser = { ...userWithProfile, displayName: 'Ana Actualizada' };
    mockUpdateProfile.mockResolvedValue({ ok: true, user: updatedUser });

    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.setDisplayName('Ana Actualizada');
      result.current.setBio('');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      displayName: 'Ana Actualizada',
      bio: null,
    });
    expect(mockApplySessionUser).toHaveBeenCalledWith(updatedUser);
    expect(result.current.feedback).toEqual({
      kind: 'success',
      text: copy.successMessage,
    });
    expect(result.current.saving).toBe(false);
  });

  it('should set error feedback when updateProfile fails', async () => {
    mockUpdateProfile.mockResolvedValue({ ok: false, error: 'Falha ao guardar' });

    const { result } = renderHook(() => useProfileEditScreen());

    act(() => {
      result.current.setDisplayName('Outro nome');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: 'Falha ao guardar',
    });
    expect(mockApplySessionUser).not.toHaveBeenCalled();
  });

  it('should alert when media library permission is denied', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });
    const { result } = renderHook(() => useProfileEditScreen());

    await act(async () => {
      await result.current.handlePickAvatar();
    });

    expect(mockAlert).toHaveBeenCalledWith(copy.permissionDenied);
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
  });

  it('should reject oversized avatar files', async () => {
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://photo.jpg',
          width: 100,
          height: 100,
          fileSize: 3 * 1024 * 1024,
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = renderHook(() => useProfileEditScreen());

    await act(async () => {
      await result.current.handlePickAvatar();
    });

    expect(result.current.feedback).toEqual({
      kind: 'error',
      text: copy.tooLargeMessage,
    });
    expect(mockUploadAvatar).not.toHaveBeenCalled();
  });

  it('should upload avatar and apply session user on success', async () => {
    const updatedUser = {
      ...userWithProfile,
      avatarUrl: 'https://example.com/new.jpg',
    };
    mockUploadAvatar.mockResolvedValue({ ok: true, user: updatedUser });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file://photo.jpg',
          width: 200,
          height: 200,
          fileSize: 1000,
          mimeType: 'image/jpeg',
        },
      ],
    });

    const { result } = renderHook(() => useProfileEditScreen());

    await act(async () => {
      await result.current.handlePickAvatar();
    });

    expect(mockManipulateAsync).toHaveBeenCalled();
    expect(mockUploadAvatar).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'file://cropped.jpg',
        type: 'image/jpeg',
      }),
    );
    expect(mockApplySessionUser).toHaveBeenCalledWith(updatedUser);
    expect(result.current.feedback).toEqual({
      kind: 'success',
      text: copy.avatarUpdatedMessage,
    });
    expect(result.current.pendingAvatar).toBeNull();
  });

  it('should remove avatar and apply session user on success', async () => {
    const updatedUser = { ...userWithProfile, avatarUrl: undefined };
    mockDeleteAvatar.mockResolvedValue({ ok: true, user: updatedUser });

    const { result } = renderHook(() => useProfileEditScreen());

    await act(async () => {
      await result.current.handleRemoveAvatar();
    });

    expect(mockDeleteAvatar).toHaveBeenCalledTimes(1);
    expect(mockApplySessionUser).toHaveBeenCalledWith(updatedUser);
    expect(result.current.feedback).toEqual({
      kind: 'info',
      text: copy.avatarRemovedMessage,
    });
  });

  it('should not remove avatar when user has no avatarUrl', async () => {
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isAuthenticated: true,
      authResolved: true,
      applySessionUser: mockApplySessionUser,
    });

    const { result } = renderHook(() => useProfileEditScreen());

    await act(async () => {
      await result.current.handleRemoveAvatar();
    });

    expect(mockDeleteAvatar).not.toHaveBeenCalled();
  });
});
