import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import GoogleButton from "@/components/authenticate/GoogleButton";
import FacebookButton from "@/components/authenticate/FaceBookButton";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [showArrow, setShowArrow] = useState<boolean>(false);
  const router = useRouter();

  const handleEmailChange = (text: string) => {
    setEmail(text);

    // Show arrow when email is not empty and has @ symbol (basic validation)
    setShowArrow(text.trim().length > 0 && text.includes("@"));
  };

  const handleContinue = () => {
    router.push({
      pathname: "/authentication/EmailLogin",
      params: { email },
    });
  };

  const handleSignup = () => {
    router.replace("/authentication/Signup");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo at the very top */}
      <Text style={styles.appTitle}>GOTA</Text>

      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Log In</Text>

          <View style={styles.inputContainer}>
            {/* Email input with arrow button */}
            <View style={styles.inputWrapper}>
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.emailInput}
                placeholderTextColor="#888"
                textAlign="center"
              />
              {showArrow && (
                <View style={styles.arrowContainer}>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={handleContinue}
                  >
                    <Ionicons name="arrow-forward" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <GoogleButton />
            <FacebookButton />
          </View>

          <TouchableOpacity
            style={styles.signupContainer}
            onPress={handleSignup}
          >
            <Text style={styles.signupText}>
              Don't have an account yet?{" "}
              <Text style={styles.signupLink}>Sign up here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c5e3ff",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c5e3ff",
  },
  loginCard: {
    width: "100%",
    maxWidth: 420,
    padding: 25,
    borderRadius: 30,
    backgroundColor: "#c5e3ff",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 30,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  emailInput: {
    width: "100%",
    height: 58,
    backgroundColor: "white",
    borderRadius: 15,
    paddingHorizontal: 0,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    textAlign: "center",
    textAlignVertical: "center",
  },
  arrowContainer: {
    position: "absolute",
    right: 10,
    top: 9,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3072be",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    width: "70%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000000",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#000000",
    fontSize: 16,
  },
  socialButtons: {
    width: "100%",
    gap: 15,
    marginBottom: 30,
  },
  signupContainer: {
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
  },
  signupLink: {
    color: "#3072be",
    textDecorationLine: "none",
  },
});

export default Login;
