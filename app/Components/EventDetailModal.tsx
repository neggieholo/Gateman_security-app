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
import { SafeAreaView } from "react-native-safe-area-context";
import { checkAllOut, toggleGuestStatus } from "../services/api";
import { EstateEvent } from "../services/interfaces";

const EventDetailModal = ({
  event,
  onClose,
  onRefresh,
}: {
  event: EstateEvent;
  onClose: () => void;
  onRefresh: () => void;
}) => {
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
      <SafeAreaView className="flex-1 bg-white">
        {/* Modal Header */}
        <View className="p-4 flex-row items-center border-b border-slate-100">
          <TouchableOpacity onPress={onClose} className="p-2">
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-bold text-lg text-slate-900 mr-8">
            Event Management
          </Text>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row gap-3 p-2 bg-slate-100 mx-6 mt-4 rounded-2xl">
          <TouchableOpacity
            onPress={() => setActiveTab("details")}
            className={`flex-1 p-4 rounded-3xl border-2 flex-row items-center justify-center ${activeTab === "details" ? "bg-white" : ""}`}
          >
            <Text
              className={`text-center font-bold ${activeTab === "details" ? "text-indigo-600" : "text-slate-400"}`}
            >
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("guests")}
            className={`flex-1 p-4 rounded-3xl border-2 flex-row items-center justify-center ${activeTab === "guests" ? "bg-white" : ""}`}
          >
            <Text
              className={`text-center font-bold ${activeTab === "guests" ? "text-indigo-600" : "text-slate-400"}`}
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
              />

              <StatBox
                label="Currently In"
                value={event.currently_inside}
                color="text-emerald-600"
              />

              <StatBox
                label="Pending"
                value={
                  event.registered_count -
                  event.currently_inside -
                  event.total_checked_out
                }
                color="text-blue-600"
              />

              <StatBox
                label="Checked Out"
                value={event.total_checked_out}
                color="text-orange-600"
              />
            </View>

            <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">
              Event Title
            </Text>
            <Text className="text-lg font-bold text-slate-900 mb-6">
              {event.title}
            </Text>

            <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">
              Venue Detail
            </Text>
            <Text className="text-slate-900 font-bold text-lg mb-6">
              {event.venue_detail || "No detail provided"}
            </Text>

            <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">
              Description
            </Text>
            <Text className="text-slate-600 leading-6 mb-6">
              {event.description}
            </Text>

            <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">
              Time
            </Text>
            <Text className="text-slate-600 text-sm font-bold uppercase">
              {event.start_time} - {event.end_time}
            </Text>
          </ScrollView>
        ) : (
          /* TAB 2: GUEST LIST WITH SEARCH */
          <View className="flex-1 p-6">
            <View className="flex-row items-center bg-slate-100 px-4 rounded-2xl mb-4 border border-slate-200">
              <Search size={18} color="#94a3b8" />
              <TextInput
                placeholder="Search name or access code..."
                placeholderTextColor="#94a3b8"
                className="flex-1 h-12 ml-2 font-bold text-slate-700"
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
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-center text-[10px] font-bold uppercase ${
                      filterStatus === status ? "text-white" : "text-slate-400"
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
              <Text className="text-rose-600 font-bold text-xs uppercase tracking-widest">
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
                  <View className="flex-row items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl mb-2 shadow-sm">
                    <View>
                      <Text className="font-bold text-[14px] text-slate-900">
                        {item.guest_name}
                      </Text>
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === "ios" ? "Courier" : "monospace",
                        }}
                        className="text-[13px] text-indigo-600 font-black uppercase tracking-widest"
                      >
                        {item.guest_code}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={isCheckedOut || processingId === item.id}
                      onPress={() => handleStatusToggle(item.id)}
                      className={`px-4 py-2 rounded-xl flex-row items-center ${
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
    </Modal>
  );
};

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) => (
  <View className="bg-slate-50 p-4 rounded-2xl w-[48%] mb-4 border border-slate-100 items-center">
    <Text className={`${color} text-2xl font-black`}>{value}</Text>
    <Text className="text-slate-400 text-[9px] font-bold uppercase">
      {label}
    </Text>
  </View>
);

export default EventDetailModal;
