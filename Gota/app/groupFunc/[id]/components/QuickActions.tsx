import React from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { UserPlus, Share2, Settings } from "lucide-react-native";
import { GroupDetails } from "../types/group.types";
import { styles } from "../styles/groupDetails.styles";

interface QuickActionsProps {
  group: GroupDetails;
}

const QuickActions: React.FC<QuickActionsProps> = ({ group }) => {
  const router = useRouter();

  const handleAddFriends = () => {
    router.push({
      pathname: "/groupFunc/[id]/add-friends" as any,
      params: { id: group.id, groupName: group.name },
    });
  };

  const handleShare = () => {
    Alert.alert("Share Group", `Share: ${group.name}\nID: ${group.id}`);
  };

  const handleSettings = () => {
    Alert.alert("Coming Soon", "Group settings will be available soon!");
  };

  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.addFriendsButton}
        onPress={handleAddFriends}
      >
        <UserPlus size={20} color="white" />
        <Text style={styles.addFriendsText}>Add Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Share2 size={20} color="#007bff" />
        <Text style={styles.shareText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
        <Settings size={20} color="#64748b" />
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuickActions;
