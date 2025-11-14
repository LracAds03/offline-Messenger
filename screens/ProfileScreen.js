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
import { useSQLiteContext } from "expo-sqlite";

export default function ProfileScreen({ currentUser, onBack }) {
  const db = useSQLiteContext();

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const saveProfilePhoto = async () => {
    try {
      await db.runAsync(
        "UPDATE users SET profilePhoto = ? WHERE id = ?",
        [profilePhoto, currentUser.id]
      );
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      Alert.alert("Error", "Could not update profile picture.");
    }
  };

  const changePassword = async () => {
    if (!oldPass || !newPass) {
      return Alert.alert("Error", "Please fill all fields");
    }

    if (oldPass !== currentUser.password) {
      return Alert.alert("Error", "Old password is incorrect");
    }

    if (newPass.length < 4) {
      return Alert.alert("Error", "Password must be at least 4 characters");
    }

    try {
      await db.runAsync(
        "UPDATE users SET password = ? WHERE id = ?",
        [newPass, currentUser.id]
      );

      Alert.alert("Success", "Password updated!");
      setOldPass("");
      setNewPass("");
    } catch (error) {
      Alert.alert("Error", "Could not update password.");
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to permanently delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync(
                "DELETE FROM messages WHERE senderId = ? OR receiverId = ?",
                [currentUser.id, currentUser.id]
              );

              await db.runAsync("DELETE FROM users WHERE id = ?", [
                currentUser.id,
              ]);

              Alert.alert("Account Deleted", "Your account has been removed.");

              onBack(); // return to home/login
            } catch (error) {
              Alert.alert("Error", "Could not delete account.");
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Profile</Text>

        <View style={styles.photoSection}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoLetter}>
                {currentUser.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.btnText}>📁 Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoBtn} onPress={takeSelfie}>
              <Text style={styles.btnText}>📸 Selfie</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfilePhoto}>
            <Text style={styles.saveText}>Save Profile Picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Old Password"
            value={oldPass}
            onChangeText={setOldPass}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={newPass}
            onChangeText={setNewPass}
            secureTextEntry
          />

          <TouchableOpacity style={styles.saveBtn} onPress={changePassword}>
            <Text style={styles.saveText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={deleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },

  backButton: { marginBottom: 10 },
  backText: { fontSize: 18, color: "#007AFF" },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#007AFF",
  },

  photoSection: { alignItems: "center", marginBottom: 30 },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  photoLetter: { fontSize: 50, color: "#fff" },

  photoButtons: { flexDirection: "row", marginTop: 15 },
  photoBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },

  saveBtn: {
    backgroundColor: "#34C759",
    padding: 12,
    marginTop: 15,
    borderRadius: 8,
  },
  saveText: { color: "#fff", textAlign: "center", fontWeight: "600" },

  section: { marginVertical: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  deleteBtn: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  deleteText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
