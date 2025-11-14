import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createDatabase } from './database/messengerApp';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    async function init() {
      const database = await createDatabase();
      setDb(database);
    }
    init();
  }, []);

  if (!db) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} db={db} />}
        </Stack.Screen>

        <Stack.Screen name="Register">
          {(props) => <RegisterScreen {...props} db={db} />}
        </Stack.Screen>

        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} db={db} />}
        </Stack.Screen>

        <Stack.Screen name="Chat">
          {(props) => <ChatScreen {...props} db={db} />}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
}
