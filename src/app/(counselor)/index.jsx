import { StyleSheet, Text, View } from "react-native";

export default function CounselorHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Counselor App Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});
