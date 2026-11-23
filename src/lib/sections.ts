import type { EntityIcon } from '@/components/ha/entity-button';

interface Section {
  title: string;
  /** `ios` is an SF Symbol, `android`/`web` a Material Symbol - also used for the native tab icons */
  icon: EntityIcon & { ios: string; android: string };
}

export const SECTIONS = {
  assist: {
    title: 'Assist',
    icon: { ios: 'text.bubble', android: 'chat', web: 'chat' },
  },
  automations: {
    title: 'Automations',
    icon: { ios: 'gearshape.2', android: 'auto_mode', web: 'auto_mode' },
  },
  climate: {
    title: 'Climate',
    icon: { ios: 'air.conditioner.horizontal', android: 'ac_unit', web: 'ac_unit' },
  },
  devices: {
    title: 'Devices',
    icon: { ios: 'cpu', android: 'devices', web: 'devices' },
  },
  lights: {
    title: 'Lights',
    icon: { ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' },
  },
  security: {
    title: 'Security',
    icon: { ios: 'lock.shield', android: 'security', web: 'security' },
  },
  system: {
    title: 'System',
    icon: { ios: 'server.rack', android: 'dns', web: 'dns' },
  },
  tv: {
    title: 'TV',
    icon: { ios: 'tv', android: 'tv', web: 'tv' },
  },
} satisfies Record<string, Section>;

export type SectionId = keyof typeof SECTIONS;

