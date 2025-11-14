import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen({ navigation, db }) {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    profilePhoto: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Request camera + gallery permissions
  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const updateForm = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Pick from gallery
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        updateForm("profilePhoto", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take selfie
  const takeSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        updateForm("profilePhoto", result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRegister = async () => {
    const { fullName, username, password, confirmPassword, profilePhoto } = formData;

    // Validation
    if (!fullName.trim()) return Alert.alert("Error", "Please enter full name");
    if (!username.trim()) return Alert.alert("Error", "Please enter username");
    if (username.length < 3) return Alert.alert("Error", "Username must be at least 3 letters");
    if (!password) return Alert.alert("Error", "Please enter password");
    if (password.length < 4) return Alert.alert("Error", "Password must be at least 4 characters");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");

    setIsLoading(true);

    try {
      const existingUser = await db.getFirstAsync(
        "SELECT id FROM users WHERE username = ?",
        [username.trim().toLowerCase()]
      );

      if (existingUser) {
        setIsLoading(false);
        return Alert.alert("Error", "Username already exists.");
      }

      await db.runAsync(
        "INSERT INTO users (username, password, fullName, profilePhoto) VALUES (?, ?, ?, ?)",
        [
          username.trim().toLowerCase(),
          password,
          fullName.trim(),
          profilePhoto || null
        ]
      );

      Alert.alert(
        "Success",
        "Account created successfully!",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );

    } catch (error) {
      console.log("Registration Error:", error);
      Alert.alert("Error", "Failed to create account. Try again.");
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to start messaging</Text>

          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Profile Photo (Optional)</Text>

            <View style={styles.photoContainer}>
              {formData.profilePhoto ? (
                <Image
                  source={{ uri: formData.profilePhoto }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                </View>
              )}
            </View>

            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={pickImageFromGallery}
                disabled={isLoading}
              >
                <Text style={styles.photoButtonText}>📁 Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoButton}
                onPress={takeSelfie}
                disabled={isLoading}
              >
                <Text style={styles.photoButtonText}>📸 Selfie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Inputs */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.fullName}
            onChangeText={(t) => updateForm("fullName", t)}
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={formData.username}
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
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Creating account..." : "Register"}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.linkContainer}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 8, color: "#007AFF" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: 20 },

  photoSection: { alignItems: "center", padding: 15, backgroundColor: "#f9f9f9", borderRadius: 10, marginBottom: 20 },
  photoLabel: { fontSize: 14, color: "#666", marginBottom: 15 },
  photoContainer: { marginBottom: 15 },

  profilePhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: "#007AFF" },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center" },
  photoPlaceholderText: { fontSize: 40 },

  photoButtons: { flexDirection: "row", gap: 10 },
  photoButton: { backgroundColor: "#007AFF", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  photoButtonText: { color: "#fff", fontWeight: "600" },

  input: {
    height: 50, borderColor: "#ddd", borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 15, marginBottom: 15, fontSize: 16
  },

  button: {
    backgroundColor: "#007AFF", height: 50,
    borderRadius: 8, justifyContent: "center", alignItems: "center"
  },
  buttonDisabled: { backgroundColor: "#999" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 18 },

  linkContainer: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#666" },
  linkBold: { color: "#007AFF", fontWeight: "600" },
});
