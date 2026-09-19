import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(admin)/staff";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistRole, setWhitelistRole] = useState("Counselor");

  const [selectedRoleTab, setSelectedRoleTab] = useState("Counselor");

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      // 1. Fetch whitelisted records (only email and role stored)
      const { data: whitelist, error: whitelistErr } = await supabase
        .from("staff_whitelist")
        .select("id, email, role");

      if (whitelistErr) throw whitelistErr;

      // 2. Fetch created profiles matching staff roles
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status")
        .in("role", ["Counselor", "Admin"]);

      if (profilesErr) throw profilesErr;

      const combined = [];

      // 3. Process registered staff from profiles
      profiles?.forEach((prof) => {
        combined.push({
          id: prof.id,
          name: prof.full_name || null,
          email: prof.email,
          role: prof.role,
          status: prof.status || "Active",
          hasAccount: true,
        });
      });

      // 4. Process pending whitelist entries (not yet signed up)
      whitelist?.forEach((wl) => {
        const isRegistered = profiles?.some(
          (p) => p.email.toLowerCase() === wl.email.toLowerCase(),
        );

        if (!isRegistered) {
          combined.push({
            id: `wl-${wl.id}`,
            whitelistId: wl.id,
            name: null,
            email: wl.email,
            role: wl.role,
            status: "Pending Signup",
            hasAccount: false,
          });
        }
      });

      setStaffList(combined);
    } catch (err) {
      Alert.alert("Error fetching staff", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleAddWhitelist = async () => {
    const cleanEmail = whitelistEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const emailExists = staffList.some(
      (s) => s.email.toLowerCase() === cleanEmail,
    );

    if (emailExists) {
      Alert.alert(
        "Already Whitelisted",
        "This email address is already in the system.",
      );
      return;
    }

    try {
      const { error } = await supabase.from("staff_whitelist").insert([
        {
          email: cleanEmail,
          role: whitelistRole,
        },
      ]);

      if (error) throw error;

      setWhitelistEmail("");
      Keyboard.dismiss();
      Alert.alert(
        "Success",
        `${cleanEmail} whitelisted as a ${whitelistRole}.`,
      );
      fetchStaffData();
    } catch (err) {
      Alert.alert("Error Whitelisting", err.message);
    }
  };

  // Staff Action Handlers
  const handleApprove = async (item) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "Active" })
        .eq("id", item.id);

      if (error) throw error;

      Alert.alert("Staff Approved", `${item.email} is now Active.`);
      fetchStaffData();
    } catch (err) {
      Alert.alert("Error Approving", err.message);
    }
  };

  const handleSuspend = async (item) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "Suspended" })
        .eq("id", item.id);

      if (error) throw error;

      Alert.alert("Staff Suspended", `${item.email} has been suspended.`);
      fetchStaffData();
    } catch (err) {
      Alert.alert("Error Suspending", err.message);
    }
  };

  const handleRemove = (item) => {
    Alert.alert(
      "Remove Staff Entry",
      `Are you sure you want to remove ${item.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              if (item.hasAccount) {
                const { error: profErr } = await supabase
                  .from("profiles")
                  .delete()
                  .eq("id", item.id);
                if (profErr) throw profErr;

                // Also clean up staff_whitelist entry if present
                await supabase
                  .from("staff_whitelist")
                  .delete()
                  .eq("email", item.email.toLowerCase());
              } else {
                // Delete pending whitelist entry by its whitelist row ID
                const { error: wlErr } = await supabase
                  .from("staff_whitelist")
                  .delete()
                  .eq("id", item.whitelistId);
                if (wlErr) throw wlErr;
              }

              Alert.alert("Removed", "Staff record removed successfully.");
              fetchStaffData();
            } catch (err) {
              Alert.alert("Error Removing", err.message);
            }
          },
        },
      ],
    );
  };

  const filteredStaff = staffList.filter(
    (s) => s.role.toLowerCase() === selectedRoleTab.toLowerCase(),
  );

  const renderStaffCard = ({ item }) => {
    const isPendingSignup = !item.hasAccount;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.name
                ? item.name.charAt(0).toUpperCase()
                : item.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            {item.name && <Text style={styles.userName}>{item.name}</Text>}
            <Text
              style={[
                styles.userEmail,
                !item.name && { fontSize: 15, fontWeight: "600" },
              ]}
            >
              {item.email}
            </Text>
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
          {!isPendingSignup && item.status !== "Active" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color="#059669"
              />
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          )}

          {!isPendingSignup && item.status !== "Suspended" && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.suspendBtn]}
              onPress={() => handleSuspend(item)}
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Staff Management</Text>
            <Text style={styles.headerSubtitle}>
              Whitelist new staff and manage Counselor & Admin permissions
            </Text>
          </View>

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

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#0284C7"
              style={{ marginTop: 20 }}
            />
          ) : (
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
                  <Text style={styles.emptyText}>no staff added</Text>
                </View>
              }
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
