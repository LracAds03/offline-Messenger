import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';

export default function ChatScreen({ navigation, route, db }) {
  const { currentUser, chatUser } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    const interval = setInterval(() => {
      loadMessages();
    }, 1500);

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
    } catch (e) {
      console.log("Load message error:", e);
    }

    setLoading(false);
  };

  const markAsRead = async () => {
    try {
      await db.runAsync(
        `UPDATE messages
         SET isRead = 1
         WHERE senderId = ? AND receiverId = ? AND isRead = 0`,
        [chatUser.id, currentUser.id]
      );
    } catch (e) {
      console.log("Mark read error:", e);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await db.runAsync(
        `INSERT INTO messages (senderId, receiverId, message)
         VALUES (?, ?, ?)`,
        [currentUser.id, chatUser.id, inputText.trim()]
      );
    } catch (e) {
      console.log("Message send error:", e);
    }

    setInputText('');
    await loadMessages();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.senderId === currentUser.id;
    const prev = index > 0 ? messages[index - 1] : null;

    const showDate = !prev || formatDate(prev.timestamp) !== formatDate(item.timestamp);

    return (
      <>
        {showDate && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            isMe ? styles.myRow : styles.theirRow
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMe ? styles.myBubble : styles.theirBubble
            ]}
          >
            <Text style={[styles.msgText, isMe ? styles.myText : styles.theirText]}>
              {item.message}
            </Text>

            <Text style={[styles.time, isMe ? styles.myTime : styles.theirTime]}>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {chatUser.profilePhoto ? (
          <Image source={{ uri: chatUser.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {chatUser.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.headerName}>{chatUser.fullName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySub}>Send a message to begin!</Text>
            </View>
          )
        }
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          placeholder="Type a message..."
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          disabled={!inputText.trim()}
          onPress={sendMessage}
        >
          <Text style={styles.sendText}>Send</Text>
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
    padding: 15,
    paddingTop: 50,
  },

  backButton: { marginRight: 12 },
  backText: { fontSize: 26, color: "#fff" },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  avatarLetter: { fontWeight: "bold", fontSize: 16, color: "#007AFF" },

  headerName: { color: "#fff", fontSize: 17, fontWeight: "600" },

  listContent: { padding: 10 },

  dateHeader: { alignItems: "center", marginVertical: 10 },
  dateText: {
    backgroundColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    color: "#555",
    fontSize: 12,
  },

  messageRow: { marginVertical: 4, maxWidth: "75%" },
  myRow: { alignSelf: "flex-end" },
  theirRow: { alignSelf: "flex-start" },

  bubble: { padding: 10, borderRadius: 14 },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },

  msgText: { fontSize: 16 },
  myText: { color: "#fff" },
  theirText: { color: "#000" },

  time: { fontSize: 11, marginTop: 4 },
  myTime: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  theirTime: { color: "#888" },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },

  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16,
  },

  sendBtn: {
    backgroundColor: "#007AFF",
    marginLeft: 10,
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },

  sendBtnDisabled: { backgroundColor: "#aaa" },

  sendText: { color: "#fff", fontWeight: "600" },

  emptyBox: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 18, color: "#666" },
  emptySub: { fontSize: 14, color: "#999", marginTop: 4 },
});
