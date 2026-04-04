import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { 
  Calendar, 
  Clock, 
  User, 
  Fingerprint,
  RefreshCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  LogIn,
  LogOut,
  Lock,
} from 'lucide-react-native';
import { fetchGatePasses, logActivityApi } from '../services/api';
import { Invitation } from '../services/interfaces';

export default function GatePassesView() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);

  const loadData = async () => {
    const data = await fetchGatePasses();
    setInvitations(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isPastTime = (endDate: string, endTime: string) => {
    const [hours, minutes] = endTime.split(":");
    const expiry = new Date(endDate);
    expiry.setHours(parseInt(hours), parseInt(minutes), 0);
    return new Date() > expiry;
  };

  const getMultiEntryStatus = (invite: Invitation) => {
    if (invite.is_cancelled) return { label: "CANCELLED", container: "bg-rose-100", text: "text-rose-700" };
    
    const now = new Date();
    const toLocalDateStr = (d: any) => d ? new Date(d).toISOString().split('T')[0] : "";
    const todayStr = toLocalDateStr(now);
    
    const [endH, endM] = invite.end_time.split(":");
    const overallExpiry = new Date(invite.end_date);
    overallExpiry.setHours(parseInt(endH), parseInt(endM), 0);
    
    if (now > overallExpiry) return { label: "EXPIRED", container: "bg-rose-50", text: "text-rose-500" };
    if (invite.excluded_dates?.includes(todayStr)) return { label: "NOT ALLOWED TODAY", container: "bg-amber-100", text: "text-amber-700" };

    const isCheckedInToday = toLocalDateStr(invite.actual_checkin_date) === todayStr;
    const isCheckedOutToday = toLocalDateStr(invite.actual_checkout_date) === todayStr;

    if ((invite.status === 'checked_in' || isCheckedInToday) && !isCheckedOutToday) {
      const todayCutoff = new Date();
      todayCutoff.setHours(parseInt(endH), parseInt(endM), 0);
      return now > todayCutoff 
        ? { label: "OVERSTAYED", container: "bg-red-100", text: "text-red-700" }
        : { label: "INSIDE", container: "bg-emerald-100", text: "text-emerald-700" };
    }

    if (isCheckedOutToday) return { label: "DEPARTED TODAY", container: "bg-blue-100", text: "text-blue-700" };
    
    const startDate = toLocalDateStr(invite.start_date);
    const endDate = toLocalDateStr(invite.end_date);
    if (todayStr >= startDate && todayStr <= endDate) return { label: "NOT ARRIVED TODAY", container: "bg-slate-100", text: "text-slate-500" };

    return { label: "UPCOMING", container: "bg-slate-50", text: "text-slate-400" };
  };

  const getStatusDetails = (status: string, isExpired: boolean, startDate: string, isCancelled: boolean) => {
    if (isCancelled) return { label: "CANCELLED", container: "bg-rose-100", text: "text-rose-700" };
    const now = new Date();
    const today = new Date(now.setHours(0,0,0,0));
    const startDay = new Date(new Date(startDate).setHours(0,0,0,0));

    if (status === "pending" && today < startDay) return { label: "UPCOMING", container: "bg-indigo-50", text: "text-indigo-500" };
    if (status === "pending" && isExpired) return { label: "EXPIRED", container: "bg-rose-50", text: "text-rose-500" };

    switch (status) {
      case "checked_in": return { label: "INSIDE", container: "bg-emerald-100", text: "text-emerald-700" };
      case "checked_out": return { label: "DEPARTED", container: "bg-blue-100", text: "text-blue-700" };
      case "overstayed": return { label: "OVERSTAYED", container: "bg-amber-100", text: "text-amber-700" };
      default: return { label: "NOT ARRIVED", container: "bg-slate-100", text: "text-slate-600" };
    }
  };

  const handleLogActivity = async (inviteId: string, currentLabel: string) => {
  setUpdatingInvite(inviteId);
  const action = currentLabel === "INSIDE" ? "check_out" : "check_in"; 
  
  try {
    const result = await logActivityApi(inviteId, action);
    
    // Check if success is true AND result.invitation is not null/undefined
    if (result.success && result.invitation) {
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === inviteId ? result.invitation! : inv))
      );
    } else {
      Alert.alert("Denied", result.error || "Could not update status");
    }
  } catch (error) {
    Alert.alert("Error", "Network error occurred.");
  } finally {
    setUpdatingInvite(null);
  }
};

  const filteredInvites = invitations.filter(inv => 
    inv.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.access_code.includes(searchTerm)
  );

  const renderInvite = ({ item: invite }: { item: Invitation }) => {
    const isExpired = isPastTime(invite.end_date, invite.end_time);
    const isMultiEntry = invite.invite_type === "multi_entry";
    const status = isMultiEntry 
      ? getMultiEntryStatus(invite) 
      : getStatusDetails(invite.status, isExpired, invite.start_date, invite.is_cancelled);
    
    const canAction = ["NOT ARRIVED", "NOT ARRIVED TODAY", "INSIDE", "ARRIVED TODAY"].includes(status.label);

    return (
      <View className={`bg-white rounded-[32px] border-t-4 mb-6 shadow-sm p-5 ${isMultiEntry ? 'border-indigo-500' : 'border-emerald-500'} ${invite.is_cancelled ? 'opacity-60' : ''}`}>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-slate-100 rounded-2xl items-center justify-center overflow-hidden border border-slate-50">
              {invite.guest_image_url ? (
                <Image source={{ uri: invite.guest_image_url }} className="w-full h-full" />
              ) : (
                <User color="#94a3b8" size={24} />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-slate-900 text-lg" numberOfLines={1}>{invite.guest_name}</Text>
              <View className="flex-row items-center">
                <Fingerprint size={12} color="#6366f1" />
                <Text className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-tighter">
                  {invite.invite_type.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
          <View className={`${status.container} px-3 py-1 rounded-lg`}>
            <Text className={`${status.text} text-[10px] font-black uppercase`}>{status.label}</Text>
          </View>
        </View>

        <View className="bg-slate-900 rounded-3xl p-4 items-center mb-4 shadow-lg">
          <Text className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-1">Access Code</Text>
          <Text className="text-3xl font-mono font-black text-white tracking-[0.15em]">{invite.access_code}</Text>
        </View>

        <View className="space-y-2 mb-4">
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Calendar size={14} color="#818cf8" />
              <Text className="text-slate-400 text-xs italic ml-2">Validity</Text>
            </View>
            <Text className="text-slate-700 font-bold text-xs">
              {new Date(invite.start_date).toLocaleDateString('en-GB')}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Clock size={14} color="#818cf8" />
              <Text className="text-slate-400 text-xs italic ml-2">Hours</Text>
            </View>
            <Text className="text-slate-700 font-bold text-xs">
              {invite.start_time.slice(0,5)} — {invite.end_time.slice(0,5)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity 
            disabled={!canAction || updatingInvite === invite.id}
            onPress={() => handleLogActivity(invite.id, status.label)}
            className={`flex-1 flex-row h-14 rounded-2xl items-center justify-center ${
              !canAction ? 'bg-slate-200' : status.label === 'INSIDE' ? 'bg-blue-600' : 'bg-slate-900'
            }`}
          >
            {updatingInvite === invite.id ? (
              <ActivityIndicator color="white" size="small" />
            ) : !canAction ? (
              <>
                <Lock color="#94a3b8" size={16} />
                <Text className="text-slate-500 font-bold ml-2">RESTRICTED</Text>
              </>
            ) : (
              <>
                {status.label === 'INSIDE' ? <LogOut color="white" size={18} /> : <LogIn color="white" size={18} />}
                <Text className="text-white font-bold ml-2">{status.label === 'INSIDE' ? 'CHECK OUT' : 'CHECK IN'}</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity className="w-14 h-14 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100">
            <Info color="#94a3b8" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      {/* Search Header */}
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-slate-400 font-bold">No invitations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}