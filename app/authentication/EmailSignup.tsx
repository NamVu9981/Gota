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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SignupDetails: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [userEmail, setUserEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  useEffect(() => {
    // Set the email from params if available
    if (email) {
      setUserEmail(email as string);
      console.log("Received email:", email);
    } else {
      console.log("No email received in params");
    }
  }, [email]);

  const handleEmailChange = (text: string) => {
    setUserEmail(text);
  };

  const handleNameChange = (text: string) => {
    setFullName(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
  };

  const handleSignUp = () => {
    // Implement your signup logic here
    console.log(`Creating account for ${fullName} with email: ${userEmail}`);
    // router.push("/home");
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
                  value={fullName}
                  onChangeText={handleNameChange}
                  placeholder="Your full name"
                  autoCapitalize="words"
                  style={styles.input}
                  placeholderTextColor="#888"
                  textAlign="center"
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
