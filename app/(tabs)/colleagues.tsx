import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { getSecurityColleagues } from "../services/api";
import { Users, MapPin } from "lucide-react-native";

interface Guard {
  id: string;
  name: string;
  email: string;
  avatar: string;
  is_on_duty: boolean;
}

export default function SecurityColleagues() {
  const [allGuards, setAllGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "DUTY">("ALL");

  const fetchColleagues = async () => {
    const res = await getSecurityColleagues();
    if (res.success) {
      setAllGuards(res.securityGuards);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchColleagues();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchColleagues();
  };

  // Filter logic for tabs
  const displayedGuards = activeTab === "ALL" 
    ? allGuards 
    : allGuards.filter(g => g.is_on_duty);

  const renderGuardItem = ({ item }: { item: Guard }) => (
    <View className="flex-row items-center bg-white p-4 mb-3 rounded-2xl border border-gray-100 shadow-sm">
      {/* Avatar with Status Indicator */}
      <View>
        <Image
          source={{ uri: item.avatar || 'https://via.placeholder.com/150' }}
          className="w-14 h-14 rounded-full bg-gray-200"
        />
        {item.is_on_duty && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      {/* Info */}
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.email}</Text>
        <View className="flex-row items-center mt-1">
          <View className={`px-2 py-0.5 rounded-md ${item.is_on_duty ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Text className={`text-[10px] font-bold ${item.is_on_duty ? 'text-green-700' : 'text-gray-500'}`}>
              {item.is_on_duty ? "ON DUTY" : "OFF DUTY"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button (Optional: for calling or messaging) */}
      <TouchableOpacity className="bg-gray-50 p-3 rounded-full">
         <MapPin size={20} color="#6366f1" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-4 pt-12">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Colleagues</Text>

      {/* Custom Tab Switcher */}
      <View className="flex-row bg-gray-200 p-1 rounded-xl mb-6">
        <TouchableOpacity 
          onPress={() => setActiveTab("ALL")}
          className={`flex-1 py-3 rounded-lg ${activeTab === "ALL" ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-bold ${activeTab === "ALL" ? 'text-indigo-600' : 'text-gray-500'}`}>
            All ({allGuards.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab("DUTY")}
          className={`flex-1 py-3 rounded-lg ${activeTab === "DUTY" ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-bold ${activeTab === "DUTY" ? 'text-indigo-600' : 'text-gray-500'}`}>
            On Duty ({allGuards.filter(g => g.is_on_duty).length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={displayedGuards}
          keyExtractor={(item) => item.id}
          renderItem={renderGuardItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Users size={50} color="#cbd5e1" />
              <Text className="text-gray-400 mt-4 text-lg font-medium">No guards found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}