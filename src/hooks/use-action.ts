import { useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

interface ActionOptions {
  /** ignore new runs while one is in flight (default). turn off where every press counts, e.g. volume steps */
  exclusive?: boolean;
}

/**
 * runs a service call and tracks `pending`. on failure shows an alert with a retry button.
 * `label` finishes the sentence "Couldn't …".
 */
export function useAction<A extends unknown[]>(
  action: (...args: A) => Promise<unknown>,
  label: string | ((...args: A) => string),
  { exclusive = true }: ActionOptions = {},
) {
  const [pending, setPending] = useState(false);
  // a ref, because a second tap can land before the re-render with pending=true
  const inFlight = useRef(0);

  const run = async (...args: A) => {
    if (exclusive && inFlight.current > 0) return;
    inFlight.current += 1;
    setPending(true);
    try {
      await action(...args);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const title = `Couldn't ${typeof label === 'function' ? label(...args) : label}`;
      const retry = () => void run(...args);
      if (Platform.OS === 'web') {
        // Alert.alert is a no-op on react-native-web
        if (window.confirm(`${title}\n\n${message}\n\nRetry?`)) retry();
      } else {
        Alert.alert(title, message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: retry },
        ]);
      }
    } finally {
      inFlight.current -= 1;
      setPending(inFlight.current > 0);
    }
  };

  return { run, pending };
}
