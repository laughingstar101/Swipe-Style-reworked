import React, { useState, useEffect, useContext } from "react";
import { StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import SwipePage from "../screens/SwipePage";
import FavouritesPage from "../screens/FavouritesPage";
import BasketPage from "../screens/BasketPage";
import SettingsPage from "../screens/SettingsPage";
import HistoryPage from "../screens/HistoryPage";
import Icon from "react-native-vector-icons/AntDesign";
import { UserContext } from "../contexts/userContext";
import { useTheme } from "../contexts/themeContext";
import { getFavouritesByUserId, getUserBasket } from "../utils/api";

export default function App() {
  const Tab = createMaterialTopTabNavigator();
  const [favourites, setFavourites] = useState([]);
  const [basket, setBasket] = useState([]);
  const [likedHistory, setLikedHistory] = useState([]);
  const [dislikedHistory, setDislikedHistory] = useState([]);

  const { user } = useContext(UserContext);
  const { theme } = useTheme();

  const addToLikedHistory = (item) => {
    setLikedHistory((prev) => [item, ...prev]);
  };

  const addToDislikedHistory = (item) => {
    setDislikedHistory((prev) => [item, ...prev]);
  };

  useEffect(() => {
    getFavouritesByUserId(user)
      .then((favouritesFromApi) => {
        setFavourites(favouritesFromApi.data.userFavouriteClothes);
        console.log(favouritesFromApi.data.userFavouriteClothes);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    getUserBasket(user)
      .then((basketFromApi) => {
        setBasket(basketFromApi.data.userBasket);
        console.log("basket form API");
        console.log(basketFromApi.data.userBasket);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <Tab.Navigator
      style={styles.tab}
      screenOptions={{
        swipeEnabled: false,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: theme.cardBackground },
        tabBarIndicatorStyle: { backgroundColor: theme.primary },
        tabBarActiveTintColor: theme.tabIconActive,
        tabBarInactiveTintColor: theme.tabIconInactive,
      }}
    >
      <Tab.Screen
        name="Home"
        children={(props) => (
          <SwipePage
            setFavourites={setFavourites}
            addToLikedHistory={addToLikedHistory}
            addToDislikedHistory={addToDislikedHistory}
            {...props}
          />
        )}
        options={{
          tabBarIcon: ({ color }) => <Icon name="home" size={25} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favourites"
        children={(props) => (
          <FavouritesPage
            basket={basket}
            setBasket={setBasket}
            favourites={favourites}
            setFavourites={setFavourites}
            {...props}
          />
        )}
        options={{
          tabBarIcon: ({ color }) => <Icon name="hearto" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Basket"
        children={(props) => <BasketPage basket={basket} setBasket={setBasket} {...props} />}
        options={{
          tabBarIcon: ({ color }) => <Icon name="shoppingcart" size={25} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsPage}
        options={{
          tabBarIcon: ({ color }) => <Icon name="setting" size={25} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        children={(props) => (
          <HistoryPage
            basket={basket}
            setBasket={setBasket}
            favourites={favourites}
            setFavourites={setFavourites}
            likedHistory={likedHistory}
            dislikedHistory={dislikedHistory}
            {...props}
          />
        )}
        options={{
          tabBarIcon: ({ color }) => <Icon name="clockcircleo" size={23} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tab: {
    paddingTop: 45,
  },
});
