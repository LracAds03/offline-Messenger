// screens/ChatScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from "react-native";

export default function ChatScreen({ navigation, route, db }) {
  const { currentUser, chatUser } = route.params;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const flatRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !chatUser) {
      navigation.replace("Home");
      return;
    }

    loadMessages();
    markRead();

    const interval = setInterval(() => loadMessages(), 1500);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const list = await db.getAllAsync(
        `SELECT * FROM messages
         WHERE (senderId = ? AND receiverId = ?) 
         OR (senderId = ? AND receiverId = ?)
         ORDER BY timestamp ASC`,
        [currentUser.id, chatUser.id, chatUser.id, currentUser.id]
      );
      setMessages(list);
    } catch (err) {
      console.log("Chat loadMessages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async () => {
    try {
      await db.runAsync(
        `UPDATE messages SET isRead = 1 
         WHERE senderId = ? AND receiverId = ? AND isRead = 0`,
        [chatUser.id, currentUser.id]
      );
    } catch (err) {
      // ignore
    }
  };

  const send = async () => {
    if (!text.trim()) return;

    try {
      await db.runAsync(
        `INSERT INTO messages (senderId, receiverId, message, timestamp)
       VALUES (?, ?, ?, datetime('now','localtime'))`,
        [currentUser.id, chatUser.id, text.trim()]
      );

      setText("");
      await loadMessages();

      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.log("Send message error:", err);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.senderId === currentUser.id;
    const prev = index > 0 ? messages[index - 1] : null;

    const showDate =
      !prev || formatDate(prev.timestamp) !== formatDate(item.timestamp);

    return (
      <>
        {showDate && (
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}

        <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
          <View
            style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
          >
            <Text
              style={[
                styles.msgText,
                isMe ? styles.msgTextMe : styles.msgTextThem,
              ]}
            >
              {item.message}
            </Text>
            <Text
              style={[
                styles.msgTime,
                isMe ? styles.msgTimeMe : styles.msgTimeThem,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* =======================
          HEADER
      ========================== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
        </TouchableOpacity>

        {/* Avatar clickable */}
        <TouchableOpacity onPress={() => setShowImageModal(true)}>
          {chatUser.profilePhoto ? (
            <Image
              source={{ uri: chatUser.profilePhoto }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text
                style={{
                  color: "#007AFF",
                  fontWeight: "700",
                }}
              >
                {chatUser.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.chatTitle}>{chatUser.fullName}</Text>
      </View>

      {/* =======================
          PROFILE ZOOM MODAL
      ========================== */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            {chatUser.profilePhoto ? (
              <Image
                source={{ uri: chatUser.profilePhoto }}
                style={styles.modalImage}
              />
            ) : (
              <View style={styles.modalPlaceholder}>
                <Text style={styles.modalLetter}>
                  {chatUser.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* =======================
          MESSAGES LIST
      ========================== */}
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
        onContentSizeChange={() =>
          flatRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          !loading && (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>No messages yet</Text>
            </View>
          )
        }
      />

      {/* =======================
          INPUT
      ========================== */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          onPress={send}
          style={[styles.sendBtn, !text.trim() && { backgroundColor: "#aaa" }]}
          disabled={!text.trim()}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingTop: 50,
    padding: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#e2e2e2",
  },

  chatTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },

  dateWrap: { alignItems: "center", marginVertical: 8 },
  dateText: {
    backgroundColor: "#e8e8e8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: "#666",
  },

  row: { marginVertical: 6, maxWidth: "75%" },
  rowMe: { alignSelf: "flex-end" },
  rowThem: { alignSelf: "flex-start" },

  bubble: { padding: 10, borderRadius: 14 },
  bubbleMe: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },

  msgText: { fontSize: 16 },
  msgTextMe: { color: "#fff" },
  msgTextThem: { color: "#000" },

  msgTime: { fontSize: 11, marginTop: 6 },
  msgTimeMe: { color: "rgba(255,255,255,0.8)", textAlign: "right" },
  msgTimeThem: { color: "#777" },

  inputRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "flex-end",
  },

  input: {
    flex: 1,
    backgroundColor: "#f0f0f5",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 17,
    maxHeight: 140,
    color: "#333",
  },

  sendBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  /* =======================
        FULLSCREEN MODAL
  ========================== */
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackdrop: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 160,
    resizeMode: "cover",
    borderWidth: 3,
    borderColor: "#fff",
  },

  modalPlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  modalLetter: {
    fontSize: 90,
    fontWeight: "700",
    color: "#fff",
  },
});
