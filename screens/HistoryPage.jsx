import React from "react";
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ToastAndroid } from "react-native";
import { useTheme } from "../contexts/themeContext";
import AddToBasketButton from "../components/AddToBasketButton";
import { postFavouritesByUserId } from "../utils/api";
import { useContext } from "react";
import { UserContext } from "../contexts/userContext";
import Icon from "react-native-vector-icons/AntDesign";

const resolveImageUri = (uri) => {
  if (!uri) return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  return `https://${uri}`;
};

const HistoryPage = ({ likedHistory = [], dislikedHistory = [], basket, setBasket, favourites, setFavourites }) => {
  const { theme } = useTheme();
  const { user } = useContext(UserContext);

  const handleAddToFavourites = async (item) => {
    const clothesId = item.clothes_id ?? item.item_id;
    if (!clothesId) {
      ToastAndroid.show("Unable to save favourite for this item.", ToastAndroid.SHORT);
      return;
    }

    try {
      const response = await postFavouritesByUserId(user, clothesId);
      const { favourite } = response.data;
      const newFavourite = { ...item, favourite_id: favourite.favourite_id };
      setFavourites(prev => [newFavourite, ...prev]);
      ToastAndroid.show("Added to favourites!", ToastAndroid.SHORT);
    } catch (error) {
      console.log(error);
      ToastAndroid.show("Could not add to favourites.", ToastAndroid.SHORT);
    }
  };

  const renderCard = (item, type) => {
    const imageUri = resolveImageUri(item.item_img_url);
    const itemId = item.clothes_id ?? item.item_id;

    return (
      <View key={`${type}-${itemId ?? Math.random()}`} style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}> 
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

          <View style={styles.actionsRow}>
            <AddToBasketButton basket={basket} setBasket={setBasket} clothes={item} />
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => handleAddToFavourites(item)}
            >
              <Icon name="heart" size={20} color={theme.text} />
              <Text style={[styles.actionLabel, { color: theme.text }]}>Favourite</Text>
            </TouchableOpacity>
          </View>
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
  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 120,
  },
  actionLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
  }
});