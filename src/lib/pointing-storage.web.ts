import type { Aim } from '@/lib/pointing';

/* no pointer on web (no magnetometer) - and expo-sqlite would need its wasm setup in the web bundle */

export function loadCalibration(_targetId: string): Aim | null {
  return null;
}

export function saveCalibration(_targetId: string, _aim: Aim | null) {}
