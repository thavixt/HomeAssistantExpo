import { Card } from '@/components/card';
import { Cell, Grid } from '@/components/grid';
import { Light } from '@/components/ha/light';
import { Scene } from '@/components/ha/scene';
import { Switch } from '@/components/ha/switch';
import { ENTITIES } from '@/constants/entities';

export function Lights() {
  return (
    <Card icon={{ ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' }} title="Lights">
      <Grid>
        <Cell><Light id={ENTITIES.lights.entrance} name="Entrance" icon={{ ios: 'door.left.hand.open', android: 'door_open', web: 'door_open' }} /></Cell>
        <Cell><Switch id={ENTITIES.lights.pcDesk} name="PC desk" icon={{ ios: 'laptopcomputer', android: 'laptop', web: 'laptop' }} /></Cell>
        <Cell><Light id={ENTITIES.lights.livingRoom} name="Living room" icon={{ ios: 'house', android: 'house', web: 'house' }} /></Cell>
        <Cell><Switch id={ENTITIES.lights.stairs} name="Stairs" icon={{ ios: 'stairs', android: 'stairs', web: 'stairs' }} /></Cell>
        <Cell><Switch id={ENTITIES.lights.tvStand} name="TV stand" icon={{ ios: 'tv', android: 'tv', web: 'tv' }} /></Cell>
        <Cell><Light id={ENTITIES.lights.bedside} name="Bedside" icon={{ ios: 'bed.double', android: 'bed', web: 'bed' }} /></Cell>
      </Grid>

      <Grid>
        <Cell><Scene id={ENTITIES.scenes.vibes} icon={{ ios: 'party.popper', android: 'celebration', web: 'celebration' }} /></Cell>
        <Cell><Scene id={ENTITIES.scenes.nightLights} icon={{ ios: 'sunset', android: 'wb_twilight', web: 'wb_twilight' }} /></Cell>
        <Cell><Scene id={ENTITIES.scenes.sleepMode} icon={{ ios: 'moon', android: 'bedtime', web: 'bedtime' }} /></Cell>
        <Cell><Scene id={ENTITIES.scenes.lightsOff} icon={{ ios: 'lightbulb.slash', android: 'light_off', web: 'light_off' }} /></Cell>
      </Grid>
    </Card>
  );
}
