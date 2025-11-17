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
  const currentUser = route.params?.currentUser || null;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigation.replace("Login");
      return;
    }

    const unsub = navigation.addListener("focus", () => {
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
             WHERE (senderId=? AND receiverId=?) OR (senderId=? AND receiverId=?)
             ORDER BY timestamp DESC LIMIT 1`,
            [currentUser.id, u.id, u.id, currentUser.id]
          );

          const unread = await db.getFirstAsync(
            `SELECT COUNT(*) AS count FROM messages WHERE senderId=? AND receiverId=? AND isRead=0`,
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const openChat = (user) => navigation.navigate("Chat", { currentUser, chatUser: user });
  const openProfile = () => navigation.navigate("Profile", { currentUser });

  const logout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => navigation.replace("Login") },
    ]);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.chatCard} onPress={() => openChat(item)} activeOpacity={0.8}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{item.fullName.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{item.fullName}</Text>
          {item.lastMessageTime && <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>}
        </View>

        <View style={styles.rowBottom}>
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
        <ActivityIndicator size="large" color="#00C9A7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* 🟢 Soft Bubble Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openProfile} activeOpacity={0.7}>
          {currentUser?.profilePhoto ? (
            <Image source={{ uri: currentUser.profilePhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerLetter}>{currentUser.fullName[0]}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View>
          <Text style={styles.headerSub}>👋 Welcome</Text>
          <Text style={styles.headerTitle}>{currentUser.fullName}</Text>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(i) => i.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Nobody here 😅</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFFFFA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 18,
    paddingHorizontal: 18,
    backgroundColor: "#00E6C2",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
  },

  headerAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerLetter: { color: "#00A38C", fontWeight: "800", fontSize: 22 },
  headerSub: { color: "#003E36", fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#003E36" },
  logoutButton: { marginLeft: "auto" },
  logoutText: { fontSize: 28 },

  chatCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 22,
    elevation: 3,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#00C9A7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarLetter: { color: "#fff", fontWeight: "900", fontSize: 18 },
  rowTop: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", color: "#003E36" },
  time: { fontSize: 12, color: "#777" },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  preview: { flex: 1, color: "#666" },

  badge: {
    backgroundColor: "#00C9A7",
    minWidth: 24,
    height: 24,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  badgeText: { fontWeight: "800", color: "#fff", fontSize: 12 },
  empty: { textAlign: "center", marginTop: 35, fontSize: 16, color: "#888" },
});
