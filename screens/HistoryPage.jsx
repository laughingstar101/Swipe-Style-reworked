import React from "react";
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "../contexts/themeContext";
import { Button } from "@react-native-material/core";

const resolveImageUri = (uri) => {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  return `https://${uri}`;
};

const HistoryPage = ({ likedHistory = [], dislikedHistory = [] }) => {
  const { theme } = useTheme();

  const renderCard = (item, type) => {
    const imageUri = resolveImageUri(item.item_img_url);

    return (
      <View key={`${type}-${item.clothes_id ?? item.item_id ?? Math.random()}`} style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>No image</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>Price: {item.price}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.category?.toUpperCase() || "Unknown"}</Text>
          <Text style={[styles.badge, { backgroundColor: type === "liked" ? theme.liked : theme.disliked, color: theme.text }]}>{type === "liked" ? "Liked" : "Disliked"}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.heading, { color: theme.text }]}>Liked Clothes</Text>
        {likedHistory.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't liked any clothes yet.</Text>
        ) : (
          likedHistory.map((item) => renderCard(item, "liked"))
        )}

        <Text style={[styles.heading, { color: theme.text }]}>Disliked Clothes</Text>
        {dislikedHistory.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't disliked any clothes yet.</Text>
        ) : (
          dislikedHistory.map((item) => renderCard(item, "disliked"))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HistoryPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptyText: {
    marginBottom: 16,
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  imageFallback: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#555",
  },
  fallbackText: {
    fontSize: 16,
  },
  cardBody: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    marginBottom: 4,
  },
  badge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "700",
  },
});