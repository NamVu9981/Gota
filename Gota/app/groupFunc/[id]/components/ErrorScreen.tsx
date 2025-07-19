// 📁 components/ErrorScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { styles } from "../styles/groupDetails.styles";

interface ErrorScreenProps {
  error?: string | null;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error }) => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Group not found"}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ErrorScreen;
