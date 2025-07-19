// 📁 hooks/useGroupDetails.ts
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import { getGroupDetails } from "@/app/groups/groupsApi";
import { GroupDetails } from "../types/group.types";

export const useGroupDetails = (id: any, memberAdded: any) => {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroupDetails = useCallback(async () => {
    try {
      setError(null);
      console.log("📊 Loading group details for ID:", id);

      const groupData = await getGroupDetails(Array.isArray(id) ? id[0] : id);
      console.log("✅ Group data loaded:", groupData);

      setGroup(groupData);
    } catch (err) {
      console.error("❌ Error loading group details:", err);
      setError("Failed to load group details");
      Alert.alert("Error", "Failed to load group details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupDetails();
    setRefreshing(false);
  }, [loadGroupDetails]);

  // Load initial data
  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  // Refresh when returning from add friends
  useFocusEffect(
    useCallback(() => {
      if (memberAdded === "true") {
        console.log("🔄 Refreshing due to member added");
        loadGroupDetails();
      }
    }, [memberAdded, loadGroupDetails])
  );

  return {
    group,
    loading,
    refreshing,
    error,
    loadGroupDetails,
    onRefresh,
  };
};
