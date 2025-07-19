import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import SearchBar from "../components/SearchBar";
import SearchResults from "../components/SearchResults";
import { User, searchUsers } from "@/api/friends/friendsApi";
import { LogOut, Users, Search, UserPlus, Globe } from "lucide-react-native";

export default function HomeScreen() {
  const { signout, user } = useAuth();
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSignout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signout();
        },
      },
    ]);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    console.log("Searching for:", query);
    setLoading(true);
    setHasSearched(true);

    try {
      const users = await searchUsers(query);
      setSearchResults(users);
      console.log("Search results:", users);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFocus = () => {
    console.log("Search bar focused");
  };

  const clearSearch = () => {
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user || "User"}! 👋</Text>
            <Text style={styles.subtitle}>
              Discover and connect with people
            </Text>
          </View>

          <TouchableOpacity
            style={styles.signoutButton}
            onPress={handleSignout}
          >
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <Search size={28} color="#007bff" />
            <View style={styles.searchHeaderText}>
              <Text style={styles.searchTitle}>Find People</Text>
              <Text style={styles.searchSubtitle}>
                Search by username or email
              </Text>
            </View>
          </View>

          <SearchBar
            placeholder="Search for friends and users..."
            onSearch={handleSearch}
            onFocus={handleSearchFocus}
            style={styles.searchBar}
          />

          {hasSearched && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {hasSearched && (
          <SearchResults users={searchResults} loading={loading} />
        )}

        {/* Welcome Content - Show when no search */}
        {!hasSearched && (
          <View style={styles.welcomeContent}>
            {/* Main Welcome Card */}
            <View style={styles.welcomeCard}>
              <Globe size={64} color="#007bff" style={styles.welcomeIcon} />
              <Text style={styles.welcomeTitle}>Welcome to Gota!</Text>
              <Text style={styles.welcomeDescription}>
                Connect with friends and share your location in groups. Start by
                searching for people you know or explore other features in the
                navigation below.
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Users size={24} color="#007bff" />
                </View>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <UserPlus size={24} color="#10b981" />
                </View>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Pending Requests</Text>
              </View>
            </View>

            {/* Features Overview */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What you can do:</Text>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔍</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Search & Connect</Text>
                  <Text style={styles.featureDescription}>
                    Find friends by username or email and send friend requests
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>👥</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Manage Friends</Text>
                  <Text style={styles.featureDescription}>
                    View your friends list and manage friend requests
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Location Groups</Text>
                  <Text style={styles.featureDescription}>
                    Create groups and share your location with selected friends
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Tip */}
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>💡</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Quick Tip</Text>
                <Text style={styles.tipText}>
                  Use the search bar above to find friends, or check out the
                  Friends and Groups tabs to manage your connections and
                  location sharing.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  signoutButton: {
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    marginBottom: 32,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  searchSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  searchBar: {
    marginBottom: 16,
  },
  clearButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
  },
  clearButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  welcomeIcon: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  featuresCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
    marginBottom: 20,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
});
