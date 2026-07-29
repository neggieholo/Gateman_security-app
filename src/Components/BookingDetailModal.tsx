import { formatDate, formatTime } from "@/services/api";
import { Calendar, Clock, MapPin, User, X } from "lucide-react-native";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "../../app/UserContext";
import { LocationBooking } from "../services/interfaces";

interface Props {
  booking: LocationBooking;
  onClose: () => void;
}

export default function BookingDetailModal({ booking, onClose }: Props) {
  const { isDarkMode } = useUser();

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

          {/* Details */}
          <View className="space-y-4 mb-6">
            <View className="flex-row items-center">
              <MapPin size={20} color="#4f46e5" className="mr-3" />
              <View className="ml-3">
                <Text className="text-xs text-gray-400 uppercase">Venue</Text>
                <Text
                  className={`text-base font-oswald-semibold ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                >
                  {booking.venue_name || `Venue #${booking.venue_id}`}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Calendar size={20} color="#4f46e5" className="mr-3" />
              <View className="ml-3">
                <Text className="text-xs text-gray-400 uppercase font-roboto-regular">
                  Date Range
                </Text>
                <Text
                  className={`text-base font-oswald-semibold ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                >
                  {formatDate(booking.start_date)} to{" "}
                  {formatDate(booking.end_date)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Clock size={20} color="#4f46e5" className="mr-3" />
              <View className="ml-3">
                <Text className="text-xs text-gray-400 uppercase font-roboto-regular">
                  Time Slot
                </Text>
                <Text
                  className={`text-base font-oswald-semibold ${isDarkMode ? "text-white" : "text-gm-navy"}`}
                >
                  {formatTime(booking.start_time)} -{" "}
                  {formatTime(booking.end_time)}
                </Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View className="flex-row justify-between items-center pt-4 border-t border-gray-200/20">
            <Text
              className={`text-sm font-oswald-semibold uppercase ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              Payment Status
            </Text>
            <View
              className={`px-4 py-1.5 rounded-full ${booking.is_paid ? "bg-emerald-100" : "bg-amber-100"}`}
            >
              <Text
                className={`text-xs font-bold uppercase ${booking.is_paid ? "text-emerald-700" : "text-amber-700"}`}
              >
                {booking.is_paid ? "Paid" : "Unpaid"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
