// App.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createDatabase } from './database/messengerApp';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [db, setDb] = useState(null);

  // Initialize SQLite DB
  useEffect(() => {
    async function init() {
      try {
        const database = await createDatabase();
        setDb(database);
      } catch (error) {
        console.log("DB Init Error:", error);
      }
    }
    init();
  }, []);

  // Loading Screen while DB initializes
  if (!db) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* LOGIN */}
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} db={db} />}
        </Stack.Screen>

        {/* REGISTER */}
        <Stack.Screen name="Register">
          {(props) => <RegisterScreen {...props} db={db} />}
        </Stack.Screen>

        {/* HOME SCREEN */}
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} db={db} />}
        </Stack.Screen>

        {/* CHAT WINDOW */}
        <Stack.Screen name="Chat">
          {(props) => <ChatScreen {...props} db={db} />}
        </Stack.Screen>

        {/* PROFILE MANAGEMENT */}
        <Stack.Screen name="Profile">
          {(props) => <ProfileScreen {...props} db={db} />}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}
