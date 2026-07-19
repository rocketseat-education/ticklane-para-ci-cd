import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, renderHook, type RenderOptions } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme/theme-provider';

jest.mock('react-native-safe-area-context');

function Providers({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialPreference="dark">{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: Providers, ...options });
};

const customRenderHook = <T,>(hook: () => T) => {
  return renderHook(hook, {
    wrapper: Providers,
  });
};

export * from '@testing-library/react-native';

export { customRender as render, customRenderHook as renderHook };
