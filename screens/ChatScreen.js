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
    } catch {}
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
      console.log("Send error:", err);
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
    const showDate = !prev || formatDate(prev.timestamp) !== formatDate(item.timestamp);

    return (
      <>
        {showDate && (
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}

        <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.msgText, isMe ? styles.msgMe : styles.msgThem]}>
              {item.message}
            </Text>
            <Text style={[styles.msgTime, isMe ? styles.timeMe : styles.timeThem]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>⬅</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowImageModal(true)}>
          {chatUser.profilePhoto ? (
            <Image source={{ uri: chatUser.profilePhoto }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerLetter}>{chatUser.fullName[0]}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.headerName}>{chatUser.fullName}</Text>
      </View>

      {/* IMAGE POPUP */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalContainer} onPress={() => setShowImageModal(false)}>
          {chatUser.profilePhoto ? (
            <Image source={{ uri: chatUser.profilePhoto }} style={styles.modalImage} />
          ) : (
            <View style={styles.modalPlaceholder}>
              <Text style={styles.modalInitial}>{chatUser.fullName[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* CHAT LIST */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor="#999"
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={send} disabled={!text.trim()} style={[styles.sendBtn, !text.trim() && styles.disabledSend]}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFFFFA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 15,
    backgroundColor: "#00E6C2",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  back: { fontSize: 22, marginRight: 12, color: "#004D45", fontWeight: "700" },

  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#A9FFF0",
  },

  headerLetter: { fontSize: 22, fontWeight: "900", color: "#00A38C" },
  headerName: { fontSize: 18, fontWeight: "800", color: "#003E36" },

  list: { padding: 12, paddingBottom: 80 },

  dateWrap: { alignItems: "center", marginVertical: 10 },
  dateText: {
    backgroundColor: "#C9FFF0",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    fontWeight: "600",
    color: "#005E53",
  },

  row: { maxWidth: "75%", marginVertical: 6 },
  rowMe: { alignSelf: "flex-end" },
  rowThem: { alignSelf: "flex-start" },

  bubble: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: "#00C9A7",
    borderBottomRightRadius: 5,
  },
  bubbleThem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFFFEF",
    borderBottomLeftRadius: 5,
  },

  msgText: { fontSize: 16 },
  msgMe: { color: "#fff" },
  msgThem: { color: "#004D45" },

  msgTime: { fontSize: 11, marginTop: 5 },
  timeMe: { color: "#E2FFF9", textAlign: "right" },
  timeThem: { color: "#666" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderTopWidth: 2,
    borderColor: "#C9FFF0",
  },

  input: {
    flex: 1,
    backgroundColor: "#F3FFFA",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 17,
    maxHeight: 130,
  },

  sendBtn: {
    backgroundColor: "#00C9A7",
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
  },

  disabledSend: { backgroundColor: "#9DD9CB" },

  sendText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalImage: { width: 300, height: 300, borderRadius: 150, borderWidth: 3, borderColor: "#fff" },

  modalPlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#00C9A7",
    justifyContent: "center",
    alignItems: "center",
  },

  modalInitial: { fontSize: 100, fontWeight: "900", color: "#fff" },
});
