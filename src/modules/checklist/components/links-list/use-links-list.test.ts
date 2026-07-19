import { act, renderHook } from '@tests/utils/test-utils';
import { Linking } from 'react-native';

import { useLinksList } from './use-links-list';

describe('useLinksList', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should expose styles and open urls via Linking', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const { result } = renderHook(() => useLinksList());

    expect(result.current.styles).toBeDefined();

    act(() => {
      result.current.handleOpenLink('https://example.com/playbook');
    });

    expect(openURL).toHaveBeenCalledWith('https://example.com/playbook');
  });
});
