import { BackLink } from '@/components/back-link';
import { Screen } from '@/components/screen';
import { System } from '@/components/widgets/system';

/* native only - the "More" tab's copy of /system, since android's tab bar has no room for it */
export default function MoreSystemScreen() {
  return (
    <Screen>
      <BackLink label="More" />
      <System />
    </Screen>
  );
}
