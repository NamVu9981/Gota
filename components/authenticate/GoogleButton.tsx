import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import GoogleLogo from "../../assets/images/google_13170545 1.svg";

const GoogleButton: React.FC = () => {
  const handleGoogleLogin = () => {
    // Implement Google authentication logic here
    console.log("Google login initiated");
  };

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={handleGoogleLogin}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <View style={styles.iconContainer}>
          <GoogleLogo width={34} height={34} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>Google</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    width: "100%",
    height: 55,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: "center",
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    position: "absolute",
    left: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#616161",
    fontWeight: "500",
  },
});

export default GoogleButton;
