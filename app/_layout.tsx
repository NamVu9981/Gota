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
              <Stack.Screen
                name="authentication"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
            </Stack>
          </AuthProvider>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

// You'll need to import these themes or define them
const DarkTheme = {
  dark: true,
  colors: {
    primary: "rgb(10, 132, 255)",
    background: "rgb(1, 1, 1)",
    card: "rgb(18, 18, 18)",
    text: "rgb(229, 229, 231)",
    border: "rgb(39, 39, 41)",
    notification: "rgb(255, 69, 58)",
  },
};

const DefaultTheme = {
  dark: false,
  colors: {
    primary: "rgb(0, 122, 255)",
    background: "rgb(242, 242, 242)",
    card: "rgb(255, 255, 255)",
    text: "rgb(28, 28, 30)",
    border: "rgb(216, 216, 216)",
    notification: "rgb(255, 59, 48)",
  },
};
