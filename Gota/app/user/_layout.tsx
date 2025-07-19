import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen options={{ headerShown: false }} name="[id]" />
    </Stack>
  );
}
