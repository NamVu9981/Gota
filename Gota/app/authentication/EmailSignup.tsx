import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

const SignupDetails: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { signup } = useAuth();

  const [userEmail, setUserEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Set the email from params if available
    if (email) {
      setUserEmail(email as string);
    }
  }, [email]);

  const handleEmailChange = (text: string) => {
    setUserEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
  };

  const handleSignUp = async () => {
    setErrorMessage("");
    if (!userEmail || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    const result = await signup(userEmail, password);

    if (result.success) {
      router.replace("/authentication/Onboarding");
    } else {
      // Show error message on the screen
      setErrorMessage(result.message || "An unknown error occurred.");

      // Only redirect to Login if email already exists, not for username issues
      if (
        result.message.includes("email") &&
        result.message.includes("already exists")
      ) {
        Alert.alert("Email already in use", "Try logging in instead", [
          { text: "OK", onPress: () => router.push("/authentication/Login") },
        ]);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Text style={styles.appTitle}>GOTA</Text>
          <View style={styles.signupContainer}>
            <Text style={styles.signupTitle}>Complete Your Profile</Text>

            <View style={styles.inputsContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={userEmail}
                  onChangeText={handleEmailChange}
                  placeholder="Your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, styles.completedInput]}
                  placeholderTextColor="#888"
                  textAlign="center"
                  editable={false}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Create password"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#888"
                  textAlign="center"
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  placeholder="Confirm password"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#888"
                  textAlign="center"
                />
              </View>
              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUp}
              >
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c5e3ff",
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  signupContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  appTitle: {
    fontSize: 32,
    textAlign: "center",
    fontWeight: "bold",
    color: "white",
    marginTop: 40,
    marginBottom: 50,
  },
  signupTitle: {
    fontSize: 28,
    fontWeight: "500",
    color: "black",
    marginBottom: 40,
  },
  inputsContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 58,
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  completedInput: {
    backgroundColor: "#e8f4ff",
    borderColor: "#3072be",
    color: "#666",
  },
  errorText: {
    color: "red",
    marginVertical: 10,
  },
  signupButton: {
    width: "80%",
    height: 58,
    backgroundColor: "#5e7ede",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default SignupDetails;
