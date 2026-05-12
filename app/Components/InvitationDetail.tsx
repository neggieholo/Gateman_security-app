import { Home, MapPin, User, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Invitation } from "../services/interfaces";

interface InvitationDetailProps {
  invite: Invitation | null;
  onClose: () => void;
  statusDetails: {
    label: string;
    container: string;
    text: string;
  } | null;
}

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const InvitationDetailModal = ({
  invite,
  onClose,
  statusDetails,
}: InvitationDetailProps) => {
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  if (!invite) return null;

  const isCancelled = invite.is_cancelled;
  const isMultiEntry = invite.invite_type === "multi_entry";

  // Helper to format 24h to AM/PM
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  };

  const topBarColor = isCancelled
    ? "bg-rose-500"
    : isMultiEntry
      ? "bg-indigo-500"
      : "bg-emerald-500";

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={!!invite}
        onRequestClose={onClose}
      >
        <Pressable
          className="flex-1 bg-slate-900/60 justify-center items-center p-6"
          onPress={onClose}
        >
          <Pressable
            className="bg-white w-full max-w-sm rounded-[50px] overflow-hidden shadow-2xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className={`h-3 ${topBarColor}`} />

            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View className="items-center">
                <TouchableOpacity
                  className="w-28 h-28 bg-slate-100 rounded-[35px] border-4 border-white shadow-md overflow-hidden mb-4 items-center justify-center"
                  onPress={() =>
                    invite.guest_image_url && setIsImageZoomed(true)
                  }
                >
                  {invite.guest_image_url ? (
                    <Image
                      source={{ uri: invite.guest_image_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={40} color="#cbd5e1" />
                  )}
                </TouchableOpacity>

                <Text
                  className={`text-2xl font-black text-slate-900 text-center ${isCancelled ? "opacity-30 line-through" : ""}`}
                >
                  {invite.guest_name}
                </Text>

                <View
                  className={`${statusDetails?.container || "bg-slate-100"} px-4 py-1.5 rounded-full mt-3 mb-6`}
                >
                  <Text
                    className={`${statusDetails?.text || "text-slate-600"} text-[10px] font-black uppercase`}
                  >
                    {statusDetails?.label}
                  </Text>
                </View>

                {/* RE-ORDERED DESTINATION CARD */}
                <View className="w-full bg-slate-50 rounded-[30px] p-5 mb-6 border border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">
                    Visiting Resident
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Home size={16} color="#6366f1" />
                    <Text className="ml-2 text-slate-900 font-black text-base">
                      {invite.resident_name || "Resident"}
                    </Text>
                  </View>

                  {/* Estate name directly below Resident */}
                  <Text className="text-[10px] font-black text-indigo-600 uppercase mb-3 ml-6">
                    {invite.estate_name || "Estate Security"}
                  </Text>
                  <Text className="text-[10px] font-black text-indigo-600 uppercase mb-3 ml-6">
                    {invite.town} / {invite.lga}
                  </Text>

                  {/* Block and Unit with Labels */}
                  <View className="flex-row items-center bg-white p-3 rounded-2xl border border-slate-100">
                    <MapPin size={14} color="#64748b" />
                    <View className="flex-row ml-2 items-center">
                      <Text className="text-slate-400 font-bold text-[10px] uppercase">
                        Block:
                      </Text>
                      <Text className="text-slate-900 font-bold text-xs ml-1 mr-3">
                        {invite.block || "N/A"}
                      </Text>

                      <Text className="text-slate-400 font-bold text-[10px] uppercase">
                        Unit:
                      </Text>
                      <Text className="text-slate-900 font-bold text-xs ml-1">
                        {invite.unit || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  className={`w-full ${isCancelled ? "bg-slate-100" : "bg-slate-900"} rounded-[35px] py-3 items-center mb-6`}
                >
                  <Text className="text-[9px] font-bold text-slate-500 uppercase tracking-[3px] mb-1">
                    Access Code
                  </Text>
                  <Text
                    className={`text-2xl font-bold tracking-[6px] font-mono ${isCancelled ? "text-slate-300 line-through" : "text-white"}`}
                  >
                    {invite.access_code}
                  </Text>
                </View>

                <View className="w-full px-2">
                  <DetailRow
                    label="Type"
                    value={invite.invite_type.replace("_", " ")}
                    isCaps
                  />
                  <DetailRow
                    label="Validity"
                    value={`${formatDate(invite.start_date)} ${isMultiEntry ? `→ ${formatDate(invite.end_date)}` : ""}`}
                  />
                  <DetailRow
                    label="Window"
                    value={`${formatTime(invite.start_time)} - ${formatTime(invite.end_time)}`}
                  />
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  className="w-full mt-8 bg-slate-900 py-5 rounded-[24px]"
                >
                  <Text className="text-white font-black text-center uppercase tracking-widest">
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={isImageZoomed} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black justify-center items-center"
          onPress={() => setIsImageZoomed(false)}
        >
          {/* Close Button on Top Right */}
          <TouchableOpacity
            onPress={() => setIsImageZoomed(false)}
            className="absolute top-12 right-6 z-10 bg-white/20 p-3 rounded-full"
          >
            <X color="white" size={24} />
          </TouchableOpacity>

          <Image
            source={{ uri: invite.guest_image_url }}
            className="w-full h-3/4"
            resizeMode="contain"
          />

          <View className="absolute bottom-12 items-center">
            <Text className="text-white font-black text-xl">
              {invite.guest_name}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const DetailRow = ({
  label,
  value,
  isCaps,
}: {
  label: string;
  value: string;
  isCaps?: boolean;
}) => (
  <View className="flex-row justify-between py-3 border-b border-slate-50">
    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
      {label}
    </Text>
    <Text
      className={`text-slate-800 font-bold text-xs ${isCaps ? "uppercase" : ""}`}
    >
      {value}
    </Text>
  </View>
);

export default InvitationDetailModal;
