import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search for friends...",
  onSearch,
  onFocus,
  style,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={onFocus}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    marginLeft: 10,
  },
});

export default SearchBar;
