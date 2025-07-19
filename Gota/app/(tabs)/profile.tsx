import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
// import { LinearGradient } from 'expo-linear-gradient';
import {
  Edit3,
  Mail,
  Lock,
  LogOut,
  User,
  Camera,
  Settings,
  Shield,
} from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "@/api/userData/user";
import { useRouter } from "expo-router";
import { WS_URL } from "@/config/webSocketConfig";

// Define types
interface ProfileProps {}

interface User {
  has_completed_onboarding: boolean;
  location: null;
  user_id: string;
  username: string;
  email: string;
  avatar?: string;
}

const ProfilePage: React.FC<ProfileProps> = () => {
  const { signout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const router = useRouter();

  const websocket = useRef<WebSocket | null>(null);

  const handleSignout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signout();
        },
      },
    ]);
  };

  // Cross-platform username editing
  const handleEditUsername = () => {
    if (!user) return;

    if (Platform.OS === "ios") {
      // Use Alert.prompt for iOS
      Alert.prompt(
        "Edit Username",
        "Enter your new username:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update",
            onPress: (inputUsername) => {
              if (inputUsername && inputUsername.trim()) {
                updateUsername(inputUsername.trim());
              }
            },
          },
        ],
        "plain-text",
        user.username
      );
    } else {
      // Use custom modal for Android
      setNewUsername(user.username);
      setShowUsernameModal(true);
    }
  };

  const handleUsernameUpdate = () => {
    if (newUsername && newUsername.trim()) {
      updateUsername(newUsername.trim());
      setShowUsernameModal(false);
    }
  };

  const handleCancelUsernameEdit = () => {
    setNewUsername("");
    setShowUsernameModal(false);
  };

  // Function to send username update via WebSocket
  const updateUsername = (newUsername: string) => {
    if (!websocket.current || websocket.current.readyState !== WebSocket.OPEN) {
      Alert.alert("Error", "Not connected to server. Please try again.");
      return;
    }

    try {
      websocket.current.send(
        JSON.stringify({
          action: "update_username",
          username: newUsername,
        })
      );
      console.log("📤 Sent username update:", newUsername);
    } catch (error) {
      console.error("❌ Failed to send username update:", error);
      Alert.alert("Error", "Failed to update username. Please try again.");
    }
  };

  useEffect(() => {
    fetchUserData();

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      connectWebSocket(user.user_id);
    }
  }, [user?.user_id]);

  // Updated connectWebSocket function for username updates
  const connectWebSocket = (userId: string) => {
    // Close any existing connection
    if (websocket.current) {
      websocket.current.close();
    }

    // Updated WebSocket URL for username updates
    const socketUrl = `${WS_URL}/ws/user/${userId}/`;
    console.log("ProfilePage: Connecting to WebSocket:", socketUrl);

    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("ProfilePage: WebSocket connected successfully");
    };

    socket.onmessage = (event) => {
      try {
        console.log("ProfilePage: Raw WebSocket message received:", event.data);
        const data = JSON.parse(event.data);
        console.log("ProfilePage: Parsed WebSocket message:", data);

        // Handle real-time username updates
        if (data.type === "username_updated" && data.success) {
          console.log("✅ Username updated to:", data.username);

          setUser((prevUser) => {
            if (!prevUser) return prevUser;
            return {
              ...prevUser,
              username: data.username,
            };
          });

          // Show success message
          Alert.alert("Success", "Username updated successfully!");
        } else if (data.type === "error") {
          console.error("❌ WebSocket error:", data.message);
          Alert.alert("Error", data.message);
        }

        // Keep your existing message handling for other updates
        if (
          data.update_type === "user_details" ||
          data.update_type === "initial_data"
        ) {
          console.log("Processing profile update with data:", data);

          setUser((prevUser) => {
            if (!prevUser) {
              // If no previous user data, create a new object with all received data
              return {
                user_id: data.user_id || "",
                username: data.username || "",
                email: data.email || "",
                avatar: data.avatar_url || null,
                location: data.location || null,
                has_completed_onboarding:
                  data.has_completed_onboarding || false,
              };
            }

            // Otherwise update existing user data
            return {
              ...prevUser,
              username: data.username || prevUser.username,
              email: data.email || prevUser.email,
              avatar: data.avatar_url || prevUser.avatar,
              location:
                data.location !== undefined ? data.location : prevUser.location,
              has_completed_onboarding:
                data.has_completed_onboarding !== undefined
                  ? data.has_completed_onboarding
                  : prevUser.has_completed_onboarding,
            };
          });

          console.log("User state updated from WebSocket data");
        }
      } catch (error) {
        console.error("ProfilePage: Error handling WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("ProfilePage: WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log(
        "ProfilePage: WebSocket connection closed:",
        event.code,
        event.reason
      );

      // ONLY reconnect if it's an abnormal closure (not code 1000)
      if (event.code !== 1000) {
        setTimeout(() => {
          if (user?.user_id) {
            console.log(
              "Attempting to reconnect WebSocket due to abnormal closure..."
            );
            connectWebSocket(user.user_id);
          }
        }, 3000);
      }
    };

    websocket.current = socket;
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
      console.log("Fetched user data:", userData);
      setUser(userData);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Could not load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Background */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Profile Image Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: user?.avatar || "https://via.placeholder.com/120x120",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <Camera size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.username}>{user?.username || "User"}</Text>
                <TouchableOpacity
                  style={styles.editUsernameButton}
                  onPress={handleEditUsername}
                >
                  <Edit3 size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Account Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#e3f2fd" }]}
                >
                  <User size={20} color="#007bff" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Username</Text>
                  <Text style={styles.settingValue}>{user?.username}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleEditUsername}>
                <Edit3 size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}
                >
                  <Mail size={20} color="#8b5cf6" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Email</Text>
                  <Text style={styles.settingValue}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Edit3 size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}
                >
                  <Lock size={20} color="#f59e0b" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Password</Text>
                  <Text style={styles.settingValue}>••••••••</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Edit3 size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security & Privacy</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#ecfdf5" }]}
                >
                  <Shield size={20} color="#10b981" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Privacy Settings</Text>
                  <Text style={styles.settingSubtext}>
                    Manage your privacy preferences
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignout}
          >
            <LogOut size={20} color="white" style={styles.signOutIcon} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Gota v1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Username Edit Modal for Android */}
      <Modal
        visible={showUsernameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelUsernameEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <Text style={styles.modalSubtitle}>Enter your new username:</Text>

            <TextInput
              style={styles.modalInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Username"
              autoFocus={true}
              selectTextOnFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelUsernameEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.updateButton]}
                onPress={handleUsernameUpdate}
              >
                <Text style={styles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#007bff",
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "white",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007bff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginRight: 8,
  },
  editUsernameButton: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: "#64748b",
  },
  settingSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  // Modal styles for Android username editing
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1e293b",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#64748b",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 25,
    backgroundColor: "#f8fafc",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  updateButton: {
    backgroundColor: "#007bff",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
