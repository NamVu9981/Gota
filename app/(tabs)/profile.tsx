import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import PenEdit from "@/assets/images/pen-edit.svg";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "../api/userData/user";

// Define types
interface ProfileProps {}

interface User {
  username: string;
  email: string;
  profile_image?: string;
}

const ProfilePage: React.FC<ProfileProps> = () => {
  const { signout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignout = async () => {
    await signout();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await getUser();
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d8b4fe" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
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
      <View style={styles.profileCard}>
        {/* Background Banner Image */}
        <ImageBackground
          source={require("@/assets/images/lifestyle-summer.png")}
          style={styles.backgroundImage}
        >
          {/* Profile Circle with Character */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageBorder}>
              <Image
                source={{
                  uri:
                    user?.profile_image ||
                    "https://via.placeholder.com/150x150",
                }}
                style={styles.profileImage}
              />
            </View>
          </View>
        </ImageBackground>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Name */}
          <Text style={styles.profileName}>{user?.username || "User"}</Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={user?.email || ""}
                  editable={false}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.editButton}>
                  <PenEdit width={17} height={17} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value="**************"
                  secureTextEntry={true}
                  editable={false}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.editButton}>
                  <PenEdit width={17} height={17} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignout}
              >
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#f87171",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#d8b4fe",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileCard: {
    width: width > 500 ? 500 : width * 0.95,
    height: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backgroundImage: {
    width: "100%",
    height: 220,
    position: "relative",
  },
  profileImageContainer: {
    position: "absolute",
    bottom: -50,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImageBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#d8b4fe",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  profileImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "white",
  },
  profileContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    gap: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 30,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#757575",
    paddingVertical: 12,
  },
  editButton: {
    padding: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
  signOutButton: {
    backgroundColor: "#f87171",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
});

export default ProfilePage;
