import { StyleSheet, Text, View } from "react-native";

export default function AdminHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin App Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});
