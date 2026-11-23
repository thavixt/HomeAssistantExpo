import { Card } from '@/components/card';
import { Cell, Grid } from '@/components/grid';
import { Automation } from '@/components/ha/automation';
import { useNow } from '@/hooks/use-now';
import { ENTITIES } from '@/lib/entities';
import { SECTIONS } from '@/lib/sections';

/* the same automations, in the same order, as the pwa */
const AUTOMATIONS: { id: string; name?: string }[] = [
  { id: ENTITIES.automations.homeEnter },
  { id: ENTITIES.automations.homeLeaving },
  { id: ENTITIES.automations.turnOnTv },
  { id: ENTITIES.automations.homeMorningSetup },
  { id: ENTITIES.automations.homeAfternoonLights },
  { id: ENTITIES.automations.turnOffTvAtMidnight },
  { id: ENTITIES.automations.phoneSleepReminder },
  { id: ENTITIES.automations.cpuTemperatureWarning, name: 'CPU temp. warn.' },
  { id: ENTITIES.automations.dashboardsBatteryLow },
  { id: ENTITIES.automations.radioRefreshLiveVideoId, name: 'Radio 1 stream link' },
];

export function Automations() {
  // one clock for the whole card, so every "ran 5m ago" moves on together
  const now = useNow(60_000);

  return (
    <Card icon={SECTIONS.automations.icon} title={SECTIONS.automations.title}>
      <Grid>
        {AUTOMATIONS.map(({ id, name }) => (
          <Cell key={id}>
            <Automation id={id} name={name} now={now} />
          </Cell>
        ))}
      </Grid>
    </Card>
  );
}
