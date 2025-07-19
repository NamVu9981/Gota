import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Users, UserPlus } from "lucide-react-native";
import { GroupDetails } from "../types/group.types";
import MemberItem from "./MemberItem";
import { removeMemberFromGroup } from "@/app/groups/groupsApi";
import { styles } from "../styles/groupDetails.styles";

interface MembersSectionProps {
  group: GroupDetails;
  onRefresh: () => Promise<void>;
}

const MembersSection: React.FC<MembersSectionProps> = ({
  group,
  onRefresh,
}) => {
  const router = useRouter();

  const handleAddFriends = () => {
    router.replace({
      pathname: "/groupFunc/[id]/add-friends" as any,
      params: {
        id: group.id,
        groupName: group.name,
      },
    });
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert("Remove Member", `Remove ${memberName} from the group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMemberFromGroup(group.id, memberId);
            await onRefresh();
            Alert.alert("Success", `${memberName} has been removed.`);
          } catch (error) {
            Alert.alert("Error", "Failed to remove member.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.membersSection}>
      <View style={styles.membersSectionHeader}>
        <View style={styles.membersSectionTitle}>
          <Users size={20} color="#1e293b" />
          <Text style={styles.membersSectionText}>
            Members ({group.members?.length || 0})
          </Text>
        </View>

        {group.is_owner && (
          <TouchableOpacity
            style={styles.addMemberButton}
            onPress={handleAddFriends}
          >
            <UserPlus size={16} color="#007bff" />
          </TouchableOpacity>
        )}
      </View>

      {group.members && group.members.length > 0 ? (
        <FlatList
          data={group.members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberItem
              member={item}
              isOwner={group.is_owner}
              onRemove={handleRemoveMember}
            />
          )}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.memberSeparator} />}
        />
      ) : (
        <View style={styles.emptyMembers}>
          <Users size={48} color="#94a3b8" />
          <Text style={styles.emptyMembersText}>No members yet</Text>
        </View>
      )}
    </View>
  );
};

export default MembersSection;
