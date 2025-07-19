import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, UserPlus, Check, Users, Search } from "lucide-react-native";
import SearchBar from "@/app/components/SearchBar";
import { User, searchUsers, getFriendsList } from "@/api/friends/friendsApi";
import { addMembersToGroup, getGroupDetails } from "@/app/groups/groupsApi";

interface Friend extends User {
  isSelected: boolean;
  isInGroup: boolean;
}

const AddFriendsToGroup = () => {
  const { id, groupName } = useLocalSearchParams();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingFriends, setAddingFriends] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await getFriendsList();

      let transformedFriends: Friend[] = friendsData.map((friend: User) => ({
        ...friend,
        isSelected: false,
        isInGroup: false,
      }));

      try {
        const groupDetails = await getGroupDetails(
          Array.isArray(id) ? id[0] : id
        );
        const existingMemberIds =
          groupDetails.members?.map((member) => member.user.id.toString()) ||
          [];

        transformedFriends = transformedFriends.map((friend) => ({
          ...friend,
          isInGroup: existingMemberIds.includes(friend.id.toString()),
        }));

        console.log("📊 Found existing members:", existingMemberIds);
      } catch (error) {
        console.log("⚠️ Could not check existing members:", error);
      }

      setFriends(transformedFriends);
    } catch (error) {
      console.error("Error loading friends:", error);
      Alert.alert("Error", "Failed to load friends list.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const users = await searchUsers(query);

      let transformedResults: Friend[] = users.map((user: User) => ({
        ...user,
        isSelected: selectedFriends.includes(user.id.toString()),
        isInGroup: false,
      }));

      // Check existing members
      try {
        const groupDetails = await getGroupDetails(
          Array.isArray(id) ? id[0] : id
        );
        const existingMemberIds =
          groupDetails.members?.map((member) => member.user.id.toString()) ||
          [];

        transformedResults = transformedResults.map((user) => ({
          ...user,
          isInGroup: existingMemberIds.includes(user.id.toString()),
        }));
      } catch (error) {
        console.log("⚠️ Could not check existing members for search results");
      }

      setSearchResults(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search users.");
    } finally {
      setSearching(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });

    // Update the friend's selection state in both lists
    const updateSelectionState = (friendsList: Friend[]) =>
      friendsList.map((friend) =>
        friend.id.toString() === friendId
          ? { ...friend, isSelected: !friend.isSelected }
          : friend
      );

    setFriends(updateSelectionState);
    setSearchResults(updateSelectionState);
  };

  // 🔧 UPDATED: Enhanced addMembersToGroup with warning detection
  const enhancedAddMembersToGroup = async (
    groupId: string,
    memberIds: number[]
  ) => {
    try {
      const result = await addMembersToGroup(groupId, memberIds);
      return {
        success: true,
        message: result.message,
        added_members: result.added_members,
        isWarning: false,
      };
    } catch (error: any) {
      const errorMessage = error.message || "";

      if (
        errorMessage.includes("already members") ||
        errorMessage.includes("already active members") ||
        errorMessage.includes("are already members")
      ) {
        return {
          success: true,
          message: errorMessage,
          added_members: [],
          isWarning: true,
        };
      }

      throw error;
    }
  };

  const handleAddFriends = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert(
        "No Selection",
        "Please select at least one friend to add to the group."
      );
      return;
    }

    setAddingFriends(true);

    try {
      console.log("Adding friends to group:", {
        groupId: id,
        friendIds: selectedFriends,
      });

      // 🔧 FIX: Use enhanced function with warning detection
      const result = await enhancedAddMembersToGroup(
        Array.isArray(id) ? id[0] : id,
        selectedFriends.map((id) => Number(id))
      );

      console.log("✅ API Result:", result);

      if (result.isWarning) {
        Alert.alert(
          "Already in Group",
          "The selected friends are already members of this group!",
          [
            {
              text: "Got it",
              onPress: () => {
                router.replace({
                  pathname: "/groupFunc/[id]" as any,
                  params: {
                    id: Array.isArray(id) ? id[0] : id,
                    groupName: groupName,
                  },
                });
              },
            },
          ]
        );
      } else {
        // Show success message
        Alert.alert(
          "Success",
          `Added ${selectedFriends.length} friend${
            selectedFriends.length !== 1 ? "s" : ""
          } to ${groupName}!`,
          [
            {
              text: "OK",
              onPress: () => {
                router.replace({
                  pathname: "/groupFunc/[id]" as any,
                  params: {
                    id: Array.isArray(id) ? id[0] : id,
                    groupName: groupName,
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("❌ Error adding friends:", error);

      // Handle real errors (not warnings)
      let errorMessage = "Failed to add friends to group.";

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "One or more users could not be found.";
        } else if (error.message.includes("permission")) {
          errorMessage =
            "You don't have permission to add members to this group.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setAddingFriends(false);
    }
  };

  const handleSkip = () => {
    // 🔧 FIX: Use template string navigation
    router.replace({
      pathname: "/groupFunc/[id]" as any,
      params: {
        id: Array.isArray(id) ? id[0] : id,
        groupName: groupName,
      },
    });
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[
        styles.friendItem,
        item.isSelected && styles.selectedFriendItem,
        item.isInGroup && styles.inGroupFriendItem,
      ]}
      onPress={() =>
        !item.isInGroup && toggleFriendSelection(item.id.toString())
      }
      disabled={item.isInGroup}
    >
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.username}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.friendAction}>
        {item.isInGroup ? (
          <View style={styles.inGroupBadge}>
            <Text style={styles.inGroupText}>In Group</Text>
          </View>
        ) : item.isSelected ? (
          <View style={styles.selectedIcon}>
            <Check size={20} color="white" />
          </View>
        ) : (
          <View style={styles.selectIcon}>
            <UserPlus size={20} color="#64748b" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const dataToShow = hasSearched ? searchResults : friends;

  // 🔧 FIX: Filter out friends who are already in the group from selection count
  const availableFriends = dataToShow.filter((friend) => !friend.isInGroup);
  const selectedAvailableFriends = selectedFriends.filter((friendId) => {
    const friend = dataToShow.find((f) => f.id.toString() === friendId);
    return friend && !friend.isInGroup;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Friends</Text>
          <Text style={styles.headerSubtitle}>to {groupName}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search for friends or users..."
          onSearch={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Selected Count */}
      {selectedAvailableFriends.length > 0 && (
        <View style={styles.selectedCountContainer}>
          <Text style={styles.selectedCountText}>
            {selectedAvailableFriends.length} friend
            {selectedAvailableFriends.length !== 1 ? "s" : ""} selected
          </Text>
        </View>
      )}

      {/* Friends List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : (
          <>
            {hasSearched && (
              <View style={styles.sectionHeader}>
                <Search size={20} color="#64748b" />
                <Text style={styles.sectionTitle}>
                  {searching
                    ? "Searching..."
                    : `Search Results (${searchResults.length})`}
                </Text>
              </View>
            )}

            {!hasSearched && friends.length > 0 && (
              <View style={styles.sectionHeader}>
                <Users size={20} color="#64748b" />
                <Text style={styles.sectionTitle}>
                  Your Friends ({availableFriends.length} available)
                </Text>
              </View>
            )}

            <FlatList
              data={dataToShow}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFriendItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Users size={48} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>
                    {hasSearched ? "No users found" : "No friends yet"}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {hasSearched
                      ? "Try searching with a different term"
                      : "Add friends first to invite them to groups"}
                  </Text>
                </View>
              )}
            />
          </>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addButton,
            selectedAvailableFriends.length === 0 && styles.addButtonDisabled,
          ]}
          onPress={handleAddFriends}
          disabled={selectedAvailableFriends.length === 0 || addingFriends}
        >
          {addingFriends ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <UserPlus size={20} color="white" style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>
                Add{" "}
                {selectedAvailableFriends.length > 0
                  ? `(${selectedAvailableFriends.length})`
                  : "Friends"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Keep your existing styles - they're fine
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  searchBar: {
    marginBottom: 0,
  },
  selectedCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  selectedCountText: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "500",
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  selectedFriendItem: {
    backgroundColor: "#eff6ff",
  },
  inGroupFriendItem: {
    backgroundColor: "#f9fafb",
    opacity: 0.7,
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  friendAction: {
    marginLeft: 12,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  selectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  inGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#dcfce7",
    borderRadius: 12,
  },
  inGroupText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  addButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default AddFriendsToGroup;
