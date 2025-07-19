import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { sendFriendRequest } from "@/api/friends/friendsApi";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

const UserDetailPage = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Debug: Log the received parameters
  useEffect(() => {
    console.log("Received params:", params);
    console.log("ID:", params.id);
    console.log("Username:", params.username);
    console.log("Email:", params.email);
    console.log("Avatar:", params.avatar);
  }, [params]);

  // Check if required parameters exist
  if (!params.id || !params.username || !params.email) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>User data not found</Text>
            <Text style={styles.errorSubtext}>
              Missing required parameters. Please try again.
            </Text>
            <Text style={styles.debugText}>
              Debug - Received params: {JSON.stringify(params, null, 2)}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Convert the user data from params with proper validation
  const userProfile: UserProfile = {
    id: parseInt(params.id as string),
    username: params.username as string,
    email: params.email as string,
    avatar: (params.avatar as string) || undefined,
  };

  const handleSendFriendRequest = async () => {
    Alert.alert(
      "Send Friend Request",
      `Send a friend request to ${userProfile.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setLoading(true);
            try {
              await sendFriendRequest(userProfile.id);
              setRequestSent(true);
              Alert.alert(
                "Success",
                `Friend request sent to ${userProfile.username}!`,
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error("Error sending friend request:", error);
              Alert.alert(
                "Error",
                "Failed to send friend request. They might already be your friend or you may have already sent a request."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <Image
            source={{
              uri: userProfile.avatar || "https://via.placeholder.com/120x120",
            }}
            style={styles.avatar}
            onError={(error) => {
              console.log("Avatar loading error:", error.nativeEvent.error);
            }}
          />

          {/* User Info */}
          <Text style={styles.username}>{userProfile.username}</Text>
          <Text style={styles.email}>{userProfile.email}</Text>

          {/* Debug info - Remove this in production */}
          <Text style={styles.debugInfo}>ID: {userProfile.id}</Text>

          {/* Add Friend Button */}
          <TouchableOpacity
            style={[
              styles.addFriendButton,
              (loading || requestSent) && styles.addFriendButtonDisabled,
            ]}
            onPress={handleSendFriendRequest}
            disabled={loading || requestSent}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.addFriendButtonText}>
                {requestSent ? "Request Sent" : "Add Friend"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,123,255,0.1)",
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    marginBottom: 20,
  },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  addFriendButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 140,
    alignItems: "center",
  },
  addFriendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addFriendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  debugText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontFamily: "monospace",
  },
  debugInfo: {
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
});

export default UserDetailPage;
