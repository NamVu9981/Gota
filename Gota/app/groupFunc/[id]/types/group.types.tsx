export interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  role: "owner" | "member";
  joined_at: string;
  is_location_visible: boolean;
  last_seen?: string;
  is_owner: boolean;
}

export interface GroupDetails {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_owner: boolean;
  created_at: string;
  last_activity?: string;
  owner: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  members?: GroupMember[];
}

// 📁 types/group.types.ts

export interface GroupMember {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  role: "owner" | "member";
  joined_at: string;
  is_location_visible: boolean;
  last_seen?: string;
  is_owner: boolean;
}

export interface GroupDetails {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_owner: boolean;
  created_at: string;
  last_activity?: string;
  owner: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  members?: GroupMember[];
}

// Additional types for component props
export interface GroupHeaderProps {
  group: GroupDetails;
}

export interface GroupInfoCardProps {
  group: GroupDetails;
}

export interface QuickActionsProps {
  group: GroupDetails;
}

export interface MembersSectionProps {
  group: GroupDetails;
  onRefresh: () => Promise<void>;
}

export interface MemberItemProps {
  member: GroupMember;
  isOwner: boolean;
  onRemove: (memberId: string, memberName: string) => void;
}

export interface LocationSharingCardProps {
  groupId: string;
  initialLocationSharing?: boolean;
  onLocationUpdate?: (isVisible: boolean) => void;
}

export interface ErrorScreenProps {
  error?: string | null;
}

// Hook return types
export interface UseGroupDetailsReturn {
  group: GroupDetails | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadGroupDetails: () => Promise<void>;
  onRefresh: () => Promise<void>;
}
