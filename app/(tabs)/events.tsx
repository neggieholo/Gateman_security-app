import { router } from "expo-router";
import { Calendar, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EventDetailModal from "../Components/EventDetailModal";
import { getTodayEvents } from "../services/api";
import { EstateEvent } from "../services/interfaces";
import { useUser } from "../UserContext";

export default function AllEventsScreen() {
  const { user, isDarkMode, theme } = useUser();
  const [events, setEvents] = useState<EstateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EstateEvent | null>(null);
  const flyerRef = useRef<View>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await getTodayEvents();
      setEvents(data);

      // FIX: If a modal is open, find the updated version of that event in the new data
      if (selectedEvent) {
        const updatedEvent = data.find(
          (e: EstateEvent) => e.id === selectedEvent.id,
        );
        if (updatedEvent) {
          setSelectedEvent(updatedEvent);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Call the function that fetches your events from the server
      await fetchEvents();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
            <Text className="text-white font-bold text-lg">Join an Estate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) return <ActivityIndicator className="flex-1" color="#6366f1" />;

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gm-navy/20" : "bg-gray-50 "}`}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedEvent(item)}
            className={`${isDarkMode ? 'bg-gm-navy':'bg-white'} p-5 rounded-3xl mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between`}
          >
            <View className="flex-row items-center flex-1">
              <View className={`${isDarkMode ? 'bg-gm-gold':'bg-indigo-100 '} p-3 rounded-2xl mr-4`}>
                <Calendar size={24} color={"#4f46e5"} />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-lg font-montserrat-bold ${isDarkMode ? 'text-gm-gold':'text-gm-navy'}`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text className= {`${isDarkMode ? 'text-white':'text-gm-navy'} text-sm font-roboto-regular uppercase`}>
                  {item.start_time} - {item.end_time}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className={`text-lg font-montserrat-bold ${isDarkMode ? 'text-gm-gold':'text-gm-navy'}`}>
                {item.registered_count}
              </Text>
              <Text className={`${isDarkMode ? 'text-white':'text-gm-navy'} text-sm font-roboto-regular uppercase`}>
                Guests
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRefresh={fetchEvents}
        />
      )}
    </View>
  );
}
