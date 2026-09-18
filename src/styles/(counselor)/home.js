import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
    marginTop: 8,
  },

  // Session Cards
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: "#64748B",
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  clientMeta: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  joinBtn: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  joinBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // Review Cards
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reviewMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  reviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  reviewClientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewSnippet: {
    fontSize: 13,
    color: "#334155",
    fontStyle: "italic",
    lineHeight: 18,
  },
  chevronIcon: {
    marginTop: 2,
  },
  reviewDetailsDrawer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 6,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
  },
});
