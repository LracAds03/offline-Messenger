import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MenuScreen({ navigation, route }) {

  const currentUser = route.params?.currentUser || null;
  const db = route.params?.db; // <-- keep DB instance

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {

            // 🧹 Remove stored session
            await AsyncStorage.removeItem("loggedUser");

            // 🔥 Reset navigation history and return db to Login
            navigation.reset({
              index: 0,
              routes: [{ name: "Login", params: { db } }],
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📌 Menu</Text>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Profile", { currentUser, db })}
      >
        <Text style={styles.text}>👤 Update Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("About")}
      >
        <Text style={styles.text}>ℹ️ About App</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Text style={[styles.text, { color: "red" }]}>🔐 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFFFFA"
  },

  title: { 
    fontSize: 28, 
    fontWeight: "900", 
    marginBottom: 25, 
    color: "#003E36" 
  },

  item: {
    paddingVertical: 15,
    width: "70%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#AACCCC",
    marginBottom: 12,
  },

  text: { fontSize: 18 },
});
