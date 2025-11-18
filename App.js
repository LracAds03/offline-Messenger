// App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { createDatabase } from "./database/messengerApp";

// Screens
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AboutScreen from "./screens/AboutScreen";
import MenuScreen from "./screens/MenuScreen";

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [db, setDb] = useState(null);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function initApp() {
      try {
        const database = await createDatabase();
        setDb(database);

        const savedUser = await AsyncStorage.getItem("loggedUser");

        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setInitialRoute({ screen: "Home", params: { currentUser: userData, db: database } });
        } else {
          setInitialRoute({ screen: "Login", params: { db: database } });
        }
      } catch (error) {
        console.log("Startup Error:", error);
      }
    }

    initApp();
  }, []);

  if (!db || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        navigationRef.reset({
          index: 0,
          routes: [{ name: initialRoute.screen, params: initialRoute.params }],
        });
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">{(props) => <LoginScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="Register">{(props) => <RegisterScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="Home">{(props) => <HomeScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="Chat">{(props) => <ChatScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="Profile">{(props) => <ProfileScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="Menu">{(props) => <MenuScreen {...props} db={db} />}</Stack.Screen>
        <Stack.Screen name="About">{(props) => <AboutScreen {...props} db={db} />}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
