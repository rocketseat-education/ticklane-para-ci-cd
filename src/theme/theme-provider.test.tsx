import { act, renderHook } from '@testing-library/react-native';

import { darkTheme, lightTheme } from './index';
import { ThemeProvider, type ThemeContextValue } from './theme-provider';
import { useTheme } from './use-theme';

function renderTheme(initialPreference?: 'light' | 'dark' | 'system', systemMode?: 'light' | 'dark' | null) {
  return renderHook(() => useTheme(), {
    wrapper: ({ children }) => (
      <ThemeProvider initialPreference={initialPreference} systemMode={systemMode}>
        {children}
      </ThemeProvider>
    ),
  });
}

describe('ThemeProvider', () => {
  it('should default to dark preference and dark theme', () => {
    const { result } = renderTheme();

    expect(result.current.preference).toBe('dark');
    expect(result.current.mode).toBe('dark');
    expect(result.current.theme).toBe(darkTheme);
  });

  it('should use light theme when preference is light', () => {
    const { result } = renderTheme('light');

    expect(result.current.mode).toBe('light');
    expect(result.current.theme).toBe(lightTheme);
  });

  it('should resolve system preference from systemMode', () => {
    const { result } = renderTheme('system', 'light');

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('light');
    expect(result.current.theme).toBe(lightTheme);
  });

  it('should fall back to dark when preference is system and systemMode is null', () => {
    const { result } = renderTheme('system', null);

    expect(result.current.mode).toBe('dark');
    expect(result.current.theme).toBe(darkTheme);
  });

  it('should toggle between dark and light modes', () => {
    const { result } = renderTheme('dark');

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe('light');
    expect(result.current.preference).toBe('light');

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe('dark');
  });

  it('should allow setPreference to switch to system', () => {
    const { result } = renderTheme('dark', 'light');

    act(() => {
      result.current.setPreference('system');
    });

    expect(result.current.preference).toBe('system');
    expect(result.current.mode).toBe('light');
  });
});

describe('useTheme', () => {
  it('should throw when used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider.');
  });
});
