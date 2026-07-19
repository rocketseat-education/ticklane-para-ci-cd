import { View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';

import { useDeleteAccountSection } from './use-delete-account-section';

export function DeleteAccountSection() {
  const {
    styles,
    copy,
    step,
    handleStartPress,
    handleCancelPress,
    handleConfirmPress,
  } = useDeleteAccountSection();

  return (
    <View style={styles.root}>
      <Text variant="h3">{copy.sectionTitle}</Text>
      <Text variant="bodySm" color="textMuted">
        {copy.warning}
      </Text>

      {step === 'idle' ? (
        <Button variant="danger" size="md" isFullWidth label={copy.cta} onPress={handleStartPress} />
      ) : (
        <View style={styles.actions}>
          <Text variant="bodySm" color="danger">
            {copy.confirmTitle}
          </Text>
          <Text variant="bodySm" color="textMuted">
            {copy.confirmDescription}
          </Text>
          <View style={styles.bulletList}>
            {copy.removedItems.map((item) => (
              <Text key={item} variant="bodySm" color="textMuted">
                • {item}
              </Text>
            ))}
          </View>
          <Button
            variant="danger"
            size="md"
            isFullWidth
            label={step === 'deleting' ? copy.deletingLabel : copy.confirmCta}
            isLoading={step === 'deleting'}
            isDisabled={step === 'deleting'}
            onPress={handleConfirmPress}
          />
          <Button
            variant="ghost"
            size="md"
            isFullWidth
            label={copy.cancelCta}
            isDisabled={step === 'deleting'}
            onPress={handleCancelPress}
          />
        </View>
      )}
    </View>
  );
}
