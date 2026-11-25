import { Screen } from '@/components/screen';
import { ActivityLog } from '@/components/widgets/activity-log';

export default function ActivityScreen() {
  return (
    // the list scrolls inside its card, instead of the whole screen
    <Screen scroll={false}>
      <ActivityLog />
    </Screen>
  );
}
