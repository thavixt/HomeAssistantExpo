import { Accelerometer, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import { averageAim, computeAim, headingBetween, lowPass, type Aim, type Vec3 } from '@/lib/pointing';

/* --- tuning: everything you'd want to tweak while trying it out --- */

/** ms between accelerometer/magnetometer readings (for the aim) */
const AIM_INTERVAL = 50;
/** smoothing of the aim - lower is steadier but laggier */
const SMOOTHING = 0.2;
/**
 * within this many degrees of a target it locks on, and it lets go past UNLOCK_ANGLE (hysteresis, so it doesn't
 * flicker at the edge). keep UNLOCK_ANGLE under half the gap between two targets, or their cones overlap
 */
export const LOCK_ANGLE = 20;
const UNLOCK_ANGLE = 30;
/** two calibrations closer than this can't be told apart reliably */
export const MIN_TARGET_SEPARATION = 2 * UNLOCK_ANGLE;
/** ms to keep holding the trigger while locked on before it fires */
export const HOLD_DURATION = 1000;
/** ms of aim readings to average when calibrating */
export const CALIBRATION_DURATION = 1500;
/** ms between aim updates in react state - the sensors run faster, this is only for display */
const UI_INTERVAL = 250;

export interface PointerTarget {
  id: string;
  /** the calibrated direction */
  aim: Aim;
}

interface PointerOptions {
  /** only listen to the sensors while true, e.g. while the screen is focused */
  enabled: boolean;
  /** the calibrated targets to lock on to */
  targets: PointerTarget[];
  /**
   * true while the user holds the trigger: the lock freezes on its current target (or the first one aimed at, if
   * none yet), and after HOLD_DURATION of holding while locked it fires
   */
  held: boolean;
  /** held for HOLD_DURATION while locked on to `targetId` - fires once per press */
  onHold: (targetId: string) => void;
  /** called when it locks on to a target (its id) or lets go (null) - e.g. for haptics */
  onLockChange?: (targetId: string | null) => void;
}

/** sticks with the current target while within UNLOCK_ANGLE, otherwise picks the nearest one within LOCK_ANGLE */
function pickTarget(aim: Aim, targets: PointerTarget[], current: string | null): string | null {
  const currentTarget = current ? targets.find((t) => t.id === current) : undefined;
  if (currentTarget && headingBetween(aim, currentTarget.aim) < UNLOCK_ANGLE) return current;

  let best: string | null = null;
  let bestAngle = LOCK_ANGLE;
  for (const target of targets) {
    const angle = headingBetween(aim, target.aim);
    if (angle < bestAngle) {
      best = target.id;
      bestAngle = angle;
    }
  }
  return best;
}

/**
 * "point the phone at something, then hold the button": tracks where the phone's top edge points (accelerometer +
 * magnetometer), which target that's at, and fires once the trigger has been held for HOLD_DURATION while locked on
 */
export function usePointer({ enabled, targets, held, onHold, onLockChange }: PointerOptions) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [aim, setAim] = useState<Aim | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);
  /** already fired during this press */
  const [fired, setFired] = useState(false);

  // the sensor listeners read these, so they don't have to resubscribe on every render
  const latest = useRef({ targets, held, onHold, onLockChange });
  useEffect(() => {
    latest.current = { targets, held, onHold, onLockChange };
  });

  const lockedRef = useRef<string | null>(null);
  const samplesRef = useRef<Aim[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([Accelerometer.isAvailableAsync(), Magnetometer.isAvailableAsync()])
      .then((all) => !cancelled && setAvailable(all.every(Boolean)))
      .catch(() => !cancelled && setAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !available) return;

    let gravity: Vec3 | null = null;
    let magnetic: Vec3 | null = null;
    let lastUi = 0;

    const updateAim = () => {
      if (!gravity || !magnetic) return;
      const next = computeAim(gravity, magnetic);
      if (!next) return;
      samplesRef.current?.push(next);

      // held and locked: frozen, so drifting off mid-hold can't change or drop the target
      const frozen = latest.current.held && lockedRef.current !== null;
      const nowLocked = frozen ? lockedRef.current : pickTarget(next, latest.current.targets, lockedRef.current);
      if (nowLocked !== lockedRef.current) {
        lockedRef.current = nowLocked;
        setLockedId(nowLocked);
        latest.current.onLockChange?.(nowLocked);
      }

      const now = Date.now();
      if (now - lastUi > UI_INTERVAL) {
        lastUi = now;
        setAim(next);
      }
    };

    Accelerometer.setUpdateInterval(AIM_INTERVAL);
    Magnetometer.setUpdateInterval(AIM_INTERVAL);

    const accelSub = Accelerometer.addListener((data) => {
      gravity = lowPass(gravity, data, SMOOTHING);
      updateAim();
    });
    const magSub = Magnetometer.addListener((data) => {
      magnetic = lowPass(magnetic, data, SMOOTHING);
    });

    return () => {
      accelSub.remove();
      magSub.remove();
      lockedRef.current = null;
      setLockedId(null);
    };
  }, [enabled, available]);

  // the hold timer: starts once held and locked (the lock is frozen while held, so it only changes from none to one)
  // releasing re-arms it (adjusting state while rendering, rather than in an effect)
  if (!held && fired) setFired(false);
  const charging = held && lockedId !== null && !fired;
  useEffect(() => {
    if (!charging || !lockedId) return;
    const timer = setTimeout(() => {
      setFired(true);
      latest.current.onHold(lockedId);
    }, HOLD_DURATION);
    return () => clearTimeout(timer);
  }, [charging, lockedId]);

  /** averages the aim over CALIBRATION_DURATION - hold the phone still, pointed at the target */
  const sampleAim = () =>
    new Promise<Aim | null>((resolve) => {
      samplesRef.current = [];
      setTimeout(() => {
        const samples = samplesRef.current ?? [];
        samplesRef.current = null;
        resolve(averageAim(samples));
      }, CALIBRATION_DURATION);
    });

  return {
    /** null while checking, false on devices (or web) without the sensors */
    available,
    aim,
    /** the target it's pointing at, if any */
    lockedId,
    /** held and locked on, counting down HOLD_DURATION - e.g. to animate progress */
    charging,
    sampleAim,
  };
}
