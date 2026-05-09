import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Info,
  Lock,
  LogIn,
  LogOut,
  RefreshCcw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InvitationDetailModal from "../Components/InvitationDetail";
import { fetchGatePasses, logActivityApi } from "../services/api";
import { Invitation } from "../services/interfaces";
import { router } from "expo-router";
import { useUser } from "../UserContext";

export default function GatePassesView() {
  const {user} = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchGatePasses();
      setInvitations(data);
    } catch (error) {
      Alert.alert("Sync Error", "Could not fetch latest passes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isPastTime = (endDate: string, endTime: string) => {
    const [hours, minutes] = endTime.split(":");
    const expiry = new Date(endDate);
    expiry.setHours(parseInt(hours), parseInt(minutes), 0);
    return new Date() > expiry;
  };

  const getMultiEntryStatus = (invite: Invitation) => {
    if (invite.is_cancelled) {
      return {
        label: "CANCELLED",
        container: "bg-rose-100",
        text: "text-rose-700",
      };
    }

    const now = new Date();
    const toLocalDateStr = (d: any): string => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-CA");
    };

    const todayStr = toLocalDateStr(now);
    const checkinDateStr = toLocalDateStr(invite.actual_checkin_date);
    const checkoutDateStr = toLocalDateStr(invite.actual_checkout_date);

    // Setup Times for Today
    const [startH, startM] = invite.start_time.split(":");
    const [endH, endM] = invite.end_time.split(":");

    const todayStart = new Date();
    todayStart.setHours(parseInt(startH), parseInt(startM), 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(parseInt(endH), parseInt(endM), 0, 0);

    // 1. GLOBAL EXPIRY (Check if the entire multi-entry period is over)
    const overallExpiry = new Date(invite.end_date);
    overallExpiry.setHours(parseInt(endH), parseInt(endM), 0);
    if (now > overallExpiry) {
      return {
        label: "EXPIRED",
        container: "bg-rose-50",
        text: "text-rose-500",
      };
    }

    // 2. EXCLUSION CHECK
    if (invite.excluded_dates?.includes(todayStr)) {
      return {
        label: "NOT ALLOWED TODAY",
        container: "bg-amber-100",
        text: "text-amber-700",
      };
    }

    // 3. OVERSTAYED FROM A PREVIOUS DAY ("Zombie" check-in)
    if (checkinDateStr && checkinDateStr < todayStr) {
      if (!checkoutDateStr || checkoutDateStr < checkinDateStr) {
        return {
          label: "OVERSTAYED (PAST)",
          container: "bg-red-100",
          text: "text-red-700",
        };
      }
    }

    const isCheckedInToday = checkinDateStr === todayStr;
    const isCheckedOutToday = checkoutDateStr === todayStr;

    // 4. LOGIC FOR GUESTS CURRENTLY INSIDE TODAY
    if (isCheckedInToday && !isCheckedOutToday) {
      if (now > todayEnd) {
        return {
          label: "OVERSTAYED TODAY",
          container: "bg-red-100",
          text: "text-red-700",
        };
      }
      return {
        label: "INSIDE",
        container: "bg-emerald-100",
        text: "text-emerald-700",
      };
    }

    // 5. DEPARTED TODAY
    if (isCheckedOutToday) {
      return {
        label: "DEPARTED TODAY",
        container: "bg-blue-100",
        text: "text-blue-700",
      };
    }

    // 6. EXPIRED TODAY (Window closed, no check-in occurred)
    if (!isCheckedInToday && now > todayEnd) {
      return {
        label: "EXPIRED TODAY",
        container: "bg-rose-50",
        text: "text-rose-400",
      };
    }

    // 7. NOT ARRIVED TODAY (Within daily hours)
    const startDate = toLocalDateStr(invite.start_date);
    const endDate = toLocalDateStr(invite.end_date);

    if (startDate && endDate && todayStr >= startDate && todayStr <= endDate) {
      // If it's too early for the daily window
      if (now < todayStart) {
        return {
          label: "NOT ARRIVED TODAY",
          container: "bg-slate-100",
          text: "text-slate-500",
        };
      }
      // If it's currently within the window
      return {
        label: "READY FOR ENTRY",
        container: "bg-indigo-100",
        text: "text-indigo-700",
      };
    }

    return {
      label: "UPCOMING",
      container: "bg-slate-50",
      text: "text-slate-400",
    };
  };

  const getStatusDetails = (
    status: string,
    isExpired: boolean,
    startDate: string, // Added this parameter
    isCancelled: boolean,
    startTime: string,
  ) => {
    if (isCancelled) {
      return {
        label: "CANCELLED",
        container: "bg-rose-100",
        text: "text-rose-700",
      };
    }

    const now = new Date();
    const start = new Date(startDate);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const startDay = new Date(start.setHours(0, 0, 0, 0));

    // 1. Check if the invitation hasn't started yet (Future date)
    if (status === "pending" && today < startDay) {
      return {
        label: "UPCOMING",
        container: "bg-indigo-50",
        text: "text-indigo-500",
      };
    }

    // 2. Check if the invitation is past its end date/time
    if (status === "pending" && isExpired) {
      return {
        label: "EXPIRED",
        container: "bg-rose-50",
        text: "text-rose-500",
      };
    }

    // 3. Logic for "Pending" invites that are valid TODAY
    if (status === "pending") {
      const [startH, startM] = startTime.split(":");
      const todayStartTime = new Date();
      todayStartTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

      // If today is the day and current time is >= start time
      if (now >= todayStartTime) {
        return {
          label: "READY FOR ENTRY",
          container: "bg-indigo-100",
          text: "text-indigo-700",
        };
      }

      return {
        label: "NOT ARRIVED",
        container: "bg-slate-100",
        text: "text-slate-600",
      };
    }

    // 4. Normal Status Switch for non-pending
    switch (status) {
      case "checked_in":
        return {
          label: "INSIDE",
          container: "bg-emerald-100",
          text: "text-emerald-700",
        };
      case "checked_out":
        return {
          label: "DEPARTED",
          container: "bg-blue-100",
          text: "text-blue-700",
        };
      case "overstayed":
        return {
          label: "OVERSTAYED",
          container: "bg-amber-100",
          text: "text-amber-700",
        };
      default:
        return {
          label: status.toUpperCase(),
          container: "bg-slate-100",
          text: "text-slate-600",
        };
    }
  };

  const handleLogActivity = async (inviteId: string, currentLabel: string) => {
    const invite = invitations.find((i) => i.id === inviteId);
    if (!invite) return;

    const action = currentLabel === "INSIDE" ? "check_out" : "check_in";

    if (action === "check_in") {
      const now = new Date();

      // 1. First, check if the overall invitation is expired (Date check)
      // This handles the "can't check in after expiry" requirement
      if (isPastTime(invite.end_date, invite.end_time)) {
        Alert.alert("Access Denied", "This invitation has officially expired.");
        return;
      }

      // 2. Daily Time Window Check
      const [startH, startM] = invite.start_time.split(":");
      const [endH, endM] = invite.end_time.split(":");

      // Create comparison points for TODAY specifically
      const todayStart = new Date();
      todayStart.setHours(parseInt(startH), parseInt(startM), 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(parseInt(endH), parseInt(endM), 0, 0);

      // Block Early Entry
      if (now < todayStart) {
        Alert.alert(
          "Too Early",
          `Check-in for today starts at ${invite.start_time.slice(0, 5)}.`,
        );
        return;
      }

      // Block Late Entry (Even if not expired yet, can't enter after daily hours)
      if (now > todayEnd) {
        Alert.alert(
          "Window Closed",
          `Daily entry window ended at ${invite.end_time.slice(0, 5)}.`,
        );
        return;
      }
    }

    // If validation passes, proceed with API call
    setUpdatingInvite(inviteId);
    try {
      const result = await logActivityApi(inviteId, action);
      if (result.success && result.invitation) {
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === inviteId ? result.invitation! : inv)),
        );
      } else {
        Alert.alert("Denied", result.error || "Action could not be completed.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not reach the server.");
    } finally {
      setUpdatingInvite(null);
    }
  };

  const filteredInvites = invitations.filter(
    (inv) =>
      inv.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.access_code.includes(searchTerm),
  );

  const renderInvite = ({ item: invite }: { item: Invitation }) => {
    const isExpired = isPastTime(invite.end_date, invite.end_time);
    const isExpanded = expandedId === invite.id;
    const isMultiEntry = invite.invite_type === "multi_entry";
    const status = isMultiEntry
      ? getMultiEntryStatus(invite)
      : getStatusDetails(
          invite.status,
          isExpired,
          invite.start_date,
          invite.is_cancelled,
          invite.start_time,
        );

    const canAction = [
      "NOT ARRIVED",
      "NOT ARRIVED TODAY",
      "READY FOR ENTRY",
      "INSIDE",
      "ARRIVED TODAY",
    ].includes(status.label);

    if (!user?.estate_id) {
      return (
        <View className="flex-1 justify-center items-center p-6 bg-gray-50">
          <View className="bg-white p-8 rounded-3xl shadow-sm items-center border border-gray-100">
            <ShieldCheck size={60} color="#4f46e5" />
            <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
              Security Access Restricted
            </Text>
            <TouchableOpacity
              className="bg-indigo-600 py-4 px-10 rounded-2xl shadow-md mt-6"
              onPress={() => router.push("/JoinRequest" as any)}
            >
              <Text className="text-white font-bold text-lg">
                Join an Estate
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View
        className={`bg-white rounded-[32px] border-t-4 mb-8 shadow-md p-5 ${isMultiEntry ? "border-indigo-500" : "border-emerald-500"} ${invite.is_cancelled ? "opacity-60" : ""}`}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-slate-100 rounded-2xl items-center justify-center overflow-hidden border border-slate-50">
              {invite.guest_image_url ? (
                <Image
                  source={{ uri: invite.guest_image_url }}
                  className="w-full h-full"
                />
              ) : (
                <User color="#94a3b8" size={24} />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="font-bold text-slate-900 text-lg"
                numberOfLines={1}
              >
                {invite.guest_name}
              </Text>
              <View className="flex-row items-center">
                <Fingerprint size={12} color="#6366f1" />
                <Text className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-tighter">
                  {invite.invite_type.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>
          <View className={`${status.container} px-3 py-1 rounded-lg`}>
            <Text className={`${status.text} text-[10px] font-black uppercase`}>
              {status.label}
            </Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-3xl p-4 items-center mb-4">
          <Text className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-1">
            Access Code
          </Text>
          <Text className="text-3xl font-mono font-black text-white tracking-[0.15em]">
            {invite.access_code}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            disabled={!canAction || updatingInvite === invite.id}
            onPress={() => handleLogActivity(invite.id, status.label)}
            className={`flex-1 flex-row h-14 rounded-2xl items-center justify-center ${
              !canAction
                ? "bg-slate-200"
                : status.label === "INSIDE"
                  ? "bg-blue-600"
                  : "bg-slate-900"
            }`}
          >
            {updatingInvite === invite.id ? (
              <ActivityIndicator color="white" size="small" />
            ) : !canAction ? (
              <View className="flex-row items-center">
                <Lock color="#94a3b8" size={16} />
                <Text className="text-slate-500 font-bold ml-2">
                  RESTRICTED
                </Text>
              </View>
            ) : (
              <>
                {status.label === "INSIDE" ? (
                  <LogOut color="white" size={18} />
                ) : (
                  <LogIn color="white" size={18} />
                )}
                <Text className="text-white font-bold ml-2">
                  {status.label === "INSIDE" ? "CHECK OUT" : "CHECK IN"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedInvite(invite)}
            className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100 active:bg-slate-200"
          >
            <Info color="#94a3b8" size={24} />
          </TouchableOpacity>
        </View>
        {isMultiEntry && (
          <View className="mt-2 border-t border-gray-50 pt-2">
            {/* The Toggle Row */}
            <TouchableOpacity
              onPress={() => toggleExpand(invite.id!)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-gray-500 text-[10px] font-bold uppercase">
                Exclusion Dates
              </Text>
              <View className="ml-2">
                {isExpanded ? (
                  <ChevronUp size={18} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={18} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>

            {/* The Conditional Expansion */}
            {isExpanded && (
              <>
                {invite.excluded_dates && invite.excluded_dates.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {invite.excluded_dates.map((date) => (
                      <View
                        key={date}
                        className="bg-red-50 px-2 py-1 rounded-md border border-red-100"
                      >
                        <Text className="text-red-600 text-[10px] font-medium">
                          {date.split("-").reverse().join("/")}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-400 text-[10px] italic mt-1">
                    No excluded dates for this guest.
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="flex-row items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <View className="flex-1 flex-row items-center px-3">
          <Search color="#94a3b8" size={20} />
          <TextInput
            placeholder="Search guest or code..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            className="flex-1 ml-2 h-10 font-medium text-slate-700"
          />
        </View>
        <TouchableOpacity onPress={onRefresh} className="p-2 mr-1">
          <RefreshCcw color="#6366f1" size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" className="mt-20" />
      ) : (
        <FlatList
          data={filteredInvites}
          keyExtractor={(item) => item.id}
          renderItem={renderInvite}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <Text className="text-center text-slate-400 mt-20">
              No invitations found
            </Text>
          }
        />
      )}

      <InvitationDetailModal
        invite={selectedInvite}
        onClose={() => setSelectedInvite(null)}
        statusDetails={
          selectedInvite
            ? selectedInvite.invite_type === "multi_entry"
              ? getMultiEntryStatus(selectedInvite)
              : getStatusDetails(
                  selectedInvite.status,
                  isPastTime(selectedInvite.end_date, selectedInvite.end_time),
                  selectedInvite.start_date,
                  selectedInvite.is_cancelled,
                  selectedInvite.start_time,
                )
            : null
        }
      />
    </View>
  );
}
