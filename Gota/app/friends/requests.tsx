// app/friends/requests.tsx
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
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "@/api/friends/friendsApi";

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: string;
  created_at: string;
}

const FriendRequestsPage = () => {
  const router = useRouter();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getPendingRequests();
      setRequests(data);
      console.log("Loaded friend requests:", data);
    } catch (error) {
      console.error("Error loading friend requests:", error);
      Alert.alert("Error", "Failed to load friend requests");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    Alert.alert(
      "Accept Friend Request",
      `Accept friend request from ${request.from_user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            setProcessingIds((prev) => new Set(prev).add(request.id));
            try {
              await acceptFriendRequest(request.id);
              // Remove from list since it's accepted
              setRequests((prev) => prev.filter((r) => r.id !== request.id));
              Alert.alert(
                "Success",
                `You are now friends with ${request.from_user.username}!`
              );
            } catch (error) {
              console.error("Error accepting request:", error);
              Alert.alert("Error", "Failed to accept friend request");
            } finally {
              setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    Alert.alert(
      "Reject Friend Request",
      `Reject friend request from ${request.from_user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setProcessingIds((prev) => new Set(prev).add(request.id));
            try {
              await rejectFriendRequest(request.id);
              // Remove from list since it's rejected
              setRequests((prev) => prev.filter((r) => r.id !== request.id));
              Alert.alert("Rejected", "Friend request rejected");
            } catch (error) {
              console.error("Error rejecting request:", error);
              Alert.alert("Error", "Failed to reject friend request");
            } finally {
              setProcessingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.requestItem}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: item.from_user.avatar || "https://via.placeholder.com/60x60",
            }}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.from_user.username}</Text>
            <Text style={styles.email}>{item.from_user.email}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.disabledButton]}
            onPress={() => handleAcceptRequest(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.disabledButton]}
            onPress={() => handleRejectRequest(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Friend Requests",
            headerShown: true,
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading requests...</Text>
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

      <View style={styles.content}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No friend requests</Text>
            <Text style={styles.emptySubText}>
              When someone sends you a friend request, it will appear here
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerText}>
                {requests.length} pending request
                {requests.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <FlatList
              data={requests}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRequestItem}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    paddingVertical: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  listContainer: {
    paddingBottom: 20,
  },
  requestItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
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
  userDetails: {
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
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
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
  backButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FriendRequestsPage;
