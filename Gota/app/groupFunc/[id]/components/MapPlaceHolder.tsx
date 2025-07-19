// 📁 components/MapPlaceholder.tsx
import React from "react";
import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";
import { styles } from "../styles/groupDetails.styles";

const MapPlaceholder: React.FC = () => {
  return (
    <View style={styles.mapCard}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color="#94a3b8" />
        <Text style={styles.mapPlaceholderTitle}>Location Map</Text>
        <Text style={styles.mapPlaceholderSubtitle}>
          Map view will show member locations here
        </Text>
      </View>
    </View>
  );
};

export default MapPlaceholder;
