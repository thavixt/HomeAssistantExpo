import { Screen } from '@/components/screen';
import { Assist } from '@/components/widgets/assist';
import { Devices } from '@/components/widgets/devices';
import { Security } from '@/components/widgets/security';
import { System } from '@/components/widgets/system';

/* Assist, Devices, System and Security together, on one tab */
export default function HomeScreen() {
  return (
    <Screen>
      <Devices />
      <System />
      <Security />
      <Assist />
    </Screen>
  );
}
