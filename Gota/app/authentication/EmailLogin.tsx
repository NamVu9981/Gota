import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "../../api/userData/user";

const EmailPasswordLogin: React.FC = () => {
  const { signin } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  const [userEmail, setUserEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

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

  const handleLogin = async () => {
    if (!userEmail || !password) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setErrorMessage(""); // Clear previous errors
    // @ts-ignore
    const result = await signin(email, password);

    if (result.success) {
      const userProfile = await getUser();
      if (!userProfile.has_completed_onboarding) {
        router.replace("./Onboarding");
      } else {
        router.replace("/(tabs)");
      }
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.appTitle}>GOTA</Text>
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>Log In</Text>

        <View style={styles.inputsContainer}>
          <TextInput
            value={userEmail}
            onChangeText={handleEmailChange}
            placeholder="Your email address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholderTextColor="#888"
            textAlign="center"
          />

          <TextInput
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Your Password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#888"
            textAlign="center"
          />
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Log In Now</Text>
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
  backButton: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginTop: 55,
  },
  appTitle: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
    marginBottom: 80,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "500",
    color: "black",
    marginBottom: 60,
  },
  inputsContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  input: {
    width: "100%",
    height: 58,
    backgroundColor: "white",
    borderRadius: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  errorText: {
    color: "red",
    marginVertical: 10,
    textAlign: "center",
  },
  loginButton: {
    width: "80%",
    height: 58,
    backgroundColor: "#5e7ede",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default EmailPasswordLogin;
