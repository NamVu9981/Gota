import AnimationScreen from "@/components/Splash/animate";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, { FadeIn } from "react-native-reanimated";
import { AuthProvider } from "@/context/AuthContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [showLottie, setShowLottie] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Handle splash screen
  useEffect(() => {
    async function hideSplashAndShowAnimation() {
      if (loaded) {
        // Add a delay to show the splash screen longer
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Hide the native splash screen
        await SplashScreen.hideAsync();

        // Mark splash as complete to show animation
        setSplashComplete(true);
      }
    }

    hideSplashAndShowAnimation();
  }, [loaded]);

  // Handle animation completion
  const handleAnimationFinish = useCallback(() => {
    // Only show stack after animation is done
    setShowLottie(false);
    setAppReady(true);
  }, []);

  if (!loaded || !splashComplete) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!appReady && showLottie ? (
        <AnimationScreen onAnimationFinish={handleAnimationFinish} />
      ) : (
        <Animated.View style={{ flex: 1 }} entering={FadeIn}>
          <AuthProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="friends" options={{ headerShown: false }} />
              <Stack.Screen name="user" options={{ headerShown: false }} />
              <Stack.Screen
                name="authentication"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
              <Stack.Screen
                name="groupFunc/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="groups" options={{ headerShown: false }} />
            </Stack>
          </AuthProvider>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}
