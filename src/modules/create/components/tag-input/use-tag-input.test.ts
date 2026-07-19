import { act, renderHook } from '@tests/utils/test-utils';

import { COPY } from '@/constants/copy';

import { useTagInput } from './use-tag-input';

describe('useTagInput', () => {
  it('should expose initial draft and create-screen copy', () => {
    const onAdd = jest.fn();
    const { result } = renderHook(() => useTagInput({ onAdd }));

    expect(result.current.draft).toBe('');
    expect(result.current.placeholder).toBe(COPY.screens.create.fields.tagsPlaceholder);
    expect(result.current.removeAccessibilityLabel).toBe(COPY.screens.create.removeTag);
    expect(result.current.styles).toBeDefined();
  });

  it('should update draft via handleDraftChange', () => {
    const onAdd = jest.fn();
    const { result } = renderHook(() => useTagInput({ onAdd }));

    act(() => {
      result.current.handleDraftChange('#Deploy CI');
    });

    expect(result.current.draft).toBe('#Deploy CI');
  });

  it('should sanitize, add tag, and clear draft on submit', () => {
    const onAdd = jest.fn();
    const { result } = renderHook(() => useTagInput({ onAdd }));

    act(() => {
      result.current.handleDraftChange('  #Code Review  ');
    });

    act(() => {
      result.current.handleSubmitEditing();
    });

    expect(onAdd).toHaveBeenCalledWith('code-review');
    expect(result.current.draft).toBe('');
  });

  it('should not add empty or whitespace-only tags', () => {
    const onAdd = jest.fn();
    const { result } = renderHook(() => useTagInput({ onAdd }));

    act(() => {
      result.current.handleDraftChange('   #  ');
    });

    act(() => {
      result.current.handleSubmitEditing();
    });

    expect(onAdd).not.toHaveBeenCalled();
  });
});
