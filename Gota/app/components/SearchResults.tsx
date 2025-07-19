import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { User } from "@/api/friends/friendsApi";

interface SearchResultsProps {
  users: User[];
  loading: boolean;
}

interface UserItemProps {
  user: User;
  onPress: (user: User) => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, onPress }) => {
  return (
    <TouchableOpacity style={styles.userItem} onPress={() => onPress(user)}>
      <View style={styles.userInfo}>
        <Image
          source={{
            uri: user.avatar || "https://via.placeholder.com/50x50",
          }}
          style={styles.avatar}
        />

        <View style={styles.userDetails}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
};

const SearchResults: React.FC<SearchResultsProps> = ({ users, loading }) => {
  const router = useRouter();

  const handleUserPress = (user: User) => {
    router.push({
      pathname: "/user/[id]",
      params: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No users found</Text>
        <Text style={styles.emptySubText}>
          Try searching with a different term
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.resultsHeader}>
        Found {users.length} user{users.length !== 1 ? "s" : ""}
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserItem user={item} onPress={handleUserPress} />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  arrow: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default SearchResults;
