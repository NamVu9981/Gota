import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// Import your existing API function
import { updateUser } from "../../api/userData/user";

// Memoized Individual Avatar Item component
interface AvatarItemProps {
  avatar: { id: number; source: any };
  isSelected: boolean;
  onSelect: (id: number) => void;
}

const AvatarItem = memo(({ avatar, isSelected, onSelect }: AvatarItemProps) => {
  return (
    <View key={avatar.id} style={styles.avatarWrapper}>
      <TouchableOpacity
        onPress={() => onSelect(avatar.id)}
        style={[
          styles.avatarContainer,
          { width: 80, height: 80 },
          isSelected && styles.selectedAvatar,
        ]}
      >
        <Image source={avatar.source} style={styles.avatarImage} />
      </TouchableOpacity>
      <Text style={styles.avatarLabel}>Avatar {avatar.id}</Text>
    </View>
  );
});

// Main Avatar component - memoized to prevent unnecessary re-renders
interface AvatarProps {
  size?: number;
  selected?: boolean;
  imageSource?: any;
}

const Avatar = memo(
  ({ size = 80, selected = false, imageSource }: AvatarProps) => (
    <View
      style={[
        styles.avatarContainer,
        { width: size, height: size },
        selected && styles.selectedAvatar,
      ]}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarBackground}>
          <View style={styles.avatarFace}>
            <View style={styles.avatarGlasses} />
            <View style={styles.avatarMouth} />
          </View>
          <View style={styles.avatarHat} />
        </View>
      )}
    </View>
  )
);

const AvatarSelectionScreen = () => {
  // Create a mapping of avatar images with static requires
  const avatarImages: Record<number, any> = {
    1: require("@/assets/Avatar/Avatar1.png"),
    2: require("@/assets/Avatar/Avatar3.png"),
    3: require("@/assets/Avatar/Avatar4.png"),
    4: require("@/assets/Avatar/Avatar6.png"),
    5: require("@/assets/Avatar/Avatar7.png"),
    6: require("@/assets/Avatar/Avatar8.png"),
    7: require("@/assets/Avatar/Avatar9.png"),
  };

  // Create an array of avatar objects - memoize this if list gets larger
  const avatars = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    source: avatarImages[i + 1],
  }));

  // State for user input and UI status
  const [selectedAvatarId, setSelectedAvatarId] = useState(1);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [userCapturedImage, setUserCapturedImage] = useState("");

  // Memoized select handler to prevent recreation on each render
  const handleSelectAvatar = useCallback((id: number) => {
    setSelectedAvatarId(id);
  }, []);

  // Get the selected avatar source
  const selectedAvatarSource = avatarImages[selectedAvatarId];

  // Form validation
  const isFormValid = username.trim().length >= 3; // Require at least 3 characters

  const handleCompleteSetup = async () => {
    if (!isFormValid) {
      setErrorMessage("Username must be at least 3 characters long");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      formData.append("username", username);

      let imageToUpload;

      if (userCapturedImage) {
        // If there's a user-captured image, use that
        // imageToUpload = {
        //   uri: userCapturedImage.uri,
        //   type: userCapturedImage.type || "image/jpeg",
        //   name: "user_avatar.jpg",
        // };
      } else {
        // Otherwise use the selected predefined avatar
        const imageUri = Image.resolveAssetSource(
          avatarImages[selectedAvatarId]
        ).uri;
        imageToUpload = {
          uri: imageUri,
          type: "image/png",
          name: `avatar_${selectedAvatarId}.png`,
        };
      }

      // Append the image to the form data
      if (imageToUpload) {
        formData.append("avatar", {
          uri: imageToUpload.uri,
          type: imageToUpload.type,
          name: imageToUpload.name,
        } as any);
      }
      const response = await updateUser(formData);

      // Navigate to the main app after successful setup
      router.replace("/(tabs)");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header with selected avatar and name input */}
          <View style={styles.header}>
            <Avatar
              size={100}
              selected={true}
              imageSource={selectedAvatarSource}
            />

            {/* Username input field */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="@Username" // Shorter placeholder
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            {/* Show error message if any */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          {/* Title */}
          <Text style={styles.titleText}>Choose your avatar</Text>

          {/* Avatar grid */}
          <View style={styles.avatarGrid}>
            {avatars.map((avatar) => (
              <AvatarItem
                key={avatar.id}
                avatar={avatar}
                isSelected={selectedAvatarId === avatar.id}
                onSelect={handleSelectAvatar}
              />
            ))}
          </View>

          {/* Complete Setup Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              !isFormValid && styles.disabledButton,
            ]}
            onPress={handleCompleteSetup}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");
const avatarPerRow = 3;
const gap = 15;
const avatarWidth = (width - 60 - gap * (avatarPerRow - 1)) / avatarPerRow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  inputContainer: {
    marginTop: 15,
    width: "80%", // Reduced from 100%
  },
  input: {
    height: 40, // Reduced from 50
    borderWidth: 1,
    borderColor: "#ddd", // Lighter border color
    borderRadius: 20, // More rounded corners
    paddingHorizontal: 15,
    fontSize: 14, // Smaller font
    backgroundColor: "#f9f9f9",
    textAlign: "center", // Center the text
    shadowColor: "#000", // Add subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1, // For Android shadow
  },
  errorText: {
    color: "#e53e3e",
    marginTop: 8,
    fontSize: 14,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 30,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap,
    width: "100%",
    marginBottom: 30,
  },
  avatarWrapper: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatarLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
  },
  avatarContainer: {
    borderRadius: 100,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  selectedAvatar: {
    borderWidth: 3,
    borderColor: "#6366f1",
  },
  completeButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: "#a0aec0",
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  avatarBackground: {
    width: "100%",
    height: "100%",
    backgroundColor: "#a5b4fc",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarFace: {
    width: "70%",
    height: "70%",
    borderRadius: 100,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  avatarHat: {
    position: "absolute",
    width: "60%",
    height: "30%",
    backgroundColor: "#a3e635",
    borderRadius: 100,
    top: "15%",
    zIndex: 3,
  },
  avatarGlasses: {
    width: "80%",
    height: "20%",
    backgroundColor: "#f97316",
    borderRadius: 10,
    position: "absolute",
    top: "40%",
  },
  avatarMouth: {
    width: "40%",
    height: "10%",
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    position: "absolute",
    top: "70%",
  },
});

export default AvatarSelectionScreen;
