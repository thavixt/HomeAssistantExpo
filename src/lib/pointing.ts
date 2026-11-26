/** a 3D vector, in device coordinates (x right, y towards the top edge, z out of the screen) or world ones */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * where the phone's top edge points, as a unit vector in the world frame:
 * x = east, y = north, z = up
 */
export type Aim = Vec3;

const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const length = (v: Vec3) => Math.hypot(v.x, v.y, v.z);
const normalize = (v: Vec3): Vec3 | null => {
  const l = length(v);
  return l < 1e-6 ? null : { x: v.x / l, y: v.y / l, z: v.z / l };
};
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

/** exponential smoothing, `factor` 0..1 - lower is smoother but laggier */
export const lowPass = (prev: Vec3 | null, next: Vec3, factor: number): Vec3 =>
  prev
    ? {
        x: prev.x + factor * (next.x - prev.x),
        y: prev.y + factor * (next.y - prev.y),
        z: prev.z + factor * (next.z - prev.z),
      }
    : next;

/**
 * a tilt-compensated compass: gravity (the accelerometer at rest) and the magnetic field give the
 * world's east/north/up axes in device coordinates - the device's y axis expressed in them is the aim.
 * the same maths as android's SensorManager.getRotationMatrix.
 *
 * calibration and matching both go through this, so a platform with flipped axis signs would still
 * match itself - only the displayed compass heading would be off.
 */
export function computeAim(gravity: Vec3, magnetic: Vec3): Aim | null {
  const up = normalize(gravity);
  const east = normalize(cross(magnetic, gravity));
  if (!up || !east) return null;
  const north = cross(up, east);
  // the device y axis (0, 1, 0) projected onto each world axis
  return normalize({ x: east.y, y: north.y, z: up.y });
}

/** the angle between two aims, in degrees */
export const angleBetween = (a: Aim, b: Aim) => (Math.acos(Math.min(1, Math.max(-1, dot(a, b)))) * 180) / Math.PI;

/** past this elevation (either way) the compass heading is too unstable to compare - ~72° */
const MAX_HORIZONTAL_Z = 0.95;

/**
 * the difference in compass heading between two aims, in degrees (0-180) - ignores how far up or down they point.
 * Infinity when either points almost straight up or down, where there's no meaningful heading
 */
export function headingBetween(a: Aim, b: Aim) {
  if (Math.abs(a.z) > MAX_HORIZONTAL_Z || Math.abs(b.z) > MAX_HORIZONTAL_Z) return Infinity;
  const diff = Math.abs(Math.atan2(a.x, a.y) - Math.atan2(b.x, b.y)) * (180 / Math.PI);
  return diff > 180 ? 360 - diff : diff;
}

/** compass heading (0 = north, 90 = east) and elevation (+90 = straight up), in degrees - for display */
export function describeAim(aim: Aim) {
  const heading = ((Math.atan2(aim.x, aim.y) * 180) / Math.PI + 360) % 360;
  const elevation = (Math.asin(Math.min(1, Math.max(-1, aim.z))) * 180) / Math.PI;
  return { heading, elevation };
}

/** the mean direction of a set of aims */
export const averageAim = (aims: Aim[]): Aim | null =>
  normalize(aims.reduce((sum, a) => ({ x: sum.x + a.x, y: sum.y + a.y, z: sum.z + a.z }), { x: 0, y: 0, z: 0 }));
