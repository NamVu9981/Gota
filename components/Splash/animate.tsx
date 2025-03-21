import { useRef, useEffect } from "react";
import { Button, StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";
import { Dimensions } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function AnimationScreen({
  onAnimationFinish,
}: {
  onAnimationFinish: () => void;
}) {
  const animation = useRef<LottieView>(null);

  return (
    <Animated.View
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <LottieView
        autoPlay
        onAnimationFinish={onAnimationFinish}
        loop={false}
        ref={animation}
        style={{
          width: width,
          height: height,
          backgroundColor: "B8DDFF",
        }}
        // Find more Lottie files at https://lottiefiles.com/featured
        source={require("../../assets/animated/splashScreen.json")}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingTop: 20,
  },
});
