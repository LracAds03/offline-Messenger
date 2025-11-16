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
      // Request permissions (only prompts if not already granted)
      try {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const updateForm = (field, value) => setFormData({ ...formData, [field]: value });

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled) updateForm("profilePhoto", result.assets[0].uri);
    } catch (err) {
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const takeSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (!result.canceled) updateForm("profilePhoto", result.assets[0].uri);
    } catch (err) {
      Alert.alert("Error", "Could not open camera.");
    }
  };

  const handleRegister = async () => {
    const { fullName, username, password, confirmPassword, profilePhoto } = formData;

    if (!fullName.trim()) return Alert.alert("Error", "Please enter your full name.");
    if (!username.trim()) return Alert.alert("Error", "Please enter a username.");
    if (username.trim().length < 3) return Alert.alert("Error", "Username must be at least 3 characters.");
    if (!password) return Alert.alert("Error", "Please enter a password.");
    if (password.length < 4) return Alert.alert("Error", "Password must be at least 4 characters.");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match.");

    setIsLoading(true);
    try {
      const existing = await db.getFirstAsync("SELECT id FROM users WHERE username = ?", [
        username.trim().toLowerCase(),
      ]);
      if (existing) {
        Alert.alert("Error", "Username already exists. Pick another.");
        setIsLoading(false);
        return;
      }

      await db.runAsync(
        "INSERT INTO users (username, password, fullName, profilePhoto) VALUES (?, ?, ?, ?)",
        [username.trim().toLowerCase(), password, fullName.trim(), profilePhoto || null]
      );

      Alert.alert("Success", "Account created! You can login now.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (err) {
      console.log("Register Error:", err);
      Alert.alert("Error", "Failed to create account. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to start messaging</Text>

          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Profile Photo (optional)</Text>
            <View style={styles.photoContainer}>
              {formData.profilePhoto ? (
                <Image source={{ uri: formData.profilePhoto }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoEmoji}>📷</Text>
                </View>
              )}
            </View>

            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImageFromGallery} disabled={isLoading}>
                <Text style={styles.photoBtnText}>📁 Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={takeSelfie} disabled={isLoading}>
                <Text style={styles.photoBtnText}>📸 Selfie</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput style={styles.input} placeholder="Full Name" value={formData.fullName} onChangeText={(t) => updateForm("fullName", t)} />
          <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={formData.username} onChangeText={(t) => updateForm("username", t)} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={formData.password} onChangeText={(t) => updateForm("password", t)} />
          <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={formData.confirmPassword} onChangeText={(t) => updateForm("confirmPassword", t)} />

          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? "Creating account..." : "Register"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  scrollContent: { flexGrow:1 },
  content: { flex:1, padding:20, justifyContent:'center' },
  title: { fontSize:28, fontWeight:'700', color:'#007AFF', textAlign:'center', marginBottom:8 },
  subtitle: { textAlign:'center', color:'#666', marginBottom:18 },

  photoSection: { alignItems:'center', marginBottom:18, padding:12, backgroundColor:'#fafafa', borderRadius:10 },
  photoLabel: { color:'#666', marginBottom:12 },
  photoContainer: { marginBottom:10 },
  photo: { width:110, height:110, borderRadius:55, borderWidth:3, borderColor:'#007AFF' },
  photoPlaceholder: { width:110, height:110, borderRadius:55, backgroundColor:'#ddd', justifyContent:'center', alignItems:'center' },
  photoEmoji: { fontSize:36 },
  photoButtons: { flexDirection:'row', marginTop:8 },
  photoBtn: { backgroundColor:'#007AFF', paddingHorizontal:14, paddingVertical:8, marginHorizontal:6, borderRadius:8 },
  photoBtnText: { color:'#fff', fontWeight:'600' },

  input: { height:50, borderColor:'#ddd', borderWidth:1, borderRadius:8, paddingHorizontal:14, marginBottom:12 },
  button: { backgroundColor:'#007AFF', height:50, borderRadius:8, justifyContent:'center', alignItems:'center', marginTop:8 },
  buttonDisabled: { backgroundColor:'#999' },
  buttonText: { color:'#fff', fontSize:16, fontWeight:'600' },

  link: { marginTop:16, alignItems:'center' },
  linkText: { color:'#666' },
  linkBold: { color:'#007AFF', fontWeight:'700' },
});
