// 📁 index.tsx - Simplified Main Group Details Page
import React from "react";
import { SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useGroupDetails } from "./hooks/useGroupDetails";
import GroupHeader from "./components/GroupHeader";
import GroupInfoCard from "./components/GroupInfoCard";
import QuickActions from "./components/QuickActions";
import LocationSharingCard from "./components/LocationSharingCard";
import MembersSection from "./components/MembersSection";
import MapPlaceholder from "./components/MapPlaceHolder";
import LoadingScreen from "./components/LoadingScreen";
import ErrorScreen from "./components/ErrorScreen";
import { styles } from "./styles/groupDetails.styles";
// import ExpenseList from "./components/MoneySharing/ExpenseList";

const GroupDetailsPage = () => {
  const { id, groupName, memberAdded } = useLocalSearchParams();
  const { group, loading, refreshing, error, loadGroupDetails, onRefresh } =
    useGroupDetails(id, memberAdded);

  // Handle loading state
  if (loading) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (error || !group) {
    return <ErrorScreen error={error} />;
  }

  // Determine initial location sharing state
  const getCurrentUserLocationSharing = () => {
    if (group.members) {
      const currentUserMember = group.members.find(
        (member) => member.role === "owner" || member.is_owner
      );
      return currentUserMember?.is_location_visible ?? true;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <GroupHeader group={group} />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* <ExpenseList
          group={group}
          currentUserId={Array.isArray(id) ? id[0] : id}
        /> */}

        {/* Display group information */}
        <GroupInfoCard group={group} />

        <QuickActions group={group} />

        <LocationSharingCard
          groupId={group.id}
          initialLocationSharing={getCurrentUserLocationSharing()}
          onLocationUpdate={(isVisible) => {
            // Optionally refresh group data when location sharing changes
            console.log("Location sharing updated:", isVisible);
          }}
        />

        <MembersSection group={group} onRefresh={loadGroupDetails} />

        <MapPlaceholder />
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupDetailsPage;
