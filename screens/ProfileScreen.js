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
  const [profilePhoto, setProfilePhoto] = useState(
    currentUser.profilePhoto || null
  );
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!res.canceled) setProfilePhoto(res.assets[0].uri);
    } catch (err) {
      Alert.alert("Error", "Could not open gallery");
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
    } catch (err) {
      Alert.alert("Error", "Could not open camera");
    }
  };

  const saveProfilePhoto = async () => {
    setLoading(true);
    try {
      await db.runAsync("UPDATE users SET profilePhoto = ? WHERE id = ?", [
        profilePhoto || null,
        currentUser.id,
      ]);
      const updated = await db.getFirstAsync(
        "SELECT * FROM users WHERE id = ?",
        [currentUser.id]
      );
      Alert.alert("Success", "Profile picture updated!");
      navigation.replace("Home", { currentUser: updated });
    } catch (err) {
      Alert.alert("Error", "Could not save profile photo.");
    } finally {
      setLoading(false);
    }
  };

  const saveFullName = async () => {
    if (!fullName.trim()) return Alert.alert("Error", "Name cannot be empty");

    setLoading(true);
    try {
      await db.runAsync("UPDATE users SET fullName = ? WHERE id = ?", [
        fullName.trim(),
        currentUser.id,
      ]);
      const updated = await db.getFirstAsync(
        "SELECT * FROM users WHERE id = ?",
        [currentUser.id]
      );
      Alert.alert("Success", "Name updated");
      navigation.replace("Home", { currentUser: updated });
    } catch (err) {
      Alert.alert("Error", "Could not update name");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!oldPass || !newPass)
      return Alert.alert("Error", "Please fill both fields");
    if (oldPass !== currentUser.password)
      return Alert.alert("Error", "Old password is incorrect");
    if (newPass.length < 4)
      return Alert.alert("Error", "Password must be at least 4 characters");

    setLoading(true);
    try {
      await db.runAsync("UPDATE users SET password = ? WHERE id = ?", [
        newPass,
        currentUser.id,
      ]);
      const updated = await db.getFirstAsync(
        "SELECT * FROM users WHERE id = ?",
        [currentUser.id]
      );
      Alert.alert("Success", "Password updated!");
      setOldPass("");
      setNewPass("");
      navigation.replace("Home", { currentUser: updated });
    } catch (err) {
      Alert.alert("Error", "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = () => {
    Alert.alert("Confirm Delete", "Delete your account permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await db.runAsync(
              "DELETE FROM messages WHERE senderId = ? OR receiverId = ?",
              [currentUser.id, currentUser.id]
            );
            await db.runAsync("DELETE FROM users WHERE id = ?", [
              currentUser.id,
            ]);

            Alert.alert("Deleted", "Your account has been deleted");
            navigation.replace("Login");
          } catch (err) {
            Alert.alert("Error", "Could not delete account.");
          } finally {
            setLoading(false);
          }
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Profile</Text>

        {/* Profile Photo */}
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
              <Text style={styles.photoBtnText}>📁 Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={takeSelfie}>
              <Text style={styles.photoBtnText}>📸 Selfie</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfilePhoto}>
            <Text style={styles.saveText}>Save Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveFullName}>
            <Text style={styles.saveText}>Update Name</Text>
          </TouchableOpacity>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Old password"
            secureTextEntry
            value={oldPass}
            onChangeText={setOldPass}
          />
          <TextInput
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
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
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },

  // FULL CENTER CONTENT (Y + X centered)
  centerContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 25,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  backText: { 
    fontSize: 18, 
    color: "#007AFF",
    fontWeight: "500"
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 25,
    textAlign: "center",
  },

  /** PROFILE PHOTO SECTION **/
  photoSection: {
    alignItems: "center",
    marginBottom: 35,
  },

  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#007AFF",
    backgroundColor: "#eee",
  },

  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#bbb",
    justifyContent: "center",
    alignItems: "center",
  },

  photoLetter: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "700",
  },

  photoButtons: {
    flexDirection: "row",
    marginTop: 15,
  },

  photoBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginHorizontal: 6,
    elevation: 2,
  },

  photoBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  saveBtn: {
    backgroundColor: "#34C759",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    marginTop: 18,
    elevation: 2,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },

  /** INPUT SECTIONS **/
  section: {
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },

  input: {
    width: "92%",
    padding: 14,
    fontSize: 16,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    backgroundColor: "#fafafa",
    marginBottom: 10,
  },

  /** DELETE BUTTON **/
  deleteBtn: {
    backgroundColor: "red",
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 12,
    marginTop: 15,
    elevation: 3,
  },

  deleteText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
});
