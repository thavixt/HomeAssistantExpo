import { SectionPlaceholder } from '@/components/section-placeholder';

/* native only - the "More" tab's copy of /devices, since android's tab bar has no room for it */
export default function MoreDevicesScreen() {
  return <SectionPlaceholder section="devices" back="More" />;
}
