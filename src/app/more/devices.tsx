import { BackLink } from '@/components/back-link';
import { Screen } from '@/components/screen';
import { Devices } from '@/components/widgets/devices';

/* native only - the "More" tab's copy of /devices, since android's tab bar has no room for it */
export default function MoreDevicesScreen() {
  return (
    <Screen>
      <BackLink label="More" />
      <Devices />
    </Screen>
  );
}
