// app/friends/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { getFriendsList, removeFriend } from "@/api/friends/friendsApi";

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

const FriendsListPage = () => {
  const router = useRouter();
  const [friends, setFriends] = useState<User[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    // Filter friends based on search query
    if (searchQuery.trim() === "") {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(
        (friend) =>
          friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriendsList();
      setFriends(data);
      console.log("Loaded friends:", data);
    } catch (error) {
      console.error("Error loading friends:", error);
      Alert.alert("Error", "Failed to load friends list");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const handleFriendPress = (friend: User) => {
    // Navigate to friend's profile
    router.push({
      pathname: "/user/[id]",
      params: {
        id: friend.id.toString(),
        username: friend.username,
        email: friend.email,
        avatar: friend.avatar || "",
      },
    });
  };

  const handleRemoveFriend = (friend: User) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.username} from your friends list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend(friend.id);
              // Remove friend from local state
              setFriends((prevFriends) =>
                prevFriends.filter((f) => f.id !== friend.id)
              );
              Alert.alert(
                "Success",
                `${friend.username} has been removed from your friends list`
              );
            } catch (error) {
              console.error("Error removing friend:", error);
              Alert.alert(
                "Error",
                "Failed to remove friend. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <TouchableOpacity
        style={styles.friendContent}
        onPress={() => handleFriendPress(item)}
      >
        <View style={styles.friendInfo}>
          <Image
            source={{
              uri: item.avatar || "https://via.placeholder.com/60x60",
            }}
            style={styles.avatar}
          />
          <View style={styles.friendDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>

      {/* Remove friend button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(item)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Custom header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Friends</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Friends</Text>
        <TouchableOpacity
          onPress={() => router.push("/friends/requests")}
          style={styles.requestsButton}
        >
          <Text style={styles.requestsButtonText}>Requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            {friends.length === 0 ? (
              // No friends at all
              <>
                <Text style={styles.emptyText}>No friends yet</Text>
                <Text style={styles.emptySubText}>
                  Add friends by searching for them or accepting friend requests
                </Text>
                <TouchableOpacity
                  style={styles.addFriendsButton}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={styles.addFriendsButtonText}>Find Friends</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Friends exist but search returned no results
              <>
                <Text style={styles.emptyText}>No friends found</Text>
                <Text style={styles.emptySubText}>
                  Try searching with a different name
                </Text>
              </>
            )}
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {filteredFriends.length} friend
                {filteredFriends.length !== 1 ? "s" : ""}
                {searchQuery ? ` found` : ""}
              </Text>
            </View>

            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFriendItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,123,255,0.1)",
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerSpacer: {
    width: 80,
  },
  requestsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,99,99,0.1)",
    borderRadius: 20,
  },
  requestsButtonText: {
    fontSize: 14,
    color: "#ff6363",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  listContainer: {
    paddingBottom: 20,
  },
  friendItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ff4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  arrow: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  addFriendsButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFriendsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FriendsListPage;
