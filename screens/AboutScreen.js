import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";

export default function AboutScreen() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>ℹ️ About This App</Text>

      <Text style={styles.description}>
        This project demonstrates an offline peer-to-peer messaging system where users
        can communicate and store chat history locally without the need for internet.
      </Text>

      <TouchableOpacity 
        style={styles.btn}
        onPress={() => setShowInfo(!showInfo)}
        activeOpacity={0.7}
      >
        <Text style={styles.btnText}>
          {showInfo ? "Hide Details ▲" : "About the Developer ▼"}
        </Text>
      </TouchableOpacity>

      {showInfo && (
        <View style={styles.infoBox}>

          <Image source={require("../assets/profile.png")} style={styles.profileImg}/>

          <Text style={styles.label}>Author / Submitted by:</Text>
          <Text style={styles.value}>Carl Philip Romanda</Text>

          <Text style={styles.label}>Submitted To:</Text>
          <Text style={styles.value}>Jay Ian Camelotes</Text>

          <Text style={styles.label}>About Me:</Text>
          <Text style={styles.bio}>
            Hi! I’m Carl — currently learning mobile development and improving my programming skills.
            I enjoy exploring how apps are made and building simple projects as I grow in this field.
          </Text>

          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>San Pascual, Ubay, Bohol, Philippines</Text>

        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#EFFFFA",
    justifyContent: "center",  // Center vertically
    alignItems: "center",      // Center horizontally
    padding: 22,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#003E36",
    marginBottom: 10,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
    width: "90%",
  },

  btn: {
    backgroundColor: "#00C9A7",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    width: "85%",
    marginBottom: 20,
    elevation: 3,
  },

  btnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003E36",
  },

  infoBox: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 18,
    elevation: 5,
    width: "100%",
    alignItems: "center",
  },

  profileImg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007566",
    alignSelf: "flex-start",
  },

  value: {
    fontSize: 16,
    color: "#1B3A4B",
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  bio: {
    fontSize: 15,
    marginTop: 5,
    color: "#555",
    textAlign: "justify",
    alignSelf: "flex-start",
    marginBottom: 15,
  },
});
