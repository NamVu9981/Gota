import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Shield,
  Star,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Info,
  Award,
} from "lucide-react-native";
import {
  smartApprovalApi,
  UserTrustLevel,
} from "./MoneySharing/services/smartApprovalApi";

interface TrustLevelCardProps {
  groupId: string;
  onPress?: () => void;
}

const TrustLevelCard: React.FC<TrustLevelCardProps> = ({
  groupId,
  onPress,
}) => {
  const [trustLevel, setTrustLevel] = useState<UserTrustLevel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrustLevel = async () => {
    setLoading(true);
    try {
      const trust = await smartApprovalApi.getUserTrustLevel(groupId);
      setTrustLevel(trust);
    } catch (error) {
      console.error("Error fetching trust level:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustLevel();
  }, [groupId]);

  const getTrustLevelInfo = (level: string) => {
    switch (level) {
      case "trusted":
        return {
          icon: Shield,
          color: "#10b981",
          bgColor: "#ecfdf5",
          title: "Trusted Member",
          description: "Auto-approved for smaller expenses",
        };
      case "co_admin":
        return {
          icon: Award,
          color: "#8b5cf6",
          bgColor: "#f3e8ff",
          title: "Co-Admin",
          description: "High auto-approval limits",
        };
      default:
        return {
          icon: Star,
          color: "#64748b",
          bgColor: "#f8fafc",
          title: "New Member",
          description: "Building trust with the group",
        };
    }
  };

  const showTrustInfo = () => {
    if (!trustLevel) return;

    const info = getTrustLevelInfo(trustLevel.trust_level);
    Alert.alert(
      `${info.title} Status`,
      `Trust Score: ${(trustLevel.trust_score * 100).toFixed(
        0
      )}%\n\nExpenses Created: ${
        trustLevel.total_expenses_created
      }\nApproval Rate: ${trustLevel.approval_rate.toFixed(
        1
      )}%\n\nAuto-approve limit: ${trustLevel.auto_approve_limit}\n\n${
        info.description
      }`,
      [{ text: "Got it", style: "default" }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading trust level...</Text>
      </View>
    );
  }

  if (!trustLevel) {
    return null;
  }

  const trustInfo = getTrustLevelInfo(trustLevel.trust_level);
  const IconComponent = trustInfo.icon;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress || showTrustInfo}
      activeOpacity={0.7}
    >
      {/* Trust Level Header */}
      <View style={styles.header}>
        <View
          style={[styles.iconContainer, { backgroundColor: trustInfo.bgColor }]}
        >
          <IconComponent size={20} color={trustInfo.color} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{trustInfo.title}</Text>
          <Text style={styles.description}>{trustInfo.description}</Text>
        </View>
        <TouchableOpacity onPress={showTrustInfo} style={styles.infoButton}>
          <Info size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Trust Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <DollarSign size={16} color="#007bff" />
          <Text style={styles.metricLabel}>Auto-approve limit</Text>
          <Text style={styles.metricValue}>
            ${trustLevel.auto_approve_limit}
          </Text>
        </View>

        <View style={styles.metric}>
          <TrendingUp size={16} color="#10b981" />
          <Text style={styles.metricLabel}>Approval rate</Text>
          <Text style={styles.metricValue}>
            {trustLevel.approval_rate.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metric}>
          <CheckCircle size={16} color="#8b5cf6" />
          <Text style={styles.metricLabel}>Trust score</Text>
          <Text style={styles.metricValue}>
            {(trustLevel.trust_score * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${trustLevel.trust_score * 100}%`,
                backgroundColor: trustInfo.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {trustLevel.total_expenses_created} expenses created
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  loadingCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: "#64748b",
  },
  infoButton: {
    padding: 4,
  },

  // Metrics
  metricsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 2,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },

  // Progress
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#f1f5f9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});

export default TrustLevelCard;
