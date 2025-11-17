import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from "react-native";

export default function MenuScreen({ navigation, route }) {
  const { currentUser } = route.params;

  const logout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      { text: "Logout", onPress: () => navigation.replace("Login") }
    ]);
  };

  return (
    <View style={styles.container}>
      {currentUser.profilePhoto ? (
        <Image source={{ uri: currentUser.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{currentUser.fullName[0].toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.name}>{currentUser.fullName}</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate("Profile", { currentUser })}
      >
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#007AFF", justifyContent: "center", alignItems: "center"
  },
  avatarLetter: { fontSize: 40, color: "#fff", fontWeight: "700" },
  name: { fontSize: 22, marginVertical: 10 },
  button: {
    width: 200, padding: 12, backgroundColor: "#007AFF",
    marginTop: 10, borderRadius: 10
  },
  buttonText: { textAlign: "center", fontSize: 18, color: "#fff" }
});
