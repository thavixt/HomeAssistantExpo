import { Card } from '@/components/card';
import { NavRow } from '@/components/nav-row';
import { Screen } from '@/components/screen';
import { MORE_SECTIONS, SECTIONS } from '@/lib/sections';

/* native only - the sections that don't fit in android's 5-tab bar */
export default function MoreScreen() {
  return (
    <Screen>
      <Card icon={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} title="More">
        {MORE_SECTIONS.map((id) => (
          <NavRow key={id} href={`/more/${id}`} icon={SECTIONS[id].icon} title={SECTIONS[id].title} />
        ))}
      </Card>
    </Screen>
  );
}
