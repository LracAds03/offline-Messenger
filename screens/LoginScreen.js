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
        <Text style={styles.title}>Offline Messenger</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

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

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  content: { flex:1, justifyContent:'center', padding:20 },
  title: { fontSize:32, fontWeight:'bold', color:'#007AFF', textAlign:'center' },
  subtitle: { textAlign:'center', color:'#666', marginBottom:20 },
  input: {
    height:50, borderColor:'#ddd', borderWidth:1,
    borderRadius:8, paddingHorizontal:15, marginBottom:15
  },
  button: {
    backgroundColor:'#007AFF', height:50, justifyContent:'center',
    alignItems:'center', borderRadius:8
  },
  buttonDisabled:{ backgroundColor:'#999' },
  buttonText:{ color:'#fff', fontSize:18, fontWeight:'600' },
  linkContainer:{ marginTop:20, alignItems:'center' },
  linkText:{ color:'#666' },
  linkBold:{ color:'#007AFF', fontWeight:'bold' }
});
