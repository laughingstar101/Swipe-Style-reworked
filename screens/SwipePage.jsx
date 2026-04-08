import React, { useState, useRef, createRef, useEffect } from "react";
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Share, Alert } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { Ionicons } from '@expo/vector-icons';
import data from "../data.js";
import Swiper from "react-native-deck-swiper";
import { IconButton } from "@react-native-material/core";
import LottieView from "lottie-react-native";
import { colors, listOfAvoidWords } from "../utils/variables.js";
import {
  suggestedClothes,
  patchUserPreferences,
  getUser,
  postFavouritesByUserId,
} from "../utils/api.js";
import { useContext } from "react";
import { UserContext } from "../contexts/userContext";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useTheme } from "../contexts/themeContext";

const SwipePage = ({ setFavourites }) => {
  const { user } = useContext(UserContext);
  const { theme } = useTheme();
  const swiperRef = createRef();
  const favAnimation = useRef(null);
  const [clothesData, setClothesData] = useState(data);
  const [filteredClothes, setFilteredClothes] = useState(data);
  const [index, setIndex] = useState(1);
  const [tapCount, setTapCount] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [preferences, setPreferences] = useState({});
  const [error, setError] = useState(null);
  const [isPressed, setIsPressed] = useState(false);
  const [intialLoading, setIntialLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Share item function
  const shareItem = async (item) => {
    if (!item) return;
    
    try {
      const message = `👕 Check out this ${item.title || 'item'}!\n\n💰 Price: ${item.price || 'N/A'}\n🏷️ Brand: ${item.brand || 'Unknown'}\n🎨 Style: ${item.style || 'Various'}\n\nShared from Swipe Style App - Find your perfect outfit!`;
      
      const result = await Share.share({
        message: message,
        title: item.title,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share this item');
      console.log(error);
    }
  };

  // Search filter function
  useEffect(() => {
    if (searchQuery === '') {
      setFilteredClothes(clothesData);
    } else {
      const filtered = clothesData.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.style?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClothes(filtered);
    }
    // Reset index when filtering to avoid out of bounds
    setIndex(0);
  }, [searchQuery, clothesData]);

  //this fetches the initial array of 10 items. user.uid needs passing in
  useEffect(() => {
    const fetchInitialSuggestedClothes = async () => {
      setIntialLoading(true);
      try {
        const clothesFromAPI = await suggestedClothes(user);
        setClothesData(clothesFromAPI.data.suggestedClothes);
        setFilteredClothes(clothesFromAPI.data.suggestedClothes);
        setIntialLoading(false);
      } catch (err) {
        setError(err);
        setIntialLoading(false);
        console.log(err, "couldnt fetch suggested clothes");
      }
    };

    const fetchUserDataThenSetPreferences = async () => {
      try {
        const userFromAPI = await getUser(user);
        const existingUserPreferences = JSON.parse(
          userFromAPI.data.user.preferences
        );

        setPreferences(existingUserPreferences);
      } catch (err) {
        console.log(err, "couldnt fetch existing user preferences");
      }
    };

    fetchInitialSuggestedClothes();
    fetchUserDataThenSetPreferences();
  }, []);

  //user.uid will need passing in to these functions
  useEffect(() => {
    const fetchSuggestedClothesAndConcat = async () => {
      try {
        const clothesFromAPI = await suggestedClothes(user);
        const newData = clothesData.concat(
          clothesFromAPI.data.suggestedClothes
        );
        setClothesData(newData);
        setFilteredClothes(newData);
      } catch (err) {
        console.log(err);
      }
    };

    const patchUserPreferencesUseEffect = async () => {
      try {
        const data = JSON.stringify(preferences);
        const res = await patchUserPreferences(user, { preferences: data });
      } catch (err) {
        console.log(err);
      }
    };

    //on every 10th index
    if (index % 10 === 0) {
      patchUserPreferencesUseEffect();
      //every 10+5 index
    } else if (index % 10 !== 0 && index % 5 === 0) {
      fetchSuggestedClothesAndConcat();
    }
  }, [index]);

  //this will add an item to user preferences
  const addToPreferences = (item) => {
    //create a copy of preferences object from state
    let newPreferences = Object.assign({}, preferences);

    //init the object, make sure it has correct keys
    newPreferences.brand = newPreferences.brand || {};
    newPreferences.category = newPreferences.category || {};
    newPreferences.color = newPreferences.color || {};
    newPreferences.title = newPreferences.title || {};

    //sometimes getting error, crashing program, item.brand = undefined, so i added if statements
    if (item.brand) {
      //make everything lowercase
      let lowerCaseBrand = item.brand.toLowerCase();
      newPreferences.brand[lowerCaseBrand] =
        //if it doesnt exist, create it and set it to 0, then increment by 1
        //this means if it doesnt exist, it will be 1. if it exists it will be +=1
        (newPreferences.brand[lowerCaseBrand] || 0) + 1;
    }
    if (item.category) {
      let lowerCaseCategory = item.category.toLowerCase();
      newPreferences.category[lowerCaseCategory] =
        (newPreferences.category[lowerCaseCategory] || 0) + 1;
    }
    if (item.color) {
      let lowerCaseColor = item.color.toLowerCase();
      newPreferences.color[lowerCaseColor] =
        (newPreferences.color[lowerCaseColor] || 0) + 1;
    }
    if (item.title) {
      //if the brand, color or category already exist in title, dont add them
      let lowerCaseBrand = item.brand ? item.brand.toLowerCase() : "";
      let lowerCaseColor = item.color ? item.color.toLowerCase() : "";
      let lowerCaseCategory = item.category ? item.category.toLowerCase() : "";
      let title = item.title
        .replace(lowerCaseBrand, "")
        .replace(lowerCaseColor, "")
        .replace(lowerCaseCategory, "")
        .trim();
      let titleWords = title.split(" ");
      titleWords.forEach((word) => {
        let lowerCaseWord = word.toLowerCase();
        if (!listOfAvoidWords.includes(lowerCaseWord) && word.length > 2) {
          newPreferences.title[lowerCaseWord] =
            (newPreferences.title[lowerCaseWord] || 0) + 1;
        }
      });
    }
    setPreferences(newPreferences);
  };

  const removeFromPreferences = (item) => {
    let newPreferences = Object.assign({}, preferences);
    newPreferences.brand = newPreferences.brand || {};
    newPreferences.category = newPreferences.category || {};
    newPreferences.color = newPreferences.color || {};
    newPreferences.title = newPreferences.title || {};

    if (item.brand) {
      let brand = item.brand.toLowerCase();
      if (newPreferences.brand[brand]) {
        newPreferences.brand[brand]--;
        if (newPreferences.brand[brand] === 0) {
          delete newPreferences.brand[brand];
        }
      }
    }
    if (item.category) {
      let category = item.category.toLowerCase();
      if (newPreferences.category[category]) {
        newPreferences.category[category]--;
        if (newPreferences.category[category] === 0) {
          delete newPreferences.category[category];
        }
      }
    }
    if (item.color) {
      let color = item.color.toLowerCase();
      if (newPreferences.color[color]) {
        newPreferences.color[color]--;
        if (newPreferences.color[color] === 0) {
          delete newPreferences.color[color];
        }
      }
    }
    if (item.title) {
      let title = item.title.toLowerCase();
      let titleWords = title.split(" ");
      titleWords.forEach((word) => {
        word = word.toLowerCase();
        if (newPreferences.title[word]) {
          newPreferences.title[word]--;
          if (newPreferences.title[word] === 0) {
            delete newPreferences.title[word];
          }
        }
      });
    }
    setPreferences(newPreferences);
  };

  // GESTURES
  const handleSwipeOnPress = (preference) => {
    preference === 1
      ? swiperRef.current.swipeRight()
      : swiperRef.current.swipeLeft();
  };

  const handleSwipe = (preference) => {
    console.log(index);
    if (preference === 1) {
      addToPreferences(filteredClothes[index]);
    } else {
      removeFromPreferences(filteredClothes[index]);
    }
    setIndex((currentIndex) => currentIndex + 1);
  };

  const handleSwipeBack = () => {
    swiperRef.current.swipeBack();
    setIndex((currentIndex) => currentIndex - 1);
  };

  const handleDoubleTap = () => {
    const myTime = new Date();
    const mySec = myTime.getTime();
    if (mySec - lastTime < 250) {
      handleAddToFavorite(filteredClothes[index]);
    }
    setLastTime(mySec);
  };

  const handleAddToFavorite = async (card) => {
    console.log("double tap");
    setTapCount(2);
    try { 
      handleSwipeOnPress(1);
      setTimeout(() => {
        setTapCount(0);
        setIsPressed(false);
      }, 500);

      postFavouritesByUserId(user, card.clothes_id)
        .then((clothesAddedToFavourites) => {
          const { favourite } = clothesAddedToFavourites.data;

          const newClothesAddedToFavourites = {
            "favourite_id": favourite.favourite_id,
            "clothes_id": favourite.clothes_id,
            "uid": favourite.uid,
            "title": card.title,
            "category": card.category,
            "item_img_url": card.item_img_url,
            "price": card.price,
          };

          setFavourites((currCards) => [newClothesAddedToFavourites, ...currCards]);
        })
    } catch (err) {
        console.log(err);
    }
  };

  // animation of adding to Favourites
  useEffect(() => {
    if (tapCount === 2) {
      setIsPressed(true);
      favAnimation.current.play(5, 27);
      favAnimation.current.play(27, 5);
    }
  }, [tapCount]);

  //added some error handling if img_url undefined
  const Card = ({ card }) => {
    if (!card) return null;
    
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        {card.item_img_url ? (
          <Image
            source={{ uri: `https://${card.item_img_url}` }}
            style={styles.cardImage}
          />
        ) : (
          <Text style={styles.cardTitle}>Error: Image URL is undefined</Text>
        )}
        <Text style={[styles.cardTitle, { color: theme.text }]}>{card.title}</Text>
        
        {searchQuery !== '' && (
          <View style={styles.searchMatchBadge}>
            <Text style={styles.searchMatchText}>
              🔍 Matches your search
            </Text>
          </View>
        )}
      </View>
    );
  };

  const Buttons = () => {
    const currentCard = filteredClothes[index];
    return (
      <View style={styles.icons}>
        <IconButton
          icon={(props) => <Icon name="back" {...props} />}
          color={colors.darkgrey}
          size={30}
          backgroundColor={colors.white}
          borderWidth={1}
          borderColor={colors.border}
          onPress={() => handleSwipeBack()}
        />
        <Icon
          name="closecircle"
          size={70}
          color={colors.red}
          onPress={() => handleSwipeOnPress(-1)}
        />
        <Icon
          name="checkcircle"
          size={70}
          color={colors.green}
          onPress={() => handleSwipeOnPress(1)}
        />
        {/* Share Button */}
        <IconButton
          icon={(props) => <Icon name="sharealt" {...props} />}
          color={colors.violet}
          size={30}
          backgroundColor={colors.white}
          borderWidth={1}
          borderColor={colors.border}
          onPress={() => shareItem(currentCard)}
        />
        <IconButton
          icon={(props) => <Icon name="heart" {...props} />}
          color={colors.darkviolet}
          size={30}
          backgroundColor={colors.white}
          borderWidth={1}
          borderColor={colors.border}
          onPress={() => handleAddToFavorite(currentCard)}
        />
      </View>
    );
  };

  return intialLoading ? (
    <LoadingSpinner />
  ) : (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* DISPLAY ERROR  */}
      {error && (
        <Text style={styles.errorText}>
          An error occurred trying to fetch the data. Put a button here, try
          again?
        </Text>
      )}
      {!error && (
        <>
          {/* SEARCH BAR */}
          <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title, brand, style, or category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* SHOW SEARCH RESULTS COUNT */}
          {searchQuery !== '' && (
            <Text style={[styles.searchResultsText, { backgroundColor: theme.cardBackground, color: theme.textSecondary }]}>
              Found {filteredClothes.length} item{filteredClothes.length !== 1 ? 's' : ''}
            </Text>
          )}

          <View style={styles.swiperView}>
            {/* DISPLAY ADDING TO FAVOURITES ANIMATION */}
            <LottieView
              ref={favAnimation}
              style={[styles.heartLottie, !isPressed && { display: "none" }]}
              source={require("../assets/like-button.json")}
            />
            {filteredClothes.length > 0 ? (
              <Swiper
                ref={swiperRef}
                cards={filteredClothes}
                cardIndex={index}
                renderCard={(card) => <Card card={card} />}
                onSwipedRight={() => handleSwipe(1)}
                onSwipedLeft={() => handleSwipe(-1)}
                onTapCard={() => handleDoubleTap()}
                stackSize={5}
                stackSeparation={10}
                infinite={false}
                backgroundColor={theme.background}
                verticalSwipe={false}
                disableBottomSwipe
                disableTopSwipe
                style={styles.swiper}
                animateCardOpacity
                overlayLabels={{
                  left: {
                    title: "NOPE",
                    style: {
                      label: styles.overlayLabelsLeftLabel,
                      wrapper: styles.overlayLabelsLeftWrapper,
                    },
                  },
                  right: {
                    title: "LIKE",
                    style: {
                      label: styles.overlayLabelsRightLabel,
                      wrapper: styles.overlayLabelsRightWrapper,
                    },
                  },
                }}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No items match your search</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Buttons />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchResultsText: {
    position: "absolute",
    top: 110,
    left: 15,
    zIndex: 100,
    fontSize: 12,
    color: "#666",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  searchMatchBadge: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#7209b7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  searchMatchText: {
    color: "#fff",
    fontSize: 12,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 500,
  },
  noResultsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  clearSearchText: {
    marginTop: 10,
    color: "#7209b7",
    fontSize: 16,
  },
  swiperView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swiper: {
    position: "relative",
  },
  overlayLabelsLeftLabel: {
    color: colors.white,
    backgroundColor: colors.red,
    padding: 15,
    fontSize: 26,
  },
  overlayLabelsLeftWrapper: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  overlayLabelsRightLabel: {
    color: colors.white,
    backgroundColor: colors.green,
    padding: 15,
    fontSize: 26,
  },
  overlayLabelsRightWrapper: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  card: {
    flex: 0.7,
    borderRadius: 20,
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingBottom: 25,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
  },
  cardImage: {
    position: "relative",
    width: "100%",
    flex: 1,
    resizeMode: "cover",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 25,
    marginLeft: 5,
    marginRight: 5,
    textAlign: "center",
  },
  cardShareButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: 50,
  },
  heartLottie: {
    width: 200,
    position: "absolute",
    top: "50%",
    left: "50%",
    backgroundColor: "transparent",
    zIndex: 500,
    pointerEvents: "box-none",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 20,
  },
});

export default SwipePage;