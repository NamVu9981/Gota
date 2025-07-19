import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateUser } from "@/api/userData/user";

const UsernameChangePage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Handle potential array or string params
  const currentUsername = Array.isArray(params.currentUsername)
    ? params.currentUsername[0]
    : (params.currentUsername as string) || "";

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : (params.userId as string) || "";

  // State for tracking form values and status
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if we've mounted to prevent auto-submit issues
  const isMounted = useRef(true);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection
  const websocket = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsMessageReceivedRef = useRef(false);

  // Monitor changes to username input
  useEffect(() => {
    setHasChanges(newUsername.trim() !== currentUsername);
  }, [newUsername, currentUsername]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;

      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (userId) {
      connectWebSocket();
    }
  }, [userId]);

  // Add a specific effect for handling success state navigation
  useEffect(() => {
    if (success) {
      console.log("Success state set to true - scheduling navigation back");

      // Set a backup timer for navigation
      navigationTimerRef.current = setTimeout(() => {
        console.log("Navigation timeout triggered - going back");
        if (isMounted.current) {
          router.back();
        }
      }, 2000);
    }

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, [success, router]);

  const connectWebSocket = () => {
    // Close any existing connection
    if (websocket.current) {
      websocket.current.close();
    }

    const socketUrl = `ws://127.0.0.1:8000/ws/socket/profile/${userId}/`;
    console.log("UsernameChange: Connecting to WebSocket:", socketUrl);

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("UsernameChange: WebSocket connected successfully");
    };

    socket.onmessage = (event) => {
      try {
        console.log(
          "UsernameChange: Raw WebSocket message received:",
          event.data
        );
        const data = JSON.parse(event.data);
        console.log("UsernameChange: Parsed WebSocket message:", data);

        // If we receive confirmation that username was updated
        if (data.update_type === "user_details" && data.username) {
          console.log("Username update confirmed by WebSocket");
          wsMessageReceivedRef.current = true;

          // If we're already in success state, navigate back
          if (success && isMounted.current) {
            // Clear any pending navigation timers
            if (navigationTimerRef.current) {
              clearTimeout(navigationTimerRef.current);
            }

            console.log(
              "WebSocket received and success state true - navigating back"
            );
            router.back();
          }
        }
      } catch (error) {
        console.error(
          "UsernameChange: Error parsing WebSocket message:",
          error
        );
      }
    };

    socket.onerror = (error) => {
      console.error("UsernameChange: WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log(
        "UsernameChange: WebSocket connection closed:",
        event.code,
        event.reason
      );

      // Only reconnect for abnormal closures if still mounted
      if (event.code !== 1000 && isMounted.current) {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        reconnectTimerRef.current = setTimeout(() => {
          if (isMounted.current && userId) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    websocket.current = socket;
  };

  const handleUpdateUsername = async () => {
    // Validate input
    if (!newUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (newUsername.trim() === currentUsername) {
      // No changes made, just go back
      router.back();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log(
        "Updating username from",
        currentUsername,
        "to",
        newUsername.trim()
      );

      // Create FormData for the update
      const formData = new FormData();
      formData.append("username", newUsername.trim());

      // Use updateUser function
      const response = await updateUser(formData);
      console.log("Username update API response:", response);

      // Mark as successful
      setSuccess(true);

      // If we already got a WebSocket message, navigate back immediately
      if (wsMessageReceivedRef.current && isMounted.current) {
        console.log("Already received WS message, navigating back immediately");
        router.back();
      }
      // Otherwise wait for timer or WebSocket message
    } catch (error: any) {
      console.error("Error updating username:", error);
      setError(error.message || "Failed to update username. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Add a direct navigation function for manual use
  const handleManualBack = () => {
    console.log("Manual back button pressed");
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleManualBack}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Username</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.infoText}>
            Choose a new username. This will be visible to other users.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Username</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={currentUsername}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Username</Text>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting && !success}
              autoFocus={true}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Username updated successfully!
              </Text>

              {/* Add an explicit button to go back for full control */}
              <TouchableOpacity
                style={styles.manualBackButton}
                onPress={handleManualBack}
              >
                <Text style={styles.manualBackButtonText}>
                  Return to Profile
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleManualBack}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (!hasChanges || isSubmitting || success) &&
                  styles.disabledButton,
              ]}
              onPress={handleUpdateUsername}
              disabled={!hasChanges || isSubmitting || success}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#d8b4fe",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 50, // Balances the back button width
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#f9f9f9",
    color: "#999",
  },
  errorText: {
    fontSize: 14,
    color: "#f87171",
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#d8b4fe",
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#d8b4fe80", // 50% transparency
  },
  successContainer: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  successText: {
    fontSize: 16,
    color: "#15803d",
    fontWeight: "500",
  },
  manualBackButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#d8b4fe",
    borderRadius: 8,
  },
  manualBackButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default UsernameChangePage;
