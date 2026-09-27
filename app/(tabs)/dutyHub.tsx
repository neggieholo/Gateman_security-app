import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Calendar, Users } from "lucide-react-native";
import { useUser } from "../UserContext";
import SecuritySchedules from "@/Components/Schedules";
import SecurityColleagues from "@/Components/Colleagues";

export default function DutyHub() {
  const { isDarkMode } = useUser();
  const [activeTab, setActiveTab] = useState<"SCHEDULE" | "COLLEAGUES">("SCHEDULE");

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-slate-950" : "bg-gray-50"}`}>
      {/* Top Segment Controller */}
      <View className="px-4 pt-4 pb-2">
        <View
          className={`flex-row p-1.5 rounded-2xl border ${
            isDarkMode
              ? "bg-gm-navy border-slate-800"
              : "bg-gray-200/70 border-gray-200"
          }`}
        >
          {/* Schedule Tab Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("SCHEDULE")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
              activeTab === "SCHEDULE"
                ? isDarkMode
                  ? "bg-slate-900 border-gm-gold"
                  : "bg-white border-indigo-600"
                : "border-transparent"
            }`}
          >
            <Calendar
              size={16}
              color={
                activeTab === "SCHEDULE"
                  ? isDarkMode
                    ? "#e2e8f0"
                    : "#4f46e5"
                  : "#64748b"
              }
            />
            <Text
              className={`ml-2 text-xs font-oswald-semibold uppercase tracking-wider ${
                activeTab === "SCHEDULE"
                  ? isDarkMode
                    ? "text-gm-gold"
                    : "text-indigo-600"
                  : "text-gray-500"
              }`}
            >
              My Schedule
            </Text>
          </TouchableOpacity>

          {/* Colleagues Tab Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab("COLLEAGUES")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
              activeTab === "COLLEAGUES"
                ? isDarkMode
                  ? "bg-slate-900 border-gm-gold"
                  : "bg-white border-indigo-600"
                : "border-transparent"
            }`}
          >
            <Users
              size={16}
              color={
                activeTab === "COLLEAGUES"
                  ? isDarkMode
                    ? "#e2e8f0"
                    : "#4f46e5"
                  : "#64748b"
              }
            />
            <Text
              className={`ml-2 text-xs font-oswald-semibold uppercase tracking-wider ${
                activeTab === "COLLEAGUES"
                  ? isDarkMode
                    ? "text-gm-gold"
                    : "text-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Colleagues
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab View Body */}
      <View className="flex-1">
        {activeTab === "SCHEDULE" ? (
          <SecuritySchedules />
        ) : (
          <SecurityColleagues />
        )}
      </View>
    </View>
  );
}