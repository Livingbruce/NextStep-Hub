import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  adminTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  // Section Headers
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },

  // Shortcuts Grid
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  shortcutCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
    marginHorizontal: 8,
  },

  // Events / Programs Horizontal List
  eventsList: {
    paddingRight: 20,
    gap: 14,
    marginBottom: 20,
  },
  eventCard: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 20,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  eventLocation: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },

  // App Logs / Recent Actions
  actionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  actionCardLast: {
    borderBottomWidth: 0,
  },

  // Action Header (User Info + Status Badge)
  actionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  actionUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Restricts user details so badge isn't pushed off-screen
    marginRight: 6,
  },
  actionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionTextContainer: {
    flex: 1, // Ensures name & email truncate cleanly with '...'
  },
  actionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionPerson: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flexShrink: 1, // Crucial: lets text shrink if name is too long
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  actionEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },

  // Right side action status pill
  actionBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "40%",
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    textAlign: "right",
  },

  // Action Details & Time
  actionBottomRow: {
    marginTop: 8,
    paddingLeft: 44, // Align with text under icon
  },
  actionDetailsText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 6,
  },
  actionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionTime: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },

  // Empty & Loading States
  loadingContainer: {
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  emptyActions: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
});
