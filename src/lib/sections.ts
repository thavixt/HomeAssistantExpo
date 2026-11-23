import type { EntityIcon } from '@/components/ha/entity-button';

interface Section {
  title: string;
  /** `ios` is an SF Symbol, `android`/`web` a Material Symbol - also used for the native tab icons */
  icon: EntityIcon & { ios: string; android: string };
}

/* the pwa's sections that aren't ported yet - they only show a placeholder for now */
export const SECTIONS = {
  automations: {
    title: 'Automations',
    icon: { ios: 'gearshape.2', android: 'auto_mode', web: 'auto_mode' },
  },
  devices: {
    title: 'Devices',
    icon: { ios: 'cpu', android: 'devices', web: 'devices' },
  },
  system: {
    title: 'System',
    icon: { ios: 'server.rack', android: 'dns', web: 'dns' },
  },
  security: {
    title: 'Security',
    icon: { ios: 'lock.shield', android: 'security', web: 'security' },
  },
} satisfies Record<string, Section>;

export type SectionId = keyof typeof SECTIONS;

/* android's native tab bar fits at most 5 tabs, so these live behind the "More" tab there */
export const MORE_SECTIONS = ['devices', 'system', 'security'] as const satisfies SectionId[];
