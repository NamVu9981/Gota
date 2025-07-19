import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Crown, Eye, EyeOff, UserMinus } from "lucide-react-native";
import { GroupMember } from "../types/group.types";
import { styles } from "../styles/groupDetails.styles";

interface MemberItemProps {
  member: GroupMember;
  isOwner: boolean;
  onRemove: (memberId: string, memberName: string) => void;
}

const MemberItem: React.FC<MemberItemProps> = ({
  member,
  isOwner,
  onRemove,
}) => {
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.user.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName}>{member.user.username}</Text>
          {member.is_owner && (
            <View style={styles.ownerBadge}>
              <Crown size={12} color="#f59e0b" />
              <Text style={styles.ownerText}>Owner</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail}>{member.user.email}</Text>
        <Text style={styles.joinedAt}>
          Joined {new Date(member.joined_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.memberActions}>
        <View style={styles.memberStatus}>
          {member.is_location_visible ? (
            <View style={styles.locationVisible}>
              <Eye size={16} color="#10b981" />
            </View>
          ) : (
            <View style={styles.locationHidden}>
              <EyeOff size={16} color="#94a3b8" />
            </View>
          )}
        </View>

        {isOwner && !member.is_owner && (
          <TouchableOpacity
            style={styles.removeMemberButton}
            onPress={() => onRemove(member.user.id, member.user.username)}
          >
            <UserMinus size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default MemberItem;
