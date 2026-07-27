import { Asset } from 'expo-asset';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ErrorBanner, Header, LoadingState, Screen } from '@/components/ui';
import { colors, rtlText, spacing } from '@/constants/theme';

const assets = {
  // Metro resolves the copied legal text files as static assets.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  terms: require('../../../assets/legal/terms.txt'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  privacy: require('../../../assets/legal/privacy.txt'),
};

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type: 'terms' | 'privacy' }>();
  const legalType = type === 'privacy' ? 'privacy' : 'terms';
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(assets[legalType]);
        await asset.downloadAsync();
        const response = await fetch(asset.localUri ?? asset.uri);
        setContent(await response.text());
      } catch {
        setError('تعذر تحميل النص القانوني');
      }
    })();
  }, [legalType]);

  return (
    <Screen>
      <Header title={legalType === 'privacy' ? 'سياسة الخصوصية' : 'شروط الاستخدام'} back />
      <ErrorBanner message={error} />
      {!content && !error ? <LoadingState /> : <Text style={styles.content}>{content}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { color: colors.ink, fontSize: 15, lineHeight: 26, paddingBottom: spacing.xl, ...rtlText },
});
