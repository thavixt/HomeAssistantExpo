import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SECTIONS, type SectionId } from '@/lib/sections';

/** a whole tab for a section that isn't built yet. `back` adds a back link, for screens pushed from "More" */
export function SectionPlaceholder({ section, back }: { section: SectionId; back?: string }) {
  const { title, icon } = SECTIONS[section];

  return (
    <Screen>
      {back && <BackLink label={back} />}
      <Card icon={icon} title={title}>
        <ThemedText type="small" themeColor="textSecondary">
          Coming soon - this section isn&apos;t ported from the PWA yet.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function BackLink({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      hitSlop={8}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={16}
        tintColor={theme.text}
      />
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
});
