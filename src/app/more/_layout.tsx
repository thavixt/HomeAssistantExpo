import { Stack } from 'expo-router';

/* the app's own header sits on top of every tab, so the stack doesn't get one */
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
