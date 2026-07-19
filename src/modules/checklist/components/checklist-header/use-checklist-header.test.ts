import { renderHook } from '@tests/utils/test-utils';
import { checklistDetailsMock } from '@mocks/data/checklists';

import { COPY } from '@/constants/copy';

import { useChecklistHeader } from './use-checklist-header';

describe('useChecklistHeader', () => {
  it('should expose checklist, styles, and rate accessibility label', () => {
    const { result } = renderHook(() =>
      useChecklistHeader({ checklist: checklistDetailsMock }),
    );

    expect(result.current.checklist).toBe(checklistDetailsMock);
    expect(result.current.styles).toBeDefined();
    expect(result.current.hitSlop).toBeDefined();
    expect(result.current.ratingAccessibilityLabel).toBe(COPY.actions.rateChecklist);
  });
});
