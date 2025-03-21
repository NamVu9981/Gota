import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Logo from "@/assets/images/gota-logo.svg";

const { width, height } = Dimensions.get("window");

const OnBoarding = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/Authentication/Login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.logoContainer}>
        {/* SVG Logo */}
        <Logo width={200} height={200} />

        <Text style={styles.logoText}>GOTA</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={handleGetStarted}
          android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrowRight}>→</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a8d5ff",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "bold",
    color: "white",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 30,
  },
  button: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 28,
    fontWeight: "bold",
    marginRight: 10,
  },
  arrowContainer: {
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowRight: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#a8d5ff",
  },
});

export default OnBoarding;
