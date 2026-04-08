import React, { useState, useRef, createRef, useEffect } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, Share, Alert } from "react-native";
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

const SwipePage = ({ setFavourites }) => {
  const { user } = useContext(UserContext);
  const swiperRef = createRef();
  const favAnimation = useRef(null);
  const [clothesData, setClothesData] = useState(data);
  const [index, setIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [preferences, setPreferences] = useState({});
  const [error, setError] = useState(null);
  const [isPressed, setIsPressed] = useState(false);
  const [intialLoading, setIntialLoading] = useState(false);

  // Share item function
  const shareItem = async (item) => {
    if (!item) return;
    
    try {
      const message = `👕 Check out this ${item.title || 'item'}!\n\n💰 Price: ${item.price || 'N/A'}\n🏷️ Brand: ${item.brand || 'Unknown'}\n🎨 Style: ${item.style || 'Various'}\n\nShared from Swipe Style App - Find your perfect outfit!`;
      
      await Share.share({
        message: message,
        title: item.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share this item');
    }
  };

  useEffect(() => {
    const fetchInitialSuggestedClothes = async () => {
      setIntialLoading(true);
      try {
        const clothesFromAPI = await suggestedClothes(user);
        setClothesData(clothesFromAPI.data.suggestedClothes);
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
          userFromAPI.data.user.preferences || "{}"
        );
        setPreferences(existingUserPreferences);
      } catch (err) {
        console.log(err, "couldnt fetch existing user preferences");
      }
    };

    fetchInitialSuggestedClothes();
    fetchUserDataThenSetPreferences();
  }, []);

  useEffect(() => {
    const fetchSuggestedClothesAndConcat = async () => {
      try {
        const clothesFromAPI = await suggestedClothes(user);
        const newData = [...clothesData, ...(clothesFromAPI.data.suggestedClothes || [])];
        setClothesData(newData);
      } catch (err) {
        console.log(err);
      }
    };

    const patchUserPreferencesUseEffect = async () => {
      try {
        const data = JSON.stringify(preferences);
        await patchUserPreferences(user, { preferences: data });
      } catch (err) {
        console.log(err);
      }
    };

    if (index > 0 && index % 10 === 0) {
      patchUserPreferencesUseEffect();
    } else if (index > 0 && index % 10 !== 0 && index % 5 === 0) {
      fetchSuggestedClothesAndConcat();
    }
  }, [index]);

  const addToPreferences = (item) => {
    if (!item) return;
    
    let newPreferences = Object.assign({}, preferences);
    newPreferences.brand = newPreferences.brand || {};
    newPreferences.category = newPreferences.category || {};
    newPreferences.color = newPreferences.color || {};
    newPreferences.title = newPreferences.title || {};

    if (item.brand) {
      let lowerCaseBrand = item.brand.toLowerCase();
      newPreferences.brand[lowerCaseBrand] = (newPreferences.brand[lowerCaseBrand] || 0) + 1;
    }
    if (item.category) {
      let lowerCaseCategory = item.category.toLowerCase();
      newPreferences.category[lowerCaseCategory] = (newPreferences.category[lowerCaseCategory] || 0) + 1;
    }
    if (item.color) {
      let lowerCaseColor = item.color.toLowerCase();
      newPreferences.color[lowerCaseColor] = (newPreferences.color[lowerCaseColor] || 0) + 1;
    }
    if (item.title) {
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
          newPreferences.title[lowerCaseWord] = (newPreferences.title[lowerCaseWord] || 0) + 1;
        }
      });
    }
    setPreferences(newPreferences);
  };

  const removeFromPreferences = (item) => {
    if (!item) return;
    
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

  const handleSwipeOnPress = (preference) => {
    preference === 1
      ? swiperRef.current?.swipeRight()
      : swiperRef.current?.swipeLeft();
  };

  const handleSwipe = (preference) => {
    const currentItem = clothesData[index];
    if (currentItem) {
      if (preference === 1) {
        addToPreferences(currentItem);
      } else {
        removeFromPreferences(currentItem);
      }
    }
    setIndex((currentIndex) => currentIndex + 1);
  };

  const handleSwipeBack = () => {
    swiperRef.current?.swipeBack();
    setIndex((currentIndex) => currentIndex - 1);
  };

  const handleDoubleTap = () => {
    const myTime = new Date();
    const mySec = myTime.getTime();
    if (mySec - lastTime < 250) {
      const currentItem = clothesData[index];
      if (currentItem) {
        handleAddToFavorite(currentItem);
      }
    }
    setLastTime(mySec);
  };

  const handleAddToFavorite = async (card) => {
    if (!card) return;
    
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

  useEffect(() => {
    if (tapCount === 2) {
      setIsPressed(true);
      favAnimation.current?.play(5, 27);
      favAnimation.current?.play(27, 5);
    }
  }, [tapCount]);

  const Card = ({ card }) => {
    if (!card) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Loading...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.card}>
        {card.item_img_url ? (
          <Image
            source={{ uri: card.item_img_url.startsWith('http') ? card.item_img_url : `https://${card.item_img_url}` }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{card.title || 'Untitled Item'}</Text>
        
        <TouchableOpacity 
          style={styles.cardShareButton}
          onPress={() => shareItem(card)}
        >
          <Ionicons name="share-social" size={24} color="#7209b7" />
        </TouchableOpacity>
      </View>
    );
  };

  const Buttons = () => {
    const currentItem = clothesData[index];
    
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
        <IconButton
          icon={(props) => <Icon name="sharealt" {...props} />}
          color={colors.violet}
          size={30}
          backgroundColor={colors.white}
          borderWidth={1}
          borderColor={colors.border}
          onPress={() => currentItem && shareItem(currentItem)}
        />
        <IconButton
          icon={(props) => <Icon name="heart" {...props} />}
          color={colors.darkviolet}
          size={30}
          backgroundColor={colors.white}
          borderWidth={1}
          borderColor={colors.border}
          onPress={() => currentItem && handleAddToFavorite(currentItem)}
        />
      </View>
    );
  };

  return intialLoading ? (
    <LoadingSpinner />
  ) : (
    <View style={styles.container}>
      {error && (
        <Text style={styles.errorText}>
          An error occurred trying to fetch the data.
        </Text>
      )}
      {!error && (
        <>
          <View style={styles.swiperView}>
            <LottieView
              ref={favAnimation}
              style={[styles.heartLottie, !isPressed && { display: "none" }]}
              source={require("../assets/like-button.json")}
            />
            {clothesData.length > 0 ? (
              <Swiper
                ref={swiperRef}
                cards={clothesData}
                cardIndex={index}
                renderCard={(card) => <Card card={card} />}
                onSwipedRight={() => handleSwipe(1)}
                onSwipedLeft={() => handleSwipe(-1)}
                onTapCard={() => handleDoubleTap()}
                stackSize={5}
                stackSeparation={10}
                infinite={false}
                backgroundColor={colors.white}
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
            ) : null}
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
  placeholderImage: {
    width: "100%",
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  placeholderText: {
    color: "#999",
    fontSize: 16,
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