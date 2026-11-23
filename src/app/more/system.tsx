import { SectionPlaceholder } from '@/components/section-placeholder';

/* native only - the "More" tab's copy of /system, since android's tab bar has no room for it */
export default function MoreSystemScreen() {
  return <SectionPlaceholder section="system" back="More" />;
}
