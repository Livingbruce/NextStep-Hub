import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
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
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  upcomingBorder: {
    borderColor: "#93C5FD",
  },
  archiveBorder: {
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientMeta: {
    flex: 1,
    marginRight: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  serviceTag: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
    marginTop: 2,
  },
  cardRightMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  upcomingBadge: {
    backgroundColor: "#EFF6FF",
  },
  completedBadge: {
    backgroundColor: "#F1F5F9",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  upcomingText: {
    color: "#2563EB",
  },
  completedText: {
    color: "#64748B",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  cardDateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  expandedDetails: {
    marginTop: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: "#334155",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#0F172A",
  },
  remarkBox: {
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1E3A8A",
  },
  reviewBox: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  boxContent: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  boxContentSubtle: {
    fontSize: 12,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  yearBlock: {
    marginBottom: 16,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  monthContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  monthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  monthBadgeText: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  monthBody: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    marginVertical: 4,
  },
});
