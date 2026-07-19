import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { COPY } from '@/constants/copy';
import { ROUTES } from '@/constants/routes';
import { deleteAccount } from '@/lib/deleteAccount';
import { useAuth } from '@/modules/auth/context';
import { useTheme } from '@/theme/use-theme';

import { createStyles } from './delete-account-section.styles';

type DeleteStep = 'idle' | 'confirm' | 'deleting';

export function useDeleteAccountSection() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const copy = COPY.screens.profile.deleteAccount;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const [step, setStep] = useState<DeleteStep>('idle');

  const handleStartPress = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleCancelPress = useCallback(() => {
    setStep('idle');
  }, []);

  const handleConfirmPress = useCallback(async () => {
    setStep('deleting');

    const result = await deleteAccount();

    if (!result.ok) {
      setStep('confirm');
      Alert.alert(copy.errorTitle, result.error);
      return;
    }

    await signOut();
    setStep('idle');
    router.replace(ROUTES.tabs.home);
  }, [copy.errorTitle, router, signOut]);

  return {
    styles,
    copy,
    step,
    handleStartPress,
    handleCancelPress,
    handleConfirmPress,
  };
}
