// 📁 components/GroupInfoCard.tsx
import React from "react";
import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";
import { GroupDetails } from "../types/group.types";
import { styles } from "../styles/groupDetails.styles";

interface GroupInfoCardProps {
  group: GroupDetails;
}

const GroupInfoCard: React.FC<GroupInfoCardProps> = ({ group }) => {
  return (
    <View style={styles.groupInfoCard}>
      <View style={styles.groupIconContainer}>
        <MapPin size={32} color="#007bff" />
      </View>

      <View style={styles.groupInfoContent}>
        <Text style={styles.groupName}>{group.name}</Text>
        {group.description && (
          <Text style={styles.groupDescription}>{group.description}</Text>
        )}
        <Text style={styles.createdAt}>
          Created {new Date(group.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.ownerInfo}>Owner: {group.owner.username}</Text>
      </View>
    </View>
  );
};

export default GroupInfoCard;
