import { Text, View } from "react-native";
import { fmtDayShort, fmtTimeOnly, getSlots } from "./schedule";

export default function Timetable({ program, accent = "#1E3A8A" }) {
  const slots = getSlots(program);
  const today = new Date().toDateString();

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {slots.map((s, i) => {
        const isToday = s.start.toDateString() === today;
        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              paddingVertical: 9,
              paddingHorizontal: 12,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: "#E2E8F0",
              backgroundColor: isToday ? "#FFFFFF" : "transparent",
            }}
          >
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: isToday ? accent : "#E2E8F0",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: isToday ? "#FFFFFF" : "#475569",
                }}
              >
                Day {i + 1}
              </Text>
            </View>
            <Text
              style={{ fontSize: 12.5, fontWeight: "700", color: "#0F172A" }}
            >
              {fmtDayShort(s.start)}
            </Text>
            <Text style={{ fontSize: 12.5, color: "#64748B", flexShrink: 1 }}>
              {fmtTimeOnly(s.start)} – {fmtTimeOnly(s.end)}
            </Text>
            {isToday && (
              <Text style={{ fontSize: 11, fontWeight: "800", color: accent }}>
                TODAY
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
