import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Main Container & Header
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  // Main Tabs (Upcoming / Past)
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },

  // Loading & List Layout
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Program Card Item
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  posterImage: {
    width: "100%",
    height: 140,
  },
  posterPlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upcomingBadge: {
    backgroundColor: "#EFF6FF",
  },
  pastBadge: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  upcomingStatusText: {
    color: "#1E3A8A",
  },
  pastStatusText: {
    color: "#64748B",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  attendeeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attendeeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },

  // Empty List View
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },

  // Program Details Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalPoster: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },

  // Modal Section Card (Creator / Counselor details)
  sectionCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    width: 60,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
    flex: 1,
  },

  // Modal Sub-Tabs (Participants vs Invigilators)
  subTabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeSubTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#1E3A8A",
  },
  subTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  activeSubTabText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },

  // Modal Lists (Participants & Invigilators)
  listSection: {
    gap: 10,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  personDetails: {
    marginLeft: 12,
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  personMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  emptySubText: {
    textAlign: "center",
    color: "#94A3B8",
    marginVertical: 24,
    fontSize: 13,
    fontWeight: "500",
  },
});
