import { BackLink } from '@/components/back-link';
import { Screen } from '@/components/screen';
import { Assist } from '@/components/widgets/assist';

/* native only - the "More" tab's copy of /assist, since android's tab bar has no room for it */
export default function MoreAssistScreen() {
  return (
    <Screen>
      <BackLink label="More" />
      <Assist />
    </Screen>
  );
}
