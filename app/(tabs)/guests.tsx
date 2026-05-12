import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
  ClipboardList,
  Info,
  LogIn,
  LogOut,
  QrCode,
  Search,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  fetchGatePasses,
  getInvitationById,
  logActivityApi,
} from "../services/api";
import { Invitation } from "../services/interfaces";
import { useUser } from "../UserContext";

export default function GatePassesView() {
  const { user } = useUser();
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
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);
  const [invitation, setInvitation] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [scanned, setScanned] = useState(false);

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

  const loadInvitationData = async (id: string) => {
    setFetching(true);
    try {
      const res = await getInvitationById(id);
      if (res.success) {
        setInvitation(res.invitation);
        // Example: Set your form states here
        // setStartDate(res.invitation.start_date);
      } else {
        Alert.alert("Error", res.message || "Could not find invitation");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setFetching(false);
    }
  };

  const isPastTime = (endDate: string, endTime: string) => {
    const [hours, minutes] = endTime.split(":");
    const expiry = new Date(endDate);
    expiry.setHours(parseInt(hours), parseInt(minutes), 0);
    return new Date() > expiry;
  };

  // Status Logic Helper
  const getStatus = (invite: Invitation) => {
    const isExpired = isPastTime(invite.end_date, invite.end_time);
    if (invite.invite_type === "multi_entry") {
      // Import your existing getMultiEntryStatus logic here or call it
      // For brevity in this combined file, using a simplified version:
      if (invite.status === "checked_in")
        return {
          label: "INSIDE",
          container: "bg-emerald-100",
          text: "text-emerald-700",
        };
      return {
        label: "READY",
        container: "bg-indigo-100",
        text: "text-indigo-700",
      };
    }

    if (invite.is_cancelled)
      return {
        label: "CANCELLED",
        container: "bg-rose-100",
        text: "text-rose-700",
      };
    if (invite.status === "checked_in")
      return {
        label: "INSIDE",
        container: "bg-emerald-100",
        text: "text-emerald-700",
      };
    if (invite.status === "checked_out")
      return {
        label: "DEPARTED",
        container: "bg-blue-100",
        text: "text-blue-700",
      };
    if (isExpired && invite.status === "pending")
      return {
        label: "EXPIRED",
        container: "bg-rose-50",
        text: "text-rose-500",
      };

    return {
      label: "READY",
      container: "bg-indigo-100",
      text: "text-indigo-700",
    };
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

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    Alert.alert("Invitation Found", `ID: ${data}`, [
      { text: "OK", onPress: () => setScanned(false) }
    ]);
  };

  const handleLogActivity = async (inviteId: string, currentLabel: string) => {
    const action = currentLabel === "INSIDE" ? "check_out" : "check_in";
    setUpdatingInvite(inviteId);
    try {
      const result = await logActivityApi(inviteId, action);
      if (result.success) loadData();
    } catch (error) {
      Alert.alert("Error", "Action failed.");
    } finally {
      setUpdatingInvite(null);
    }
  };

  // --- RENDER COMPONENT ---
  const renderInvite = ({ item: invite }: { item: Invitation }) => {
    const status = getStatus(invite);
    const canAction = ["READY", "INSIDE"].includes(status.label);

    return (
      <View className="bg-white rounded-[32px] border-t-4 mb-6 shadow-sm p-5 border-indigo-500">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden">
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
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                {invite.invite_type}
              </Text>
            </View>
          </View>
          <View className={`${status.container} px-3 py-1 rounded-lg`}>
            <Text className={`${status.text} text-[10px] font-black`}>
              {status.label}
            </Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-3xl p-4 items-center mb-4">
          <Text className="text-3xl font-mono font-black text-white tracking-[0.15em]">
            {invite.access_code}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleLogActivity(invite.id, status.label)}
            disabled={!canAction || updatingInvite === invite.id}
            className={`flex-1 flex-row h-14 rounded-2xl items-center justify-center ${status.label === "INSIDE" ? "bg-blue-600" : "bg-slate-900"}`}
          >
            {updatingInvite === invite.id ? (
              <ActivityIndicator color="white" />
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
            className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100"
          >
            <Info color="#94a3b8" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
    <View className="flex-1 bg-gray-50">
      {/* HEADER TABS */}
      <View className="flex-row bg-white p-4 shadow-sm border-b border-slate-100">
        <TouchableOpacity
          onPress={() => setActiveTab("verify")}
          className={`flex-1 flex-row justify-center py-4 border-b-4 ${activeTab === "verify" ? "border-indigo-600" : "border-transparent"}`}
        >
          <QrCode
            size={20}
            color={activeTab === "verify" ? "#4f46e5" : "#94a3b8"}
          />
          <Text
            className={`ml-2 font-bold ${activeTab === "verify" ? "text-indigo-900" : "text-slate-400"}`}
          >
            Verify
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("logs")}
          className={`flex-1 flex-row justify-center py-4 border-b-4 ${activeTab === "logs" ? "border-indigo-600" : "border-transparent"}`}
        >
          <ClipboardList
            size={20}
            color={activeTab === "logs" ? "#4f46e5" : "#94a3b8"}
          />
          <Text
            className={`ml-2 font-bold ${activeTab === "logs" ? "text-indigo-900" : "text-slate-400"}`}
          >
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 flex-1">
        {/* SCANNER / SEARCH SECTION */}
        {activeTab === "verify" && (
          <View>
            {!showScanner ? (
              <View className="flex items-center justify-center gap-16 mb-6">
                <View className="h-fit w-full flex gap-3 mt-8">
                  <Text className="text-slate-500 font-bold ml-1 text-center text-xl">
                    Enter Code
                  </Text>
                  <View className="flex-row items-center bg-white h-16 px-4 rounded-2xl border border-slate-200 gap-5 shadow-sm">
                    <TextInput
                      placeholder="Enter Access Code..."
                      placeholderTextColor="#cbd5e1"
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      className="flex-1 ml-3 font-bold text-lg text-slate-800"
                      keyboardType="numeric"
                    />
                    {searchTerm !== "" && (
                      <TouchableOpacity onPress={() => setSearchTerm("")}>
                        <X color="red" size={20} />
                      </TouchableOpacity>
                    )}
                    <Search color="#94a3b8" size={20} />
                  </View>
                </View>
                <Text className="font-black text-slate-300 my-1">OR</Text>
                <View className="flex items-center gap-2">
                  <Text className="text-slate-500 font-bold text-xl">
                    Scan QR
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowScanner(true)}
                    className="w-20 h-20 bg-slate-900 rounded-[24px] items-center justify-center shadow-lg active:scale-95"
                  >
                    <QrCode color="white" size={32} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="h-[500px] w-full rounded-3xl overflow-hidden mb-6 border-2 border-indigo-600">
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowScanner(false)}
                  className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                >
                  <X color="white" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* LOG FILTERS */}
        {activeTab === "logs" && (
          <View className="flex-row mb-6">
            <FilterPill
              label="All"
              count={counts.all}
              active={logFilter === "all"}
              onPress={() => setLogFilter("all")}
            />
            <FilterPill
              label="Inside"
              count={counts.inside}
              active={logFilter === "inside"}
              onPress={() => setLogFilter("inside")}
            />
            <FilterPill
              label="Left"
              count={counts.departed}
              active={logFilter === "departed"}
              onPress={() => setLogFilter("departed")}
            />
            <FilterPill
              label="Stay"
              count={counts.overstayed}
              active={logFilter === "overstayed"}
              onPress={() => setLogFilter("overstayed")}
            />
          </View>
        )}

        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          renderItem={renderInvite}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          // ListEmptyComponent={
          //   <Text className="text-center text-slate-400 mt-20">
          //     No matching invitations
          //   </Text>
          // }
        />
      </View>

      {/* <InvitationDetailModal invite={selectedInvite} onClose={() => setSelectedInvite(null)} /> */}
    </View>
  );
}

const FilterPill = ({ label, count, active, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className={`mr-2 px-4 py-2 rounded-xl border ${active ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-200"}`}
  >
    <Text
      className={`text-[11px] font-bold ${active ? "text-white" : "text-slate-500"}`}
    >
      {label} ({count})
    </Text>
  </TouchableOpacity>
);
