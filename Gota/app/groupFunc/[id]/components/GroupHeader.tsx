import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, MoreVertical } from "lucide-react-native";
import { GroupDetails } from "../types/group.types";
import { styles } from "../styles/groupDetails.styles";

interface GroupHeaderProps {
  group: GroupDetails;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ group }) => {
  const router = useRouter();

  const handleSettings = () => {
    // Handle settings
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerBackButton}
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#1e293b" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <Text style={styles.headerSubtitle}>
          {group.member_count} member{group.member_count !== 1 ? "s" : ""}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.headerMoreButton}
        onPress={handleSettings}
      >
        <MoreVertical size={24} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
};

export default GroupHeader;
