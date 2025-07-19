// app/(tabs)/groups.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus,
  MapPin,
  Users,
  ChevronRight,
  Settings,
  Search,
  Calendar,
  MoreVertical,
} from "lucide-react-native";
import {
  getUserGroups,
  createGroup,
  Group,
  CreateGroupRequest,
} from "../groups/groupsApi";

const GroupsPage = () => {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      const userGroups = await getUserGroups();
      setGroups(userGroups);
    } catch (error: any) {
      console.error("Error loading groups:", error);
      setError(error.message || "Failed to load groups");

      //   if (__DEV__) {
      //     const sampleGroups: Group[] = [
      //       {
      //         id: "1",
      //         name: "Group 1",
      //         description: "My first location sharing group",
      //         member_count: 1,
      //         isOwner: true,
      //         createdAt: new Date().toISOString(),
      //         lastActivity: "Just now",
      //         ownerId: "current-user",
      //       },
      //     ];
      //     setGroups(sampleGroups);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroups(true);
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleCreateGroupSubmit = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    setCreatingGroup(true);

    try {
      const groupData: CreateGroupRequest = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      };

      const newGroup = await createGroup(groupData);

      // Add the new group to the local state
      setGroups((prevGroups) => [newGroup, ...prevGroups]);

      // Close modal and reset form
      setShowCreateGroupModal(false);
      setGroupName("");
      setGroupDescription("");

      // Navigate to add friends page
      setTimeout(() => {
        router.push({
          pathname: "/groupFunc/[id]/add-friends",
          params: {
            id: newGroup.id,
            groupName: newGroup.name,
          },
        });
      }, 500);

      Alert.alert(
        "Success",
        `Group "${newGroup.name}" has been created! Add friends to start sharing locations.`
      );
    } catch (error: any) {
      console.error("Error creating group:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create group. Please try again."
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCancelCreateGroup = () => {
    setShowCreateGroupModal(false);
    setGroupName("");
    setGroupDescription("");
  };

  const handleGroupPress = (group: Group) => {
    router.push({
      pathname: "/groupFunc/[id]",
      params: {
        id: group.id,
        groupName: group.name,
      },
    });
  };

  const handleRetry = () => {
    loadGroups();
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => handleGroupPress(item)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIconContainer}>
          <MapPin size={24} color="#007bff" />
        </View>

        <View style={styles.groupInfo}>
          <View style={styles.groupNameRow}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.is_owner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            )}
          </View>

          <Text style={styles.groupMemberCount}>
            {item.member_count} member{item.member_count !== 1 ? "s" : ""}
          </Text>

          {item.description && (
            <Text style={styles.groupDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {item.last_activity && (
            <Text style={styles.lastActivity}>
              Last activity: {item.last_activity}
            </Text>
          )}
        </View>

        <View style={styles.groupActions}>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="#94a3b8" />
          </TouchableOpacity>
          <ChevronRight size={20} color="#94a3b8" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MapPin size={64} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first group to start sharing locations with friends
      </Text>
      <TouchableOpacity
        style={styles.emptyCreateButton}
        onPress={handleCreateGroup}
      >
        <Plus size={20} color="white" style={styles.emptyCreateIcon} />
        <Text style={styles.emptyCreateText}>Create First Group</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Unable to Load Groups</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSubtitle}>
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateGroup}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading groups...</Text>
          </View>
        ) : error && groups.length === 0 ? (
          renderErrorState()
        ) : (
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#007bff"]}
                tintColor="#007bff"
              />
            }
          />
        )}
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelCreateGroup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Users size={24} color="#007bff" />
              </View>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <Text style={styles.modalSubtitle}>
                Start a location sharing group with your friends
              </Text>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Group Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="Enter group name"
                  maxLength={50}
                  editable={!creatingGroup}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={groupDescription}
                  onChangeText={setGroupDescription}
                  placeholder="What's this group for?"
                  multiline={true}
                  numberOfLines={3}
                  maxLength={200}
                  editable={!creatingGroup}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelCreateGroup}
                disabled={creatingGroup}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createGroupButton,
                  (!groupName.trim() || creatingGroup) &&
                    styles.createGroupButtonDisabled,
                ]}
                onPress={handleCreateGroupSubmit}
                disabled={creatingGroup || !groupName.trim()}
              >
                {creatingGroup ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  groupItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 8,
  },
  ownerBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "500",
  },
  groupMemberCount: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  groupDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 8,
  },
  lastActivity: {
    fontSize: 12,
    color: "#94a3b8",
  },
  groupActions: {
    alignItems: "center",
    marginLeft: 12,
  },
  moreButton: {
    padding: 4,
    marginBottom: 8,
  },
  separator: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#007bff",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCreateIcon: {
    marginRight: 8,
  },
  emptyCreateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  modalForm: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  createGroupButton: {
    backgroundColor: "#007bff",
  },
  createGroupButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GroupsPage;
