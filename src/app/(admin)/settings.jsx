import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/settings";

export default function Settings() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [lastBackupDate, setLastBackupDate] = useState("Never");

  // Notification states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  // Security states
  const [biometricAuth, setBiometricAuth] = useState(true);

  // Trigger Database Backup Simulation
  const handleStartDatabaseBackup = () => {
    Alert.alert(
      "Full Database Backup",
      "Are you sure you want to initiate a full database backup? This will archive all application records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Backup",
          onPress: () => performBackup(),
        },
      ],
    );
  };

  const performBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setBackupProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsBackingUp(false);
        const formattedDate = new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastBackupDate(formattedDate);
        Alert.alert(
          "Backup Complete",
          "The database backup was successfully generated and saved.",
        );
      }
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            System configurations, backups, and preferences
          </Text>
        </View>

        {/* Section: System Data & Backup */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>System Maintenance</Text>
          <View style={styles.card}>
            <View style={styles.backupHeaderRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="server-outline" size={20} color="#1E3A8A" />
              </View>
              <View style={styles.backupMeta}>
                <Text style={styles.cardTitle}>Full Database Backup</Text>
                <Text style={styles.cardSubtitle}>
                  Last Backup: {lastBackupDate}
                </Text>
              </View>
            </View>

            {isBackingUp ? (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${backupProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  Backing up database... {backupProgress}%
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.backupButton}
                onPress={handleStartDatabaseBackup}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.backupButtonText}>Backup Entire DB</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section: Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#0F172A"
                />
                <Text style={styles.rowLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={pushNotifications ? "#1E3A8A" : "#94A3B8"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="mail-outline" size={20} color="#0F172A" />
                <Text style={styles.rowLabel}>Email Reports & Alerts</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={emailAlerts ? "#1E3A8A" : "#94A3B8"}
              />
            </View>
          </View>
        </View>

        {/* Section: Security */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Security & Access</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color="#0F172A"
                />
                <Text style={styles.rowLabel}>Biometric Unlock</Text>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={biometricAuth ? "#1E3A8A" : "#94A3B8"}
              />
            </View>
          </View>
        </View>

        {/* Section: About */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>App Version</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
