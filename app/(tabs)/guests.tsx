import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Fingerprint,
  Info,
  Lock,
  LogIn,
  LogOut,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InvitationDetailModal from "../Components/InvitationDetail";
import {
  fetchGatePasses,
  getInvitationById,
  logActivityApi,
} from "../services/api";
import { Invitation } from "../services/interfaces";
import { useUser } from "../UserContext";

export default function GatePassesView() {
  const { user, isDarkMode, theme } = useUser();
  const [permission, requestPermission] = useCameraPermissions();

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<"verify" | "logs">("verify");
  const [logFilter, setLogFilter] = useState<
    "all" | "inside" | "departed" | "overstayed"
  >("all");
  const [showScanner, setShowScanner] = useState(false);

  // Data States
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);
  const [searchedInvite, setSearchedInvite] = useState<Invitation | null>(null);
  const [fetching, setFetching] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const isScanningLock = useRef(false);

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

  // Status Logic Helper
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
    const invite = invitations.find((i) => i.id === inviteId) || searchedInvite;
    if (!invite) return;

    const action = currentLabel === "INSIDE" ? "check_out" : "check_in";

    if (action === "check_in") {
      const now = new Date();

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
        if (searchedInvite?.id === inviteId) {
          setSearchedInvite(result.invitation!);
        }
      } else {
        Alert.alert("Denied", result.error || "Action could not be completed.");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not reach the server.");
    } finally {
      setUpdatingInvite(null);
    }
  };

  // --- MEMOIZED DATA & COUNTS ---
  const counts = useMemo(() => {
    return {
      all: invitations.length,
      inside: invitations.filter((i) => i.status === "checked_in").length,
      departed: invitations.filter((i) => i.status === "checked_out").length,
      overstayed: invitations.filter((i) => i.status === "overstayed").length,
    };
  }, [invitations]);

  const displayData = useMemo(() => {
    const query = searchTerm.toLowerCase();
    const base = invitations.filter(
      (inv) =>
        inv.access_code.includes(query) ||
        inv.guest_name.toLowerCase().includes(query),
    );

    if (activeTab === "verify") return base;

    // Logs Filtering
    if (logFilter === "inside")
      return base.filter((i) => i.status === "checked_in");
    if (logFilter === "departed")
      return base.filter((i) => i.status === "checked_out");
    if (logFilter === "overstayed")
      return base.filter((i) => i.status === "overstayed");
    return base;
  }, [activeTab, logFilter, searchTerm, invitations]);

  const handleFinalSearch = async (code: string) => {
    if (!code || isScanningLock.current) return;

    isScanningLock.current = true;
    setScanned(true); // This detaches the listener
    setFetching(true);

    try {
      const res = await getInvitationById(code);
      if (res.success) {
        setSearchedInvite(res.invitation);
        // RESET BOTH HERE
        isScanningLock.current = false;
        setScanned(false); // Re-enables the listener for the next time the scanner opens
      } else {
        Alert.alert("Not Found", "Invalid code.", [
          {
            text: "OK",
            onPress: () => {
              isScanningLock.current = false;
              setScanned(false);
            },
          },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", "Connection failed.", [
        {
          text: "OK",
          onPress: () => {
            isScanningLock.current = false;
            setScanned(false);
          },
        },
      ]);
    } finally {
      setFetching(false);
      setShowScanner(false);
    }
  };

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

    return (
      <View
        className={`${isDarkMode ? "bg-black" : "bg-white"} rounded-[32px] border-t-4 mb-8 shadow-md p-5 ${isMultiEntry ? "border-indigo-500" : "border-emerald-500"} ${invite.is_cancelled ? "opacity-60" : ""}`}
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
                className={`${isDarkMode ? "text-white" : "text-slate-900 "} font-bold text-lg`}
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
            <Text
              className={`${status.text} text-[10px] font-oswald-semibold uppercase`}
            >
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
            className={`${isDarkMode ? "bg-black" : "bg-slate-50"} w-14 h-14 rounded-2xl items-center justify-center border border-slate-100 active:bg-slate-200`}
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
              <View className="mt-2">
                {invite.excluded_dates && invite.excluded_dates.length > 0 ? (
                  /* Give this a fixed height so it actually scrolls */
                  <View className="h-24">
                    <ScrollView
                      nestedScrollEnabled={true} // CRITICAL for Android
                      showsVerticalScrollIndicator={true}
                    >
                      <View className="flex-row flex-wrap gap-1">
                        {/* Your dates mapping here */}
                        {invite.excluded_dates.map((date, index) => (
                          <View
                            key={`${date}-${index}`}
                            className="bg-red-50 px-2 py-1 rounded-md border border-red-100"
                          >
                            <Text className="text-red-600 text-[10px] font-medium">
                              {date.split("-").reverse().join("/")}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-[10px] italic mt-1">
                    No excluded dates for this guest.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!user?.estate_id) {
    return (
      <View
        className={`${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50"} flex-1 justify-center items-center p-6`}
      >
        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-8 rounded-3xl shadow-sm items-center border border-gray-100>`}
        >
          <ShieldCheck size={60} color="#4f46e5" />
          <Text
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gm-navy"} mt-4 text-center`}
          >
            Security Access Restricted
          </Text>
          <TouchableOpacity
            className={`${isDarkMode ? "bg-gm-charcoal" : "bg-gm-navy "} py-4 px-10 rounded-2xl shadow-md mt-6`}
            onPress={() => router.push("/JoinRequest" as any)}
          >
            <Text className="text-white font-bold text-lg">Join an Estate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!user?.is_on_duty) {
    return (
      <View className={`flex-1 justify-center items-center p-6 ${isDarkMode ? 'bg-gm-navy/20': 'bg-gray-50 '}`}>
      <View className={`${isDarkMode ? 'bg-gm-navy': 'bg-white '} p-8 rounded-[40px] shadow-xl items-center border border-slate-100 w-full max-w-sm`}>
          <View className="w-20 h-20 bg-rose-50 rounded-3xl items-center justify-center mb-6 rotate-3">
            <ShieldAlert size={44} color="#e11d48" />
          </View>

          <Text className={`${isDarkMode ? "text-white" : "text-gm-navy"} text-2xl font-montserrat-extrabold text-center uppercase tracking-tighter`}>
            Duty Status Required
          </Text>

          <Text className={`text-center mt-3 font-oswald-semibold leading-5 px-2 ${isDarkMode ? "text-white" : "text-gm-navy"} `}>
            You cannot verify guests while{" "}
            <Text className="text-rose-600 font-bold">OFF DUTY</Text>. Please
            return to the dashboard to clock in.
          </Text>

          <TouchableOpacity
            className="bg-slate-900 w-full py-5 rounded-[24px] shadow-lg mt-8 flex-row justify-center items-center active:bg-slate-800"
            onPress={() => router.push("/dashboard" as any)}
          >
            <LogIn size={20} color="white" />
            <Text className="text-white font-montserrat-bold text-lg ml-2 uppercase tracking-widest">
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission?.granted && activeTab === "verify") {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <QrCode size={80} color="#4f46e5" />
        <Text className="text-center my-4 font-medium text-slate-600">
          Camera access needed for scanning.
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 p-4 rounded-2xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold">Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50 "}`}>
      {/* HEADER TABS */}
      <View
        className={`flex-row ${isDarkMode ? "bg-black" : "border-slate-100 bg-white"} border-b p-4 shadow-sm`}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("verify")}
          className={`flex-1 flex-row justify-center items-center py-4 border-b-4 ${activeTab === "verify" ? (isDarkMode ? "border-gm-gold" : "border-gm-navy") : "border-transparent"}`}
        >
          <QrCode
            size={20}
            color={activeTab === "verify" ? theme.accent : "#94a3b8"}
          />
          <Text
            className={`ml-2 font-oswald-semibold tracking-widest ${activeTab === "verify" ? (isDarkMode ? "text-gm-gold" : "text-gm-navy") : "text-slate-400"}`}
          >
            Verify
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActiveTab("logs");
            onRefresh();
          }}
          className={`flex-1 flex-row justify-center items-center py-4 border-b-4 ${activeTab === "logs" ? (isDarkMode ? "border-gm-gold" : "border-gm-navy") : "border-transparent"}`}
        >
          <ClipboardList
            size={20}
            color={activeTab === "logs" ? theme.accent : "#94a3b8"}
          />
          <Text
            className={`ml-2 font-oswald-semibold tracking-widest ${activeTab === "logs" ? (isDarkMode ? "text-gm-gold" : "text-gm-navy") : "text-slate-400"}`}
          >
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 flex-1">
        {/* SCANNER / SEARCH SECTION */}
        {activeTab === "verify" && (
          <ScrollView
            className="flex-1 pt-2"
            contentContainerStyle={{
              paddingBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {fetching ? (
              <View className="flex-1 justify-center items-center py-20">
                <View
                  className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-10 rounded-[40px] border border-slate-50 items-center`}
                >
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text
                    className={`${isDarkMode ? "text-gm-gold" : "text-gm-charcoal"} mt-6 font-roboto-regular uppercase tracking-[2px] text-xs`}
                  >
                    Verifying Code...
                  </Text>
                </View>
              </View>
            ) : searchedInvite ? (
              <View
                className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} rounded-[32px] p-6 border-2 border-emerald-500`}
              >
                {/* Header Section */}
                <View className="items-center mb-6">
                  <View className="bg-emerald-100 p-3 rounded-full mb-2">
                    <ShieldCheck size={32} color="#10b981" />
                  </View>
                  <Text className="text-emerald-600 font-black text-xl uppercase tracking-widest">
                    Invitation Found
                  </Text>
                </View>

                {/* Your Pass Component - Contained to prevent warping */}
                <View className="mb-3">
                  {renderInvite({ item: searchedInvite })}
                </View>

                {/* Action Buttons */}
                <View className="flex-row justify-center gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowScanner(false);
                      setSearchedInvite(null);
                      setSearchTerm("");
                      setScanned(false);
                      isScanningLock.current = false;
                    }}
                    className="px-6 py-5 rounded-2xl items-center border border-slate-200"
                  >
                    <X color="red" size={20} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : !showScanner ? (
              <View className="flex items-center justify-center gap-16 mb-6">
                <View className="h-fit w-full flex gap-3 mt-2 ">
                  <Text className="text-gm-charcoal font-montserrat-bold ml-1 text-center text-xl">
                    Enter Code
                  </Text>
                  <View
                    className={`flex-row items-center ${isDarkMode ? "bg-gm-navy" : "bg-white"} h-16 px-4 rounded-2xl border border-slate-200 gap-5`}
                  >
                    <TextInput
                      placeholder="Enter Access Code..."
                      placeholderTextColor="#cbd5e1"
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      className={`flex-1 ml-3 font-roboto-regular text-lg ${isDarkMode ? "text-white" : "text-gm-charcoal"}`}
                      keyboardType="numeric"
                    />
                    {searchTerm !== "" && (
                      <TouchableOpacity
                        className="mx-2"
                        onPress={() => setSearchTerm("")}
                      >
                        <X color="red" size={20} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      className="mx-2"
                      onPress={() => handleFinalSearch(searchTerm)}
                    >
                      <Search color={theme.accent} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className=" font-montserrat-bold text-slate-500 my-1">
                  OR
                </Text>
                <View className="flex items-center gap-2">
                  <Text className="text-gm-charcoal font-montserrat-bold text-xl">
                    Scan QR
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScanner(true)}
                    className={`w-20 h-20 ${isDarkMode ? "bg-gm-navy" : "bg-slate-200"} rounded-[24px] items-center justify-center shadow-lg active:scale-95`}
                  >
                    <QrCode
                      color={isDarkMode ? "#D4AF37" : "black"}
                      size={32}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="h-[500px] w-full rounded-3xl overflow-hidden mb-6 border-2 border-indigo-600">
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  // onBarcodeScanned={({ data }) => {
                  //   console.log("Scanned Data new 2:", data);
                  // }}
                  onBarcodeScanned={
                    scanned ? undefined : ({ data }) => handleFinalSearch(data)
                  }
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />
                <View className="absolute inset-0">
                  {/* Top Dimmed Area */}
                  <View className="flex-1 bg-black/40" />

                  {/* Center Scanning "Hole" */}
                  <View className="flex-row h-64">
                    <View className="flex-1 bg-black/40" />

                    {/* THE FOCUS BOX */}
                    <View className="w-64 h-64 bg-transparent relative">
                      {/* Corner Brackets using GateMan Gold */}
                      <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gm-gold rounded-tl-lg" />
                      <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gm-gold rounded-tr-lg" />
                      <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gm-gold rounded-bl-lg" />
                      <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gm-gold rounded-br-lg" />

                      {/* Scanning Line (Visual feedback) */}
                      <View className="absolute top-1/2 left-2 right-2 h-[1px] bg-gm-gold/50" />
                    </View>

                    <View className="flex-1 bg-black/40" />
                  </View>

                  {/* Bottom Dimmed Area */}
                  <View className="flex-1 bg-black/40 items-center justify-center">
                    <Text className="text-white font-bold text-xs uppercase tracking-[3px]">
                      Align QR Code
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => {
                    setShowScanner(false);
                    setScanned(false);
                  }}
                  className="absolute top-6 right-6 bg-slate-900/80 w-10 h-10 items-center justify-center rounded-full"
                >
                  <X color="white" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* LOG FILTERS */}
        {activeTab === "logs" && (
          <View className="flex-1 space-y-3">
            <View className="flex-row mb-6 justify-evenly w-full">
              <FilterPill
                label="All"
                count={counts.all}
                active={logFilter === "all"}
                onPress={() => setLogFilter("all")}
                isDarkMode={isDarkMode}
              />
              <FilterPill
                label="Inside"
                count={counts.inside}
                active={logFilter === "inside"}
                onPress={() => setLogFilter("inside")}
                isDarkMode={isDarkMode}
              />
              <FilterPill
                label="Left"
                count={counts.departed}
                active={logFilter === "departed"}
                onPress={() => setLogFilter("departed")}
                isDarkMode={isDarkMode}
              />
              <FilterPill
                label="Stay"
                count={counts.overstayed}
                active={logFilter === "overstayed"}
                onPress={() => setLogFilter("overstayed")}
                isDarkMode={isDarkMode}
              />
            </View>

            <FlatList
              data={displayData}
              keyExtractor={(item) => item.id}
              renderItem={renderInvite}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text className="text-center text-slate-400 mt-20">
                  No matching invitations
                </Text>
              }
            />
          </View>
        )}
      </View>

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

const FilterPill = ({ label, count, active, onPress, isDarkMode }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`mr-2 px-4 py-2 rounded-xl ${isDarkMode ? "border border-gm-gold" : ""} ${active ? "bg-gm-navy" : "bg-white"}`}
  >
    <Text
      className={`text-[11px] font-oswald-semibold ${active ? "text-gm-gold" : "text-slate-500"}`}
    >
      {label} ({count})
    </Text>
  </TouchableOpacity>
);
