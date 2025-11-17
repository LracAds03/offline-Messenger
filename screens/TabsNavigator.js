import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";

const Tab = createBottomTabNavigator();

export default function TabsNavigator({ route }) {
  const { currentUser, db } = route.params;

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Chats" 
        component={HomeScreen} 
        initialParams={{ currentUser, db }}
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuScreen} 
        initialParams={{ currentUser, db }}
      />
    </Tab.Navigator>
  );
}
