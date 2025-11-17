import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform
} from 'react-native';

export default function LoginScreen({ navigation, db }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);

    try {
      const user = await db.getFirstAsync(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username.trim().toLowerCase(), password]
      );

      if (user) {
        Alert.alert('Success', `Welcome back, ${user.fullName}!`);
        navigation.replace("Home", { currentUser: user });
      } else {
        Alert.alert('Error', 'Invalid username or password');
      }

    } catch (error) {
      Alert.alert('Error', 'Login failed.');
      console.log("Login Error:", error);
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>

        <Text style={styles.logo}>💬</Text>
        <Text style={styles.title}>Offline Messenger</Text>
        <Text style={styles.subtitle}>Welcome back 👋</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// -------------------- New Bubble UI Styling --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FFFE" },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    alignItems: "center",
  },

  logo: {
    fontSize: 50,
    marginBottom: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#00A8E8",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    marginBottom: 25,
  },

  input: {
    width: "90%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#A0FFE6",
    borderRadius: 30,
    paddingHorizontal: 18,
    marginBottom: 15,
    fontSize: 15,
  },

  button: {
    width: "90%",
    backgroundColor: "#00F5C6",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    marginTop: 10,
    elevation: 3,
  },

  buttonDisabled: {
    backgroundColor: "#9DEADB",
  },

  buttonText: {
    color: "#003E32",
    fontSize: 18,
    fontWeight: "700",
  },

  linkContainer: { marginTop: 20 },

  linkText: { color: "#444", fontSize: 15 },

  linkBold: {
    color: "#00A8E8",
    fontWeight: "900",
  },
});
