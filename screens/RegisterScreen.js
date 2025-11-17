// screens/RegisterScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function RegisterScreen({ navigation, db }) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    profilePhoto: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const updateForm = (field, value) =>
    setFormData({ ...formData, [field]: value });

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled)
      updateForm("profilePhoto", result.assets[0].uri);
  };

  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled)
      updateForm("profilePhoto", result.assets[0].uri);
  };

  const handleRegister = async () => {
    const { fullName, username, password, confirmPassword } = formData;

    if (!fullName.trim()) return Alert.alert("Error", "Enter your full name.");
    if (!username.trim()) return Alert.alert("Error", "Enter a username.");
    if (username.trim().length < 3) return Alert.alert("Error", "Username too short.");
    if (password.length < 4) return Alert.alert("Error", "Password too short.");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match.");

    setIsLoading(true);

    try {
      const exists = await db.getFirstAsync(
        "SELECT id FROM users WHERE username = ?",
        [username.trim().toLowerCase()]
      );

      if (exists) {
        Alert.alert("Error", "Username already exists.");
        setIsLoading(false);
        return;
      }

      await db.runAsync(
        "INSERT INTO users (username, password, fullName, profilePhoto) VALUES (?, ?, ?, ?)",
        [
          username.trim().toLowerCase(),
          password,
          fullName.trim(),
          formData.profilePhoto || null,
        ]
      );

      Alert.alert("Success", "Account created!", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Registration failed.");
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the community 💬</Text>

        {/* Profile Photo */}
        <TouchableOpacity onPress={() => {
            Alert.alert("Select Option", "", [
              { text: "📁 Gallery", onPress: pickImageFromGallery },
              { text: "📸 Take Selfie", onPress: takeSelfie },
              { text: "Cancel", style: "cancel" }
            ]);
        }}>
          {formData.profilePhoto ? (
            <Image source={{ uri: formData.profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Inputs */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={formData.fullName}
          onChangeText={(t) => updateForm("fullName", t)}
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={formData.username}
          autoCapitalize="none"
          onChangeText={(t) => updateForm("username", t)}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(t) => updateForm("password", t)}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(t) => updateForm("confirmPassword", t)}
        />

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Creating..." : "Register"}
          </Text>
        </TouchableOpacity>

        {/* Link */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.bold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------- Styling ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FFFE" },

  content: {
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: "center",
    paddingHorizontal: 25,
  },

  logo: {
    fontSize: 50,
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#00A8E8",
  },

  subtitle: {
    fontSize: 15,
    color: "#555",
    marginBottom: 25,
  },

  photo: {
    width: 120,
    height: 120,
    borderRadius: 70,
    borderColor: "#00F5C6",
    borderWidth: 3,
    marginBottom: 15,
  },

  photoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#DFFEF6",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  photoEmoji: { fontSize: 38 },

  input: {
    width: "90%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#A0FFE6",
    marginBottom: 15,
    fontSize: 15,
  },

  button: {
    width: "90%",
    height: 55,
    backgroundColor: "#00F5C6",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    marginTop: 10,
    elevation: 5,
  },

  disabled: {
    backgroundColor: "#99E6D7",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003E32",
  },

  link: {
    marginTop: 20,
    color: "#444",
  },

  bold: {
    color: "#00A8E8",
    fontWeight: "900",
  },
});
