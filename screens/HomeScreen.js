import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';

export default function HomeScreen({ navigation, route, db }) {
  const { currentUser } = route.params;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

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
        list.map(async (user) => {
          const lastMessage = await db.getFirstAsync(
            `SELECT message, timestamp, senderId
             FROM messages
             WHERE (senderId = ? AND receiverId = ?)
                OR (senderId = ? AND receiverId = ?)
             ORDER BY timestamp DESC
             LIMIT 1`,
            [currentUser.id, user.id, user.id, currentUser.id]
          );

          const unread = await db.getFirstAsync(
            `SELECT COUNT(*) AS count 
             FROM messages
             WHERE senderId = ? AND receiverId = ? AND isRead = 0`,
            [user.id, currentUser.id]
          );

          return {
            ...user,
            lastMessage: lastMessage?.message || "No messages yet",
            lastMessageTime: lastMessage?.timestamp || null,
            unreadCount: unread?.count || 0,
            isYou: lastMessage?.senderId === currentUser.id,
          };
        })
      );

      setUsers(enhanced);
    } catch (error) {
      console.log("Load users error:", error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return days === 1 ? "Yesterday" : `${days}d ago`;
  };

  const openChat = (user) => {
    navigation.navigate("Chat", { currentUser, chatUser: user });
  };

  const logout = () => {
    navigation.replace("Login");
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => openChat(item)}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatarImg}>
          <Text style={styles.avatarText}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.fullName}</Text>

          {item.lastMessageTime && (
            <Text style={styles.timestamp}>{formatTime(item.lastMessageTime)}</Text>
          )}
        </View>

        <View style={styles.messageRow}>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {item.isYou ? "You: " : ""}{item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>Welcome, {currentUser.fullName}!</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyText}>No other users yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  loadingScreen: {
    flex: 1, justifyContent: "center", alignItems: "center"
  },

  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28, color: "#fff", fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14, color: "#fff", opacity: 0.85,
  },
  logoutButton: {
    position: "absolute", right: 20, top: 50,
  },
  logoutText: {
    color: "#fff", fontWeight: "600",
  },

  userItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  avatarImg: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#007AFF", justifyContent: "center",
    alignItems: "center", marginRight: 12,
  },
  avatarText: {
    color: "#fff", fontSize: 22, fontWeight: "700",
  },

  userInfo: { flex: 1 },
  userHeader: { flexDirection: "row", justifyContent: "space-between" },
  userName: { fontSize: 16, fontWeight: "600" },
  timestamp: { fontSize: 12, color: "#999" },

  messageRow: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 2,
  },
  lastMessage: { color: "#555", flex: 1 },

  unreadBadge: {
    backgroundColor: "#007AFF", paddingHorizontal: 8,
    borderRadius: 10, justifyContent: "center", alignItems: "center",
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  emptyList: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
});
