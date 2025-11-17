// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

export default function HomeScreen({ navigation, route, db }) {
  // route.params.currentUser is set when navigating from Login/Register or replaced
  const currentUser = route.params?.currentUser || null;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // If currentUser is not provided, navigate back to Login
    if (!currentUser) {
      navigation.replace("Login");
      return;
    }

    const unsub = navigation.addListener("focus", () => {
      // reload every time screen is focused (so profile updates reflect)
      loadUsers();
    });

    loadUsers();
    return unsub;
  }, [navigation, currentUser]);

  const loadUsers = async () => {
    try {
      const list = await db.getAllAsync(
        `SELECT id, username, fullName, profilePhoto
         FROM users
         WHERE id != ?
         ORDER BY fullName`,
        [currentUser.id]
      );

      const enhanced = await Promise.all(
        list.map(async (u) => {
          const last = await db.getFirstAsync(
            `SELECT message, timestamp, senderId
             FROM messages
             WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
             ORDER BY timestamp DESC LIMIT 1`,
            [currentUser.id, u.id, u.id, currentUser.id]
          );
          const unread = await db.getFirstAsync(
            `SELECT COUNT(*) AS count FROM messages WHERE senderId = ? AND receiverId = ? AND isRead = 0`,
            [u.id, currentUser.id]
          );

          return {
            ...u,
            lastMessage: last?.message || "No messages yet",
            lastMessageTime: last?.timestamp || null,
            isYou: last?.senderId === currentUser.id,
            unreadCount: unread?.count || 0,
          };
        })
      );

      setUsers(enhanced);
    } catch (err) {
      console.log("Home loadUsers error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const openChat = (user) => {
    navigation.navigate("Chat", { currentUser, chatUser: user });
  };

  const openProfile = () => {
    navigation.navigate("Profile", { currentUser });
  };

  const logout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => navigation.replace("Login"),
      },
    ]);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const days = Math.floor(h / 24);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return days === 1 ? "Yesterday" : `${days}d ago`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.userRow} onPress={() => openChat(item)}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={styles.name}>{item.fullName}</Text>
          {item.lastMessageTime && (
            <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          )}
        </View>

        <View style={styles.infoBottom}>
          <Text numberOfLines={1} style={styles.preview}>
            {item.isYou ? "You: " : ""}
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openProfile}>
          {currentUser.profilePhoto ? (
            <Image
              source={{ uri: currentUser.profilePhoto }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerLetter}>
                {currentUser.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>          
          <Text style={styles.subtitle}>Welcome, {currentUser.fullName}</Text>
          <Text style={styles.title}>Messages</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(i) => i.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: "#777" }}>No other users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  headerLetter: { color: "#007AFF", fontWeight: "700", fontSize: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#fff", opacity: 0.9, marginTop: 2 },

  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  logoutText: {
    color: "#ffffff", // ← FIXED!
    fontSize: 15,
    fontWeight: "700",
  },

  userRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarLetter: { color: "#fff", fontWeight: "700", fontSize: 18 },

  info: { flex: 1 },
  infoTop: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontWeight: "700", fontSize: 16 },
  time: { color: "#888", fontSize: 12 },

  infoBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  preview: { color: "#666", flex: 1 },

  badge: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
