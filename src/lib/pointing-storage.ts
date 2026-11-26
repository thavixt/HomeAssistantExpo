import Storage from 'expo-sqlite/kv-store';

import type { Aim } from '@/lib/pointing';

/* saved pointer calibrations, one per target - see pointing-storage.web.ts for web */

const storageKey = (targetId: string) => `pointer.calibration.${targetId}`;

export function loadCalibration(targetId: string): Aim | null {
  const raw = Storage.getItemSync(storageKey(targetId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Aim;
    return typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCalibration(targetId: string, aim: Aim | null) {
  if (aim) Storage.setItemSync(storageKey(targetId), JSON.stringify(aim));
  else Storage.removeItemSync(storageKey(targetId));
}
