import { act, renderHook } from '@tests/utils/test-utils';
import { authenticatedUserMock, guestUserMock } from '@mocks/data/users';

import { COPY } from '@/constants/copy';

import { useRateChecklistSheet } from './use-rate-checklist-sheet';

const mockRateChecklist = jest.fn();
const mockUseUserRating = jest.fn();

jest.mock('@/modules/auth/context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/state/library', () => ({
  useLibrary: () => ({
    rateChecklist: mockRateChecklist,
  }),
  useUserRating: (...args: unknown[]) => mockUseUserRating(...args),
}));

import { useAuth } from '@/modules/auth/context';

const useAuthMock = useAuth as jest.Mock;
const onClose = jest.fn();
const copy = COPY.screens.checklistDetails.rateSheet;

describe('useRateChecklistSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.mockReturnValue({
      currentUser: authenticatedUserMock,
      isGuest: false,
    });
    mockUseUserRating.mockReturnValue(0);
  });

  it('should expose copy, unrated helper, and disabled save when score is zero', () => {
    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    expect(mockUseUserRating).toHaveBeenCalledWith('checklist-1', authenticatedUserMock.id);
    expect(result.current.title).toBe(copy.title);
    expect(result.current.description).toBe(`${copy.descriptionPrefix} "Deploy checklist".`);
    expect(result.current.helperLabel).toBe(copy.unrated);
    expect(result.current.selectedScore).toBe(0);
    expect(result.current.canSave).toBe(false);
    expect(result.current.saveLabel).toBe(copy.save);
    expect(result.current.unrateLabel).toBe(copy.unrate);
  });

  it('should pass null viewer id for guests when reading rating', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    expect(mockUseUserRating).toHaveBeenCalledWith('checklist-1', null);
  });

  it('should sync selected score from persisted rating when visible', () => {
    mockUseUserRating.mockReturnValue(4);

    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    expect(result.current.selectedScore).toBe(4);
    expect(result.current.helperLabel).toBe(`${copy.currentScore} 4/5`);
    expect(result.current.canSave).toBe(false);
  });

  it('should enable canSave when selected score differs from persisted', () => {
    mockUseUserRating.mockReturnValue(3);
    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleScoreChange(5);
    });

    expect(result.current.selectedScore).toBe(5);
    expect(result.current.canSave).toBe(true);
    expect(result.current.helperLabel).toBe(`${copy.currentScore} 5/5`);
  });

  it('should save rating and close for authenticated users', () => {
    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleScoreChange(5);
    });

    act(() => {
      result.current.handleSave();
    });

    expect(mockRateChecklist).toHaveBeenCalledWith('checklist-1', 5, authenticatedUserMock.id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not save when score is zero or user is guest', () => {
    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleSave();
    });

    expect(mockRateChecklist).not.toHaveBeenCalled();

    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    const guest = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      guest.result.current.handleScoreChange(4);
      guest.result.current.handleSave();
    });

    expect(mockRateChecklist).not.toHaveBeenCalled();
  });

  it('should unrate and close for authenticated users', () => {
    mockUseUserRating.mockReturnValue(5);
    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleUnrate();
    });

    expect(mockRateChecklist).toHaveBeenCalledWith('checklist-1', 0, authenticatedUserMock.id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not unrate when user is guest', () => {
    useAuthMock.mockReturnValue({
      currentUser: guestUserMock,
      isGuest: true,
    });

    const { result } = renderHook(() =>
      useRateChecklistSheet({
        checklistId: 'checklist-1',
        checklistTitle: 'Deploy checklist',
        visible: true,
        onClose,
      }),
    );

    act(() => {
      result.current.handleUnrate();
    });

    expect(mockRateChecklist).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
