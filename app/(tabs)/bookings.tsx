import { router } from "expo-router";
import { Calendar, CalendarX, LogIn, MapPin, ShieldAlert, ShieldCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BookingDetailModal from "@/Components/BookingDetailModal";
import { getTodayBookings } from "../../src/services/api";
import { LocationBooking } from "../../src/services/interfaces";
import { useUser } from "../UserContext";

export default function AllBookingsScreen() {
  const { user, isDarkMode, theme } = useUser();
  const [bookings, setBookings] = useState<LocationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<LocationBooking | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await getTodayBookings();
      setBookings(data);

      if (selectedBooking) {
        const updated = data.find((b: LocationBooking) => b.id === selectedBooking.id);
        if (updated) {
          setSelectedBooking(updated);
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not load location bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (!user?.estate_id) {
    return (
      <View
        className={`${isDarkMode ? "bg-slate-950" : "bg-gray-50"} flex-1 justify-center items-center p-6`}
      >
        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-8 rounded-3xl shadow-sm items-center border border-gray-100`}
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
      <View
        className={`flex-1 justify-center items-center p-6 ${isDarkMode ? "bg-slate-950" : "bg-gray-50 "}`}
      >
        <View
          className={`${isDarkMode ? "bg-gm-navy" : "bg-white "} p-8 rounded-[40px] shadow-xl items-center border border-slate-100 w-full max-w-sm`}
        >
          <View className="w-20 h-20 bg-rose-50 rounded-3xl items-center justify-center mb-6 rotate-3">
            <ShieldAlert size={44} color="#e11d48" />
          </View>

          <Text
            className={`${isDarkMode ? "text-white" : "text-gm-navy"} text-2xl font-montserrat-extrabold text-center uppercase tracking-tighter`}
          >
            Duty Status Required
          </Text>

          <Text
            className={`text-center mt-3 font-oswald-semibold leading-5 px-2 ${isDarkMode ? "text-white" : "text-gm-navy"} `}
          >
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

  if (loading)
    return (
      <ActivityIndicator
        className={`flex-1 ${isDarkMode ? "bg-slate-950" : ""}`}
        color={theme.accent}
      />
    );

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-slate-950" : "bg-gray-50 "}`}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20 px-4">
            <View
              className={`${isDarkMode ? "bg-gm-navy/50" : "bg-indigo-50"} p-6 rounded-3xl items-center border ${isDarkMode ? "border-slate-800" : "border-indigo-100"} max-w-xs w-full`}
            >
              <CalendarX size={48} color={isDarkMode ? "#e2e8f0" : "#4f46e5"} />
              <Text
                className={`text-lg font-montserrat-bold text-center mt-4 ${isDarkMode ? "text-white" : "text-gm-navy"}`}
              >
                No Bookings Today
              </Text>
              <Text
                className={`text-xs text-center mt-2 font-roboto-regular ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                There are no approved location bookings scheduled for today.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedBooking(item)}
            className={`${isDarkMode ? "bg-gm-navy" : "bg-white"} p-5 rounded-3xl mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between`}
          >
            <View className="flex-row items-center flex-1">
              <View
                className={`${isDarkMode ? "bg-gm-gold" : "bg-indigo-100 "} p-3 rounded-2xl mr-4`}
              >
                <Calendar size={24} color={"#4f46e5"} />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-lg font-montserrat-bold ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
                  numberOfLines={1}
                >
                  {item.venue_name || "Location Booking"}
                </Text>
                <Text
                  className={`${isDarkMode ? "text-white" : "text-gm-navy"} text-sm font-roboto-regular uppercase`}
                >
                  {item.start_time} - {item.end_time}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                className={`text-sm font-montserrat-bold ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
                numberOfLines={1}
              >
                {item.resident_name || "Resident"}
              </Text>
              <Text
                className={`${isDarkMode ? "text-white" : "text-gm-navy"} text-xs font-roboto-regular uppercase`}
              >
                Booked By
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </View>
  );
}