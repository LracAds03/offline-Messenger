// screens/ProfileScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen({ navigation, route, db }) {
  const { currentUser } = route.params;

  const [fullName, setFullName] = useState(currentUser.fullName || "");
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto || null);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const chooseImageMethod = () => {
    Alert.alert("Change Photo", "Select option", [
      { text: "📁 Gallery", onPress: pickImage },
      { text: "📷 Take Selfie", onPress: takeSelfie },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!res.canceled) setProfilePhoto(res.assets[0].uri);
    } catch {
      Alert.alert("Error", "Gallery not available");
    }
  };

  const takeSelfie = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!res.canceled) setProfilePhoto(res.assets[0].uri);
    } catch {
      Alert.alert("Error", "Camera failed");
    }
  };

  const saveProfilePhoto = async () => {
    if (!profilePhoto) return Alert.alert("No Image", "Please select an image first.");

    await db.runAsync("UPDATE users SET profilePhoto = ? WHERE id = ?", [
      profilePhoto,
      currentUser.id,
    ]);

    const updated = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
      currentUser.id,
    ]);

    Alert.alert("Success", "Profile updated!");
    navigation.replace("Profile", { currentUser: updated });
  };

  const saveFullName = async () => {
    if (!fullName.trim()) return Alert.alert("Error", "Name cannot be empty");

    await db.runAsync("UPDATE users SET fullName = ? WHERE id = ?", [
      fullName.trim(),
      currentUser.id,
    ]);

    const updated = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
      currentUser.id,
    ]);

    Alert.alert("Updated", "Full name saved!");
    navigation.replace("Profile", { currentUser: updated });
  };

  const changePassword = async () => {
    if (!oldPass || !newPass) return Alert.alert("Error", "Fields cannot be empty");
    if (oldPass !== currentUser.password) return Alert.alert("Error", "Old password incorrect");
    if (newPass.length < 4) return Alert.alert("Error", "Min 4 characters");

    await db.runAsync("UPDATE users SET password = ? WHERE id = ?", [newPass, currentUser.id]);

    Alert.alert("Success", "Password updated!");
    setOldPass("");
    setNewPass("");
  };

  const deleteAccount = () => {
    Alert.alert("Delete Account", "This action is permanent!", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db.runAsync("DELETE FROM messages WHERE senderId=? OR receiverId=?", [
            currentUser.id,
            currentUser.id,
          ]);
          await db.runAsync("DELETE FROM users WHERE id=?", [currentUser.id]);
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.center}>
        
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>⬅</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Profile</Text>

        {/* Photo */}
        <TouchableOpacity onPress={chooseImageMethod}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoLetter}>{currentUser.fullName[0]}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={saveProfilePhoto}>
          <Text style={styles.actionText}>Save Photo</Text>
        </TouchableOpacity>

        {/* Full Name */}
        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          <TouchableOpacity style={styles.smallBtn} onPress={saveFullName}>
            <Text style={styles.smallBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <Text style={styles.label}>Change Password</Text>
          <TextInput placeholder="Old password" secureTextEntry style={styles.input} value={oldPass} onChangeText={setOldPass} />
          <TextInput placeholder="New password" secureTextEntry style={styles.input} value={newPass} onChangeText={setNewPass} />
          <TouchableOpacity style={styles.smallBtn} onPress={changePassword}>
            <Text style={styles.smallBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={deleteAccount}>
          <Text style={styles.deleteText}>Delete Account ❌</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFFFFA" },

  center: {
    alignItems: "center",
    paddingBottom: 80,
    paddingTop: 100,
  },

  backBtn: { position: "absolute", top: 50, left: 15 },
  backIcon: { fontSize: 26, fontWeight: "bold", color: "#00A38C" },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#00BFA5",
    textShadowColor: "#A8FFF2",
    textShadowRadius: 12,
    marginBottom: 20,
  },

  photo: {
    width: 145,
    height: 145,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#00E6C2",
  },

  photoPlaceholder: {
    width: 145,
    height: 145,
    borderRadius: 75,
    backgroundColor: "#BFF8E6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#00E6C2",
  },

  photoLetter: { fontSize: 60, fontWeight: "900", color: "#008C72" },

  actionBtn: {
    backgroundColor: "#00C9A7",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 10,
    elevation: 2,
  },

  actionText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  card: {
    width: "87%",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 18,
    marginTop: 25,
    elevation: 3,
  },

  label: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#004D45" },

  input: {
    borderWidth: 1,
    borderColor: "#C9FFF0",
    backgroundColor: "#F6FFFC",
    borderRadius: 15,
    padding: 14,
    marginBottom: 15,
    fontSize: 15,
  },

  smallBtn: {
    backgroundColor: "#00C9A7",
    paddingVertical: 10,
    width: 85,
    borderRadius: 20,
    alignSelf: "flex-end",
  },

  smallBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  deleteBtn: {
    marginTop: 35,
    backgroundColor: "#FF4D4D",
    paddingVertical: 14,
    width: "80%",
    borderRadius: 25,
  },

  deleteText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
});
