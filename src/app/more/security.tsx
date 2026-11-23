import { SectionPlaceholder } from '@/components/section-placeholder';

/* native only - the "More" tab's copy of /security, since android's tab bar has no room for it */
export default function MoreSecurityScreen() {
  return <SectionPlaceholder section="security" back="More" />;
}
