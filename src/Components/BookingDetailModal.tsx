import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  X,
} from "lucide-react-native";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../app/UserContext";
import { LocationBooking } from "../services/interfaces";
import { formatDate } from "@/services/api";

interface Props {
  booking: LocationBooking;
  onClose: () => void;
}

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

export default function BookingDetailModal({ booking, onClose }: Props) {
  const { isDarkMode } = useUser();

  const now = new Date();
  const todayStr = formatDate(now.toISOString().split("T")[0]); // "YYYY-MM-DD"
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter out dates that are in the past (before today)
  const validSlots = (booking.booked_dates || []).filter((slot) => {
    if (!slot.date) return true;
    return slot.date >= todayStr;
  });

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View
          className={`${isDarkMode ? "bg-gm-navy border-slate-800" : "bg-white"} p-6 rounded-t-[36px] border-t max-h-[85%]`}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className={`text-xl font-montserrat-extrabold uppercase tracking-wide ${isDarkMode ? "text-gm-gold" : "text-gm-navy"}`}
            >
              Booking Details
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X color={isDarkMode ? "#ffffff" : "#0f172a"} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Resident Info Card */}
            <View
              className={`${
                isDarkMode
                  ? "bg-slate-900 border-slate-800"
                  : "bg-gray-50 border-slate-100"
              } p-5 rounded-3xl mb-6 items-center justify-center flex-col border`}
            >
              {typeof booking.resident_avatar === "string" &&
              booking.resident_avatar.trim() !== "" ? (
                <Image
                  source={{ uri: booking.resident_avatar }}
                  className="w-[112px] h-[112px] rounded-3xl mb-3"
                  style={{ width: 112, height: 112 }}
                />
              ) : (
                <View
                  className="w-[112px] h-[112px] rounded-3xl bg-indigo-100 items-center justify-center mb-3"
                  style={{ width: 112, height: 112 }}
                >
                  <User size={56} color="#4f46e5" />
                </View>
              )}

              <Text
                className={`text-xl font-montserrat-bold text-center ${
                  isDarkMode ? "text-white" : "text-gm-navy"
                }`}
              >
                {booking.resident_name || "Unknown Resident"}
              </Text>
              <Text className="text-xs text-gray-400 uppercase font-roboto-regular mt-1">
                Resident Host
              </Text>
            </View>

            {/* General Overview */}
            <View className="space-y-4 mb-6">
              <View className="flex-row items-center">
                <MapPin size={20} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="text-xs text-gray-400 uppercase">Venue</Text>
                  <Text
                    className={`text-base font-oswald-semibold ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                  >
                    {booking.venue_name || "Unknown Venue"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-3">
                <Calendar size={20} color="#4f46e5" />
                <View className="ml-3">
                  <Text className="text-xs text-gray-400 uppercase font-roboto-regular">
                    Date Range
                  </Text>
                  <Text
                    className={`text-base font-oswald-semibold ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                  >
                    {(() => {
                      if (validSlots.length === 0) return "No upcoming dates";

                      const sortedDates = validSlots
                        .map((s) => s.date)
                        .filter(Boolean)
                        .sort();

                      const earliestDate = sortedDates[0];
                      const latestDate = sortedDates[sortedDates.length - 1];

                      return earliestDate === latestDate
                        ? earliestDate
                        : `${earliestDate} to ${latestDate}`;
                    })()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Requested Date & Time Slots */}
            <View className="mb-4">
              <Text
                className={`text-xs font-montserrat-bold uppercase tracking-wider mb-3 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}
              >
                Active Date & Time Slots
              </Text>

              {validSlots.length > 0 ? (
                validSlots.map((slot, index) => {
                  const isToday = slot.date === todayStr;
                  const endMin = timeToMinutes(slot.end_time);
                  const isSlotExpired = isToday && currentMinutes > endMin;

                  return (
                    <View
                      key={index}
                      className={`p-4 rounded-2xl mb-3 border flex-row items-center justify-between ${
                        isSlotExpired
                          ? isDarkMode
                            ? "bg-rose-950/30 border-rose-900/40"
                            : "bg-rose-50 border-rose-100"
                          : isDarkMode
                            ? "bg-slate-900 border-slate-800"
                            : "bg-gray-50 border-gray-200/60"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Clock
                          size={18}
                          color={isSlotExpired ? "#e11d48" : "#4f46e5"}
                        />
                        <View className="ml-3">
                          <Text
                            className={`text-sm font-oswald-semibold ${
                              isSlotExpired
                                ? "text-rose-600 line-through"
                                : isDarkMode
                                  ? "text-white"
                                  : "text-gm-navy"
                            }`}
                          >
                            {slot.date}
                          </Text>
                          <Text
                            className={`text-xs ${
                              isSlotExpired
                                ? "text-rose-400"
                                : isDarkMode
                                  ? "text-slate-400"
                                  : "text-gray-500"
                            }`}
                          >
                            {slot.start_time} - {slot.end_time}
                          </Text>
                        </View>
                      </View>

                      {/* Status Tag */}
                      <View
                        className={`px-3 py-1 rounded-full flex-row items-center ${
                          isSlotExpired ? "bg-rose-100" : "bg-emerald-100"
                        }`}
                      >
                        {isSlotExpired ? (
                          <AlertCircle size={12} color="#e11d48" />
                        ) : (
                          <CheckCircle2 size={12} color="#047857" />
                        )}
                        <Text
                          className={`text-[10px] font-bold uppercase ml-1 ${
                            isSlotExpired ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {isSlotExpired ? "Expired" : "Active"}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View
                  className={`p-4 rounded-2xl border ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800"
                      : "bg-gray-50 border-gray-200"
                  } items-center`}
                >
                  <Text
                    className={`text-xs italic ${
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    No upcoming active slots remaining.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
