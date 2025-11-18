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
  TextInput,
} from "react-native";

export default function HomeScreen({ navigation, route }) {
  const { currentUser, db } = route.params;

  const [updatedUser, setUpdatedUser] = useState(currentUser); // <-- NEW
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigation.replace("Login");
      return;
    }

    const refreshData = async () => {
      // 🔥 Refresh current user from DB
      const freshUser = await db.getFirstAsync(
        "SELECT * FROM users WHERE id = ?",
        [currentUser.id]
      );
      setUpdatedUser(freshUser);

      loadUsers();
    };

    const unsub = navigation.addListener("focus", refreshData);
    refreshData();
    return unsub;
  }, [navigation]);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  const loadUsers = async () => {
    try {
      const list = await db.getAllAsync(
        `SELECT id, username, fullName, profilePhoto 
         FROM users WHERE id != ? ORDER BY fullName`,
        [currentUser.id]
      );

      const enhanced = await Promise.all(
        list.map(async (u) => {
          const lastMsg = await db.getFirstAsync(
            `SELECT message, timestamp, senderId FROM messages
             WHERE (senderId=? AND receiverId=?) OR (senderId=? AND receiverId=?)
             ORDER BY timestamp DESC LIMIT 1`,
            [currentUser.id, u.id, u.id, currentUser.id]
          );

          const unread = await db.getFirstAsync(
            `SELECT COUNT(*) AS count FROM messages 
             WHERE senderId=? AND receiverId=? AND isRead=0`,
            [u.id, currentUser.id]
          );

          return {
            ...u,
            lastMessage: lastMsg?.message || "No messages yet",
            lastMessageTime: lastMsg?.timestamp || null,
            isYou: lastMsg?.senderId === currentUser.id,
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

  const openChat = (user) =>
    navigation.navigate("Chat", {
      currentUser: updatedUser,
      chatUser: user,
      db,
    });

  const openMenu = () =>
    navigation.navigate("Menu", { currentUser: updatedUser, db });

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const d = new Date(timestamp);
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.chatCard} onPress={() => openChat(item)}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{item.fullName[0]}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{item.fullName}</Text>
          {item.lastMessageTime && (
            <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          )}
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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C9A7" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowImageModal(true)}>
          {updatedUser?.profilePhoto ? (
            <Image
              source={{ uri: updatedUser.profilePhoto }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerLetter}>{updatedUser.fullName[0]}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>Welcome</Text>
          <Text style={styles.headerTitle}>{updatedUser.fullName} 👋</Text>
        </View>

        <TouchableOpacity onPress={openMenu}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Text style={styles.clearBtn}>✖</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* USER LIST */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => u.id.toString()}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadUsers} />
        }
        ListEmptyComponent={<Text style={styles.empty}>Nobody here 😅</Text>}
      />

      {/* PROFILE MODAL */}
      {showImageModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCentered}>
            <View style={styles.imageWrapper}>
              {updatedUser?.profilePhoto ? (
                <Image
                  source={{ uri: updatedUser.profilePhoto }}
                  style={styles.modalImage}
                />
              ) : (
                <View style={[styles.modalImage, styles.noPhotoPlaceholder]}>
                  <Text style={styles.noPhotoText}>
                    {updatedUser.fullName[0]}
                  </Text>
                </View>
              )}

              {/* Close button attached to image */}
              <TouchableOpacity
                style={styles.imageCloseButton}
                onPress={() => setShowImageModal(false)}
              >
                <Text style={styles.imageCloseText}>✖</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
/* ------------------------ STYLES ------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E7FFF5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 45,
    paddingBottom: 20,
    paddingHorizontal: 18,
    backgroundColor: "#00E6C2",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },

  headerCenter: { flex: 1, marginLeft: 10 },

  menuButton: { padding: 10 },

  menuIcon: { fontSize: 45, color: "#003E36", fontWeight: "900" },

  headerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  headerLetter: { color: "#00A38C", fontWeight: "900", fontSize: 22 },

  headerSub: { color: "#004C41", fontSize: 15 },

  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#003E36" },

  /* 🔍 Search Bar */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 4,
    height: 48,
  },

  searchIcon: { fontSize: 18, marginRight: 8, color: "#28544B" },

  searchInput: { flex: 1, fontSize: 16, color: "#003E36" },

  clearBtn: { fontSize: 18, color: "#003E36", marginLeft: 6 },

  /* Chat card */
  chatCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 22,
    elevation: 4,
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

  avatarLetter: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  rowTop: { flexDirection: "row", justifyContent: "space-between" },

  name: { fontSize: 16, fontWeight: "700", color: "#003E36" },

  time: { fontSize: 13, color: "#777" },

  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },

  preview: { flex: 1, color: "#666" },

  badge: {
    backgroundColor: "#00C9A7",
    minWidth: 22,
    height: 22,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },

  empty: { textAlign: "center", fontSize: 16, marginTop: 40, color: "#777" },

  /* 🔥 MODAL STYLES UPDATE */
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.85)", // darker for better viewing
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modalContentCentered: {
    justifyContent: "center",
    alignItems: "center",
  },

  modalImage: {
    width: 260,
    height: 260,
    borderRadius: 130,
    resizeMode: "cover",
    borderWidth: 3,
    borderColor: "#fff", // optional outline
  },

  /* CLOSE BUTTON STYLE */
  modalCloseTop: {
    position: "absolute",
    top: 40,
    right: 30,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },

  closeTopText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#333",
  },

  /* Fallback profile avatar circle */
  noPhotoPlaceholder: {
    backgroundColor: "#00E6C2",
    justifyContent: "center",
    alignItems: "center",
  },

  noPhotoText: {
    fontSize: 70,
    fontWeight: "bold",
    color: "white",
  },
  /* Image wrapper so button sits above it */
  imageWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  /* The X inside the picture top right */
  imageCloseButton: {
    position: "absolute",
    top: -12,
    right: -12,
    backgroundColor: "#ffffff",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    borderWidth: 2,
    borderColor: "#00E6C2",
  },

  imageCloseText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#003E36",
  },
});
