// app/friends/_layout.tsx
import { Stack, Tabs } from "expo-router";

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen options={{ headerShown: false }} name="requests" />
    </Stack>
  );
}
