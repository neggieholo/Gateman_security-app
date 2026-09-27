import { router } from "expo-router";
import {
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../app/UserContext";
import { ProjectionShift } from "@/services/interfaces";
import { getMySchedule, getSecurityColleagues } from "@/services/api";

interface GuardColleague {
  id: string;
  name: string;
}

export default function SecuritySchedules() {
  const { user, isDarkMode, theme } = useUser();
  const [shifts, setShifts] = useState<ProjectionShift[]>([]);
  const [colleaguesMap, setColleaguesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch schedules and colleagues concurrently
  const fetchData = async () => {
    try {
      const [schedulesRes, colleaguesRes] = await Promise.all([
        getMySchedule(),
        getSecurityColleagues(),
      ]);

      if (schedulesRes.success && schedulesRes.shifts) {
        setShifts(schedulesRes.shifts);
      }

      if (colleaguesRes.success && colleaguesRes.securityGuards) {
        // Map guard IDs directly to names for O(1) fast lookup
        const map: Record<string, string> = {};
        colleaguesRes.securityGuards.forEach((g: GuardColleague) => {
          map[g.id] = g.name;
        });
        setColleaguesMap(map);
      }
    } catch (err) {
      console.error("Error fetching schedule dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderShiftItem = ({ item }: { item: ProjectionShift }) => {
    // Filter out the current user's ID to find shift partners
    const partnerIds = (item.assigned_guard_ids || []).filter(
      (id) => id !== user?.id
    );

    // Resolve colleague names from the fetched map
    const partnerNames = partnerIds
      .map((id) => colleaguesMap[id] || "Unknown Guard")
      .join(", ");

    return (
      <View
        className={`${
          isDarkMode
            ? "bg-gm-navy border-gm-gold"
            : "bg-white border-gray-100"
        } border p-5 mb-4 rounded-3xl shadow-sm`}
      >
        {/* Header: Label Badge */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <View className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <Calendar size={16} color="#4f46e5" />
            </View>
            <Text
              className={`text-base font-montserrat-bold ${
                isDarkMode ? "text-gm-gold" : "text-gm-navy"
              }`}
            >
              {item.label || "Duty Shift"}
            </Text>
          </View>
        </View>

        {/* Start and End Date / Time Grid */}
        <View
          className={`flex-row justify-between py-3 border-y ${
            isDarkMode ? "border-slate-800" : "border-gray-100"
          }`}
        >
          {/* Start Shift Details */}
          <View className="flex-1 pr-2">
            <Text
              className={`${
                isDarkMode ? "text-slate-400" : "text-gray-400"
              } text-[10px] uppercase tracking-widest font-oswald-semibold`}
            >
              Starts
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-gm-navy"
              } text-sm font-montserrat-bold mt-0.5`}
            >
              {item.start_date}
            </Text>
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#10b981" />
              <Text className="text-emerald-600 text-xs font-oswald-semibold ml-1">
                {item.start_time}
              </Text>
            </View>
          </View>

          {/* End Shift Details */}
          <View
            className={`flex-1 pl-3 border-l ${
              isDarkMode ? "border-slate-800" : "border-gray-100"
            }`}
          >
            <Text
              className={`${
                isDarkMode ? "text-slate-400" : "text-gray-400"
              } text-[10px] uppercase tracking-widest font-oswald-semibold`}
            >
              Ends
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-gm-navy"
              } text-sm font-montserrat-bold mt-0.5`}
            >
              {item.end_date}
            </Text>
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#ef4444" />
              <Text className="text-red-500 text-xs font-oswald-semibold ml-1">
                {item.end_time}
              </Text>
            </View>
          </View>
        </View>

        {/* Sharing Shift With Section (Only displays if other guards exist on shift) */}
        {partnerIds.length > 0 ? (
          <View className="mt-3 flex-row items-center bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100">
            <Users size={14} color="#6366f1" />
            <Text
              className="text-indigo-900 text-xs font-roboto-regular ml-2 flex-1"
              numberOfLines={1}
            >
              <Text className="font-oswald-semibold text-indigo-700">
                Sharing shift with:{" "}
              </Text>
              {partnerNames}
            </Text>
          </View>
        ) : (
          <View className="mt-3 flex-row items-center">
            <UserCheck size={14} color="#10b981" />
            <Text className="text-emerald-600 text-xs font-oswald-semibold ml-1.5">
              Solo Shift Assignment
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Guard Access Restriction State
  if (!user?.estate_id) {
    return (
      <View
        className={`${
          isDarkMode ? "bg-slate-950" : "bg-gray-50"
        } flex-1 justify-center items-center p-6`}
      >
        <View
          className={`${
            isDarkMode ? "bg-gm-navy" : "bg-white"
          } p-8 rounded-3xl shadow-sm items-center border border-gray-100`}
        >
          <ShieldCheck size={60} color="#4f46e5" />
          <Text
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gm-navy"
            } mt-4 text-center`}
          >
            Security Access Restricted
          </Text>
          <TouchableOpacity
            className={`${
              isDarkMode ? "bg-gm-charcoal" : "bg-gm-navy"
            } py-4 px-10 rounded-2xl shadow-md mt-6`}
            onPress={() => router.push("/JoinRequest" as any)}
          >
            <Text className="text-white font-bold text-lg">Join an Estate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`${
        isDarkMode ? "bg-slate-950" : "bg-gray-50"
      } flex-1 p-4`}
    >
      {/* Header Section */}
      <View className="mb-6">
        <Text
          className={`text-2xl font-montserrat-bold ${
            isDarkMode ? "text-gray-300" : "text-gray-900"
          }`}
        >
          My Duty Roster
        </Text>
        <Text className="text-gray-500 font-roboto-regular text-sm">
          {shifts.length} upcoming scheduled period{shifts.length === 1 ? "" : "s"}
        </Text>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            className={`flex-1 ${isDarkMode ? "bg-slate-950" : ""}`}
            color={theme.accent}
          />
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(item, idx) =>
            `${item.start_date}-${item.start_time}-${idx}`
          }
          renderItem={renderShiftItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4f46e5"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Calendar size={50} color="#cbd5e1" />
              <Text className="text-gray-400 mt-4 text-lg font-medium">
                No active shift schedules assigned
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}