// 📁 components/LoadingScreen.tsx
import React from "react";
import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import { styles } from "../styles/groupDetails.styles";

const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading group details...</Text>
      </View>
    </SafeAreaView>
  );
};

export default LoadingScreen;
