import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert } from "react-native";
import { getGroupDetails } from "../../../groups/groupsApi";
import { GroupDetails } from "../types/group.types";

export const useGroupDetails = (id: any, memberAdded: any) => {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroupDetails = useCallback(async () => {
    try {
      setError(null);
      const groupData = await getGroupDetails(Array.isArray(id) ? id[0] : id);
      setGroup(groupData);
    } catch (err) {
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

  useEffect(() => {
    loadGroupDetails();
  }, [loadGroupDetails]);

  useFocusEffect(
    useCallback(() => {
      if (memberAdded === "true") {
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
