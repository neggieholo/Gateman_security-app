import { router } from "expo-router";
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getSecurityColleagues } from "../services/api";
import { useUser } from "../UserContext";

const { width, height } = Dimensions.get("window");

interface Guard {
  id: string;
  name: string;
  email: string;
  phone: string; // Added phone
  avatar: string;
  is_on_duty: boolean;
  check_in_location?: string; // Added
  last_known_location?: string; // Added
}

export default function SecurityColleagues() {
  const { user, isDarkMode, theme } = useUser();
  const [allGuards, setAllGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ON" | "OFF">("ALL");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const displayedGuards = allGuards.filter((g) => {
    if (filter === "ON") return g.is_on_duty;
    if (filter === "OFF") return !g.is_on_duty;
    return true;
  });

  const renderGuardItem = ({ item }: { item: Guard }) => (
    <View
      className={`${isDarkMode ? "bg-gm-navy border-gm-gold" : "bg-white border-gray-100"} border p-4 mb-4 rounded-3xl shadow-sm`}
    >
      <View className="flex-row items-center">
        {/* Avatar Section */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            setSelectedImage(item.avatar || "https://via.placeholder.com/150")
          }
          className="relative"
        >
          <Image
            source={{ uri: item.avatar || "https://via.placeholder.com/150" }}
            className="w-16 h-16 rounded-2xl bg-gray-200"
          />
          <View
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${item.is_on_duty ? "bg-green-500" : "bg-gray-400"}`}
          />
        </TouchableOpacity>

        {/* Name, Email, Phone Section */}
        <View className="flex-1 ml-4 flex gap-1">
          <Text
            className={`text-lg font-montserrat-bold ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View className="flex-row items-center mt-1">
            <Mail size={12} color="#64748b" />
            <Text
              className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-md ml-1 font-oswald-semibold`}
            >
              {item.email}
            </Text>
          </View>

          <View className="flex-row items-center mt-0.5">
            <Phone size={12} color="#64748b" />
            <Text
              className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-md ml-1 font-oswald-semibold`}
            >
              {item.phone || "No Phone"}
            </Text>
          </View>
        </View>

        {/* Quick Call Action */}
        {/* <TouchableOpacity 
          onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
          className="bg-indigo-50 p-3 rounded-2xl"
        >
          <Phone size={20} color="#4f46e5" />
        </TouchableOpacity> */}
      </View>

      {/* On Duty Location Details */}
      {item.is_on_duty && (
        <View
          className={`${isDarkMode ? "border-gm-gold" : "border-gm-navy"} mt-4 pt-4 border-t flex-row justify-between`}
        >
          <View className="flex-1 pr-2">
            <Text
              className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-[10px] uppercase tracking-widest ml-1 font-oswald-semibold`}
            >
              Check-in Point
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#10b981" />
              <Text
                className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-xs ml-1 font-roboto-regular`}
                numberOfLines={1}
              >
                {item.check_in_location || "Main Gate"}
              </Text>
            </View>
          </View>

          <View
            className={`flex-1 pl-2 border-l ${isDarkMode ? "border-gm-gold" : "border-gm-navy"}`}
          >
            <Text
              className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-[10px] uppercase tracking-widest ml-1 font-oswald-semibold`}
            >
              Last Known Location
            </Text>
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#6366f1" />
              <Text
                className={`${isDarkMode ? "text-gray-50 " : "text-gm-navy"} text-xs ml-1 font-roboto-regular`}
                numberOfLines={1}
              >
                {item.last_known_location || "Unknown"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

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

  return (
    <View
      className={`${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50 "} flex-1 p-4`}
    >
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-montserrat-bold text-gm-navy">
            Security Team
          </Text>
          <Text className="text-gm-charcoal font-roboto-regular text-sm">
            {allGuards.length} total colleagues
          </Text>
        </View>
      </View>

      {/* Simplified Filter Pill Row */}
      <View className="flex-row gap-2 mb-6 justify-evenly">
        {[
          { label: "All", value: "ALL" },
          { label: "On Duty", value: "ON" },
          { label: "Off Duty", value: "OFF" },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            onPress={() => setFilter(item.value as any)}
            className={`px-5 py-2.5 rounded-full ${isDarkMode ? "border border-gm-gold" : ""} ${filter === item.value ? "bg-gm-navy" : "bg-white"}`}
          >
            <Text
              className={`font-oswald-semibold text-xs ${filter === item.value ? "text-gm-gold" : "text-gray-500"}`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
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
              <Users size={50} color="#cbd5e1" />
              <Text className="text-gray-400 mt-4 text-lg font-medium">
                No one found
              </Text>
            </View>
          }
        />
      )}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          className="flex-1 bg-black/90 justify-center items-center"
          onPress={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute top-12 right-6 z-50 bg-white/20 p-2 rounded-full"
          >
            <X size={28} color="white" />
          </TouchableOpacity>

          {/* Full Image */}
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: width * 0.9, height: width * 0.9 }}
              className="rounded-3xl bg-gray-800"
              resizeMode="cover"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
