import { BackLink } from '@/components/back-link';
import { Screen } from '@/components/screen';
import { Security } from '@/components/widgets/security';

/* native only - the "More" tab's copy of /security, since android's tab bar has no room for it */
export default function MoreSecurityScreen() {
  return (
    <Screen>
      <BackLink label="More" />
      <Security />
    </Screen>
  );
}
