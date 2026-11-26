import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import { averageAim, computeAim, headingBetween, lowPass, type Aim, type Vec3 } from '@/lib/pointing';

/* --- tuning: everything you'd want to tweak while trying it out --- */

/** ms between accelerometer/magnetometer readings (for the aim) */
const AIM_INTERVAL = 50;
/** ms between gyroscope readings (for the twist) - fast, a twist is over in ~300ms */
const GYRO_INTERVAL = 16;
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
/** rad/s around the phone's long axis that starts a twist (~115°/s) */
const TWIST_START_RATE = 2;
/** a twist must turn the wrist this far, in radians (~40°) */
const TWIST_ANGLE = 0.7;
/** ...within this many ms */
const TWIST_MAX_DURATION = 600;
/** ms to ignore the gyroscope after a twist - covers turning the wrist back */
const TWIST_COOLDOWN = 1200;
/**
 * which gyroscope sign means "turned right". with the right-hand rule around the y axis (towards the top edge),
 * turning the wrist right (clockwise, looking along the phone) is positive - flip it if it's backwards on a device
 */
const TWIST_SIGN = 1;
/** ms of aim readings to average when calibrating */
export const CALIBRATION_DURATION = 1500;
/** ms between aim updates in react state - the sensors run faster, this is only for display */
const UI_INTERVAL = 100;

export type TwistDirection = 'left' | 'right';

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
   * none yet), and twists only count while held
   */
  held: boolean;
  /** a twist while held and locked on to `targetId` */
  onTwist: (direction: TwistDirection, targetId: string) => void;
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
 * "point the phone at something, then twist the wrist": tracks where the phone's top edge points (accelerometer +
 * magnetometer), which target that's at, and detects quick wrist twists (gyroscope) while it's at one
 */
export function usePointer({ enabled, targets, held, onTwist, onLockChange }: PointerOptions) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [aim, setAim] = useState<Aim | null>(null);
  const [lockedId, setLockedId] = useState<string | null>(null);

  // the sensor listeners read these, so they don't have to resubscribe on every render
  const latest = useRef({ targets, held, onTwist, onLockChange });
  useEffect(() => {
    latest.current = { targets, held, onTwist, onLockChange };
  });

  const lockedRef = useRef<string | null>(null);
  const samplesRef = useRef<Aim[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([Accelerometer.isAvailableAsync(), Magnetometer.isAvailableAsync(), Gyroscope.isAvailableAsync()])
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

      // held and locked: frozen, so aiming away mid-twist can't change or drop the target
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
    Gyroscope.setUpdateInterval(GYRO_INTERVAL);

    const accelSub = Accelerometer.addListener((data) => {
      gravity = lowPass(gravity, data, SMOOTHING);
      updateAim();
    });
    const magSub = Magnetometer.addListener((data) => {
      magnetic = lowPass(magnetic, data, SMOOTHING);
    });

    // twist detection: integrate the rotation around the long axis while it's fast
    let twist: { start: number; angle: number; lockedAtStart: string | null } | null = null;
    let lastGyro = 0;
    let cooldownUntil = 0;
    const gyroSub = Gyroscope.addListener(({ x, y, z }) => {
      const now = Date.now();
      const dt = lastGyro ? Math.min((now - lastGyro) / 1000, 0.1) : 0;
      lastGyro = now;
      if (now < cooldownUntil) return;
      // twists only count while the trigger is held
      if (!latest.current.held) {
        twist = null;
        return;
      }

      const rate = y * TWIST_SIGN;
      if (!twist) {
        // a twist is mostly around y - not a swing of the whole arm
        const dominant = Math.abs(y) > 1.5 * Math.max(Math.abs(x), Math.abs(z));
        // remember what it was locked on to *before* the twist, the twist itself shakes the aim
        if (Math.abs(rate) > TWIST_START_RATE && dominant) twist = { start: now, angle: 0, lockedAtStart: lockedRef.current };
        return;
      }

      twist.angle += rate * dt;
      if (Math.abs(twist.angle) > TWIST_ANGLE) {
        if (twist.lockedAtStart) latest.current.onTwist(twist.angle > 0 ? 'right' : 'left', twist.lockedAtStart);
        twist = null;
        cooldownUntil = now + TWIST_COOLDOWN;
      } else if (now - twist.start > TWIST_MAX_DURATION || Math.abs(rate) < 0.5) {
        twist = null;
      }
    });

    return () => {
      accelSub.remove();
      magSub.remove();
      gyroSub.remove();
      lockedRef.current = null;
      setLockedId(null);
    };
  }, [enabled, available]);

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
    sampleAim,
  };
}
