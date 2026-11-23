import { Alert, Platform } from 'react-native';

/** asks before doing something disruptive. resolves to whether the user agreed */
export function confirm(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Alert.alert is a no-op on react-native-web
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      // android: tapping outside the dialog dismisses it
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
