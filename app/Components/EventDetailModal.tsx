import { ChevronLeft, Search } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { checkAllOut, toggleGuestStatus } from "../services/api";
import { EstateEvent } from "../services/interfaces";
import { useUser } from "../UserContext";

const EventDetailModal = ({
  event,
  onClose,
  onRefresh,
}: {
  event: EstateEvent;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const { theme, isDarkMode } = useUser();
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'guests'
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'inside' | 'out'
  const [refreshing, setRefreshing] = useState(false);
  // ... other states

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredGuests = event.guest_list.filter((g: any) => {
    const matchesSearch =
      g.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.guest_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "inside")
      return matchesSearch && !!g.checked_in_at && !g.checked_out_at;
    if (filterStatus === "out") return matchesSearch && !!g.checked_out_at;
    return matchesSearch;
  });

  const handleCheckAllOut = () => {
    Alert.alert(
      "Bulk Check-Out",
      "Are you sure you want to check out everyone currently inside?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Check All Out",
          onPress: async () => {
            try {
              await checkAllOut(event.id);
              Alert.alert("Success", "All guests checked out.");
              await onRefresh();
            } catch (err) {
              Alert.alert("Error", "Bulk action failed.");
            }
          },
        },
      ],
    );
  };

  // const getStatusBadge = (guest: EventGuest) => {
  //   if (guest.checked_out_at)
  //     return { label: "OUT", color: "bg-slate-100 text-slate-400" };
  //   if (guest.checked_in_at)
  //     return { label: "INSIDE", color: "bg-emerald-100 text-emerald-700" };
  //   return { label: "EXPECTED", color: "bg-blue-100 text-blue-700" };
  // };

  const handleStatusToggle = async (registrationId: string) => {
    setProcessingId(registrationId);
    try {
      await toggleGuestStatus(registrationId);
      Alert.alert("Success", "Status updated");
      await onRefresh();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error || "Failed to update status",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaProvider>
        <SafeAreaView
          className={`flex-1 ${isDarkMode ? "bg-gm-navy/20" : "bg-white"}`}
        >
          {/* Modal Header */}
          <View
            className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-4 flex-row items-center border-b border-slate-100`}
          >
            <TouchableOpacity onPress={onClose} className="p-2">
              <ChevronLeft size={24} color={theme.accent} />
            </TouchableOpacity>
            <Text
              className={`flex-1 text-center font-montserrat-extrabold text-lg mr-8 ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
            >
              Event Management
            </Text>
          </View>

          {/* Tab Switcher */}
          <View
            className={`${isDarkMode ? "bg-gm-navy" : "bg-slate-100"} flex-row gap-3 p-2 mx-6 mt-4 rounded-2xl`}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("details")}
              className={`flex-1 p-4 rounded-3xl border-2 flex-row items-center justify-center ${activeTab === "details" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-center font-oswald-semibold ${activeTab === "details" ? "text-gm-navy" : isDarkMode ? "text-white" : "text-slate-400"}`}
              >
                Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("guests")}
              className={`flex-1 p-4 rounded-3xl border-2 flex-row items-center justify-center ${activeTab === "guests" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-center font-oswald-semibold ${activeTab === "guests" ? "text-gm-navy" : isDarkMode ? "text-white" : "text-slate-400"}`}
              >
                Guest List
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "details" ? (
            /* TAB 1: EVENT DETAILS & 2x2 STATS */
            <ScrollView
              className="p-6"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#4f46e5"
                />
              }
            >
              <View className="flex-row flex-wrap justify-between mb-6">
                <StatBox
                  label="Registered"
                  value={event.registered_count}
                  color="text-indigo-600"
                  isDarkMode={isDarkMode}
                />

                <StatBox
                  label="Currently In"
                  value={event.currently_inside}
                  color="text-emerald-600"
                  isDarkMode={isDarkMode}
                />

                <StatBox
                  label="Pending"
                  value={
                    event.registered_count -
                    event.currently_inside -
                    event.total_checked_out
                  }
                  color="text-blue-600"
                  isDarkMode={isDarkMode}
                />

                <StatBox
                  label="Checked Out"
                  value={event.total_checked_out}
                  color="text-orange-600"
                  isDarkMode={isDarkMode}
                />
              </View>

              <Text className="text-slate-400 font-montserrat-bold uppercase text-[10px] tracking-widest mb-2">
                Event Title
              </Text>
              <Text className="text-lg font-roboto-regular text-slate-900 mb-6">
                {event.title}
              </Text>

              <Text className="text-slate-400 font-montserrat-bold  uppercase text-[10px] tracking-widest mb-2">
                Venue Detail
              </Text>
              <Text className="text-slate-900 font-roboto-regular text-lg mb-6">
                {event.venue_detail || "No detail provided"}
              </Text>

              <Text className="text-slate-400 font-montserrat-bold  uppercase text-[10px] tracking-widest mb-2">
                Time
              </Text>
              <Text className="text-slate-600 text-sm font-roboto-regular uppercase mb-6">
                {event.start_time} - {event.end_time}
              </Text>

              <Text className="text-slate-400 font-montserrat-bold  uppercase text-[10px] tracking-widest">
                Description
              </Text>
              <Text className="text-slate-600 font-roboto-regular leading-6 mb-6">
                {event.description}
              </Text>
            </ScrollView>
          ) : (
            /* TAB 2: GUEST LIST WITH SEARCH */
            <View className="flex-1 p-6">
              <View
                className={`flex-row items-center  px-4 rounded-2xl mb-4 border border-slate-200 ${isDarkMode ? "bg-gm-navy" : "bg-slate-100"}`}
              >
                <Search size={18} color={isDarkMode ? "#D4AF37" : "#94a3b8"} />
                <TextInput
                  placeholder="Search name or access code..."
                  placeholderTextColor="#94a3b8"
                  className={`flex-1 h-12 ml-2 font-roboto-regular ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View className="flex-row gap-2 mb-4">
                {["all", "inside", "out"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilterStatus(status)}
                    className={`flex-1 py-2 rounded-xl border ${
                      filterStatus === status
                        ? "bg-gm-navy border-gm-gold"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <Text
                      className={`text-center text-[10px]  font-oswald-semibold uppercase ${
                        filterStatus === status
                          ? "text-gm-gold"
                          : "text-slate-400"
                      }`}
                    >
                      {status === "inside"
                        ? "Inside"
                        : status === "out"
                          ? "Checked Out"
                          : "All"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bulk Action Button (Only show if there are people inside) */}
              <TouchableOpacity
                onPress={handleCheckAllOut}
                className="bg-rose-50 border border-rose-100 p-3 rounded-2xl mb-4 flex-row justify-center items-center"
              >
                <Text className="text-rose-600 font-oswald-semibold text-xs uppercase tracking-widest">
                  Check All Out
                </Text>
              </TouchableOpacity>

              <FlatList
                data={filteredGuests}
                keyExtractor={(item) => item.id}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#4f46e5"
                  />
                }
                renderItem={({ item }) => {
                  const isCheckedIn = item.is_checked_in;
                  const isCheckedOut = item.is_checked_out;
                  return (
                    <View
                      className={`flex-row items-center justify-between p-4 ${isDarkMode ? "bg-gm-navy" : "bg-white border-slate-200"} border rounded-2xl mb-2 shadow-sm`}
                    >
                      <View>
                        <Text
                          className={`font-oswald-semibold text-[14px] ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                        >
                          {item.guest_name}
                        </Text>
                        <Text
                          style={{
                            fontFamily:
                              Platform.OS === "ios" ? "Courier" : "monospace",
                          }}
                          className={`text-[13px] ${isDarkMode ? "text-gm-gold" : "text-indigo-600 "} font-roboto-regular uppercase tracking-widest"`}
                        >
                          {item.guest_code}
                        </Text>
                      </View>
                      <TouchableOpacity
                        disabled={isCheckedOut || processingId === item.id}
                        onPress={() => handleStatusToggle(item.id)}
                        className={`px-4 py-2 rounded-xl flex-row items-center font-montserrat-bold ${
                          isCheckedOut
                            ? "bg-slate-100"
                            : isCheckedIn
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                        }`}
                      >
                        {processingId === item.id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text
                            className={`font-bold text-xs ${isCheckedOut ? "text-slate-400" : "text-white"}`}
                          >
                            {isCheckedOut
                              ? "DONE"
                              : isCheckedIn
                                ? "CHECK OUT"
                                : "CHECK IN"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

const StatBox = ({
  label,
  value,
  color,
  isDarkMode,
}: {
  label: string;
  value: string | number;
  color: string;
  isDarkMode: boolean;
}) => (
  <View
    className={`${isDarkMode ? "bg-gm-navy border-gm-navy" : "bg-white border-slate-100"} p-4 rounded-2xl w-[48%] mb-4 border items-center`}
  >
    <Text className={`${color} text-2xl font-black`}>{value}</Text>
    <Text className="text-slate-400 text-[9px] font-roboto-regular uppercase">
      {label}
    </Text>
  </View>
);

export default EventDetailModal;
