import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import FacebookLogo from "../../assets/images/communication_15047435 1.svg";

const FacebookButton: React.FC = () => {
  const handleFacebookLogin = () => {
    // Implement Facebook authentication logic here
    console.log("Facebook login initiated");
  };

  return (
    <TouchableOpacity
      style={styles.facebookButton}
      onPress={handleFacebookLogin}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <View style={styles.iconContainer}>
          <FacebookLogo width={24} height={24} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>Facebook</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  facebookButton: {
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
    left: 16,
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

export default FacebookButton;
