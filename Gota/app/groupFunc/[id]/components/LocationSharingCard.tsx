// 📁 components/LocationSharingCard.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { updateLocationSharing } from "@/app/groups/groupsApi";
import { styles } from "../styles/groupDetails.styles";

interface LocationSharingCardProps {
  groupId: string;
  initialLocationSharing?: boolean;
  onLocationUpdate?: (isVisible: boolean) => void;
}

const LocationSharingCard: React.FC<LocationSharingCardProps> = ({
  groupId,
  initialLocationSharing = true,
  onLocationUpdate,
}) => {
  const [locationSharing, setLocationSharing] = useState(
    initialLocationSharing
  );

  const toggleLocationSharing = async () => {
    Alert.alert(
      locationSharing
        ? "Turn Off Location Sharing"
        : "Turn On Location Sharing",
      locationSharing
        ? "Other members won't be able to see your location"
        : "Other members will be able to see your location",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: locationSharing ? "Turn Off" : "Turn On",
          onPress: async () => {
            try {
              await updateLocationSharing(groupId, !locationSharing);
              setLocationSharing(!locationSharing);
              onLocationUpdate?.(!locationSharing);
            } catch (error) {
              console.error("Error updating location sharing:", error);
              Alert.alert(
                "Error",
                "Failed to update location sharing preference."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.locationSharingCard}>
      <View style={styles.locationSharingHeader}>
        <View style={styles.locationSharingInfo}>
          <Text style={styles.locationSharingTitle}>My Location Sharing</Text>
          <Text style={styles.locationSharingSubtitle}>
            {locationSharing
              ? "Others can see your location"
              : "Your location is hidden"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.locationToggle,
            locationSharing && styles.locationToggleActive,
          ]}
          onPress={toggleLocationSharing}
        >
          <View
            style={[
              styles.locationToggleThumb,
              locationSharing && styles.locationToggleThumbActive,
            ]}
          >
            {locationSharing ? (
              <Eye size={16} color="white" />
            ) : (
              <EyeOff size={16} color="#94a3b8" />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LocationSharingCard;
