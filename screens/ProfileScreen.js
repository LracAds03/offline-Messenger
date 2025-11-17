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

  // ----------------------------------------------------------
  // 📌 New: When clicking "Save Photo" → ask Camera or Gallery
  // ----------------------------------------------------------
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
      Alert.alert("Error", "Failed to select from gallery");
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
      Alert.alert("Error", "Camera not available");
    }
  };

  const saveProfilePhoto = async () => {
    if (!profilePhoto) return Alert.alert("No Image", "Please take or select a photo first.");

    await db.runAsync("UPDATE users SET profilePhoto = ? WHERE id = ?", [
      profilePhoto,
      currentUser.id,
    ]);

    const updated = await db.getFirstAsync("SELECT * FROM users WHERE id = ?", [
      currentUser.id,
    ]);

    Alert.alert("Success", "Profile picture updated!");
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

    Alert.alert("Success", "Name updated");
    navigation.replace("Profile", { currentUser: updated });
  };

  const changePassword = async () => {
    if (!oldPass || !newPass)
      return Alert.alert("Error", "Please fill both fields");
    if (oldPass !== currentUser.password)
      return Alert.alert("Error", "Old password incorrect");
    if (newPass.length < 4)
      return Alert.alert("Error", "Password too short");

    await db.runAsync("UPDATE users SET password = ? WHERE id = ?", [
      newPass,
      currentUser.id,
    ]);

    Alert.alert("Success", "Password updated");
    setOldPass("");
    setNewPass("");
  };

  const deleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await db.runAsync(
            "DELETE FROM messages WHERE senderId = ? OR receiverId = ?",
            [currentUser.id, currentUser.id]
          );
          await db.runAsync("DELETE FROM users WHERE id = ?", [currentUser.id]);
          Alert.alert("Deleted", "Your account has been removed");
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.centerContent}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Profile</Text>

        {/* Profile Image */}
        <TouchableOpacity onPress={chooseImageMethod}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoLetter}>{currentUser.fullName[0].toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={saveProfilePhoto}>
          <Text style={styles.saveText}>Save Photo</Text>
        </TouchableOpacity>

        {/* Name Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          <TouchableOpacity style={styles.saveBtn} onPress={saveFullName}>
            <Text style={styles.saveText}>Update Name</Text>
          </TouchableOpacity>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput placeholder="Old password" secureTextEntry value={oldPass} onChangeText={setOldPass} style={styles.input} />
          <TextInput placeholder="New password" secureTextEntry value={newPass} onChangeText={setNewPass} style={styles.input} />
          <TouchableOpacity style={styles.saveBtn} onPress={changePassword}>
            <Text style={styles.saveText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={deleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ------------------- UI Improvement (only styling changed) -------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  centerContent: {
    alignItems: "center",
    paddingBottom: 50,
    paddingTop: 110,
  },

  backButton: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 999,
  },
  backText: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#007AFF",
    marginBottom: 20,
  },

  photo: {
    width: 130,
    height: 130,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#007AFF",
    marginBottom: 10,
    backgroundColor: "#E4EAF2",
  },

  photoPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: "#DCE4ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },

  photoLetter: {
    fontSize: 52,
    fontWeight: "900",
    color: "#007AFF",
  },

  // Save button (for photo + name + password)
  saveBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },

  /** Profile Card Sections */
  section: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D4D6DB",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
    fontSize: 15,
  },

  deleteBtn: {
    backgroundColor: "#FF3B30",
    width: "80%",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 35,
    elevation: 4,
  },

  deleteText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

