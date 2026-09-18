import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/staff";

// Initial Mock Staff Data
const INITIAL_STAFF = [
  {
    id: "1",
    name: "Dr. Jane Mwangi",
    email: "jane.mwangi@nextstep.org",
    role: "Counselor",
    status: "Pending", // 'Pending' | 'Active' | 'Suspended'
  },
  {
    id: "2",
    name: "Samuel Ochieng",
    email: "samuel.o@nextstep.org",
    role: "Counselor",
    status: "Active",
  },
  {
    id: "3",
    name: "Alex Kiprop",
    email: "alex.admin@nextstep.org",
    role: "Admin",
    status: "Active",
  },
  {
    id: "4",
    name: "Grace Wanjiku",
    email: "grace.w@nextstep.org",
    role: "Admin",
    status: "Pending",
  },
];

export default function StaffManagement() {
  const [staffList, setStaffList] = useState(INITIAL_STAFF);

  // Whitelist Form State
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistRole, setWhitelistRole] = useState("Counselor"); // 'Counselor' | 'Admin'

  // Tab View for Staff List Filtering
  const [selectedRoleTab, setSelectedRoleTab] = useState("Counselor"); // 'Counselor' | 'Admin'

  // Handle Adding Whitelisted Email
  const handleAddWhitelist = () => {
    if (!whitelistEmail.trim() || !whitelistEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const emailExists = staffList.some(
      (s) => s.email.toLowerCase() === whitelistEmail.toLowerCase().trim(),
    );

    if (emailExists) {
      Alert.alert(
        "Already Whitelisted",
        "This email address is already added.",
      );
      return;
    }

    const newStaffEntry = {
      id: Date.now().toString(),
      name: "Pending Signup",
      email: whitelistEmail.trim().toLowerCase(),
      role: whitelistRole,
      status: "Pending",
    };

    setStaffList([newStaffEntry, ...staffList]);
    setWhitelistEmail("");
    Keyboard.dismiss();
    Alert.alert(
      "Whitelisted Successfully",
      `${whitelistEmail} linked as a whitelisted ${whitelistRole}.`,
    );
  };

  // Staff Action Handlers
  const handleApprove = (id) => {
    setStaffList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Active" } : item,
      ),
    );
    Alert.alert("Staff Approved", "User account is now Active.");
  };

  const handleSuspend = (id) => {
    setStaffList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Suspended" } : item,
      ),
    );
    Alert.alert("Staff Suspended", "User account access has been suspended.");
  };

  const handleRemove = (staffMember) => {
    Alert.alert(
      "Remove Staff Account",
      `Are you sure you want to remove ${staffMember.email}? They will be blocked from logging in permanently, and their account data will be scheduled for deletion after 5 years.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently Remove",
          style: "destructive",
          onPress: () => {
            setStaffList((prev) =>
              prev.filter((item) => item.id !== staffMember.id),
            );
            Alert.alert(
              "Account Removed",
              "User removed. Data retention schedule set for 5-year automated deletion.",
            );
          },
        },
      ],
    );
  };

  const filteredStaff = staffList.filter(
    (s) => s.role.toLowerCase() === selectedRoleTab.toLowerCase(),
  );

  const renderStaffCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {item.name !== "Pending Signup"
              ? item.name.charAt(0)
              : item.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === "Active"
              ? styles.activeBadge
              : item.status === "Suspended"
                ? styles.suspendedBadge
                : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === "Active"
                ? styles.activeStatusText
                : item.status === "Suspended"
                  ? styles.suspendedStatusText
                  : styles.pendingStatusText,
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {item.status !== "Active" && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(item.id)}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#059669"
            />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        )}

        {item.status !== "Suspended" && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.suspendBtn]}
            onPress={() => handleSuspend(item.id)}
          >
            <Ionicons name="pause-circle-outline" size={16} color="#D97706" />
            <Text style={styles.suspendBtnText}>Suspend</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={() => handleRemove(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Staff Management</Text>
            <Text style={styles.headerSubtitle}>
              Whitelist new staff and manage Counselor & Admin permissions
            </Text>
          </View>

          {/* Top Section: Whitelist Input Card */}
          <View style={styles.whitelistSection}>
            <Text style={styles.sectionHeader}>
              Pre-Approve / Whitelist Staff
            </Text>
            <View style={styles.whitelistCard}>
              <Text style={styles.inputLabel}>Staff Email Address</Text>
              <TextInput
                style={styles.emailInput}
                placeholder="e.g. staff.member@nextstep.org"
                placeholderTextColor="#94A3B8"
                value={whitelistEmail}
                onChangeText={setWhitelistEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Assign Role</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[
                    styles.roleChip,
                    whitelistRole === "Counselor" && styles.activeRoleChip,
                  ]}
                  onPress={() => setWhitelistRole("Counselor")}
                >
                  <Ionicons
                    name="people"
                    size={16}
                    color={
                      whitelistRole === "Counselor" ? "#FFFFFF" : "#64748B"
                    }
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      whitelistRole === "Counselor" &&
                        styles.activeRoleChipText,
                    ]}
                  >
                    Counselor App
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleChip,
                    whitelistRole === "Admin" && styles.activeRoleChip,
                  ]}
                  onPress={() => setWhitelistRole("Admin")}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={whitelistRole === "Admin" ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.roleChipText,
                      whitelistRole === "Admin" && styles.activeRoleChipText,
                    ]}
                  >
                    Admin App
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.whitelistBtn}
                onPress={handleAddWhitelist}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.whitelistBtnText}>Whitelist Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Section: Staff Cards List Header & Tabs */}
          <View style={styles.staffListHeader}>
            <Text style={styles.sectionHeader}>Staff Directory</Text>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[
                  styles.tabItem,
                  selectedRoleTab === "Counselor" && styles.activeTabItem,
                ]}
                onPress={() => setSelectedRoleTab("Counselor")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedRoleTab === "Counselor" && styles.activeTabText,
                  ]}
                >
                  Counselors (
                  {staffList.filter((s) => s.role === "Counselor").length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabItem,
                  selectedRoleTab === "Admin" && styles.activeTabItem,
                ]}
                onPress={() => setSelectedRoleTab("Admin")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedRoleTab === "Admin" && styles.activeTabText,
                  ]}
                >
                  Admins ({staffList.filter((s) => s.role === "Admin").length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cards FlatList */}
          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-circle-outline"
                  size={48}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyText}>
                  No registered or whitelisted {selectedRoleTab}s found.
                </Text>
              </View>
            }
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
