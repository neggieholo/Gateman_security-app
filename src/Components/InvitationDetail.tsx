import { Briefcase, Home, MapPin, User, X } from "lucide-react-native";
import { useState } from "react";
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useUser } from "../../app/UserContext";
import { formatDate, formatTime } from "../services/api";
import { Invitation, LocationPair } from "../services/interfaces";

interface InvitationDetailProps {
  invite: Invitation | null;
  onClose: () => void;
  statusDetails: {
    label: string;
    container: string;
    text: string;
  } | null;
}

const InvitationDetailModal = ({
  invite,
  onClose,
  statusDetails,
}: InvitationDetailProps) => {
  const { isDarkMode, user } = useUser();
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!invite) return null;

  const isCancelled = invite.is_cancelled;
  const isMultiEntry = invite.invite_type === "multi_entry";
  const isStaffEntry = invite.invite_type === "staff_entry";

  const topBarColor = isCancelled
    ? "bg-rose-500"
    : isMultiEntry
      ? "bg-indigo-500"
      : "bg-emerald-500";

  // Safely extract and format dynamic multi-unit structures grouped by estate ID
  const estateLocations: LocationPair[] =
    user?.estate_id && invite.locations ? invite.locations[user.estate_id] : [];

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
            className={`${isDarkMode ? "bg-black" : "bg-white"} w-full max-w-sm rounded-[50px] overflow-hidden shadow-2xl`}
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
                  ) : isStaffEntry ? (
                    <Briefcase
                      size={22}
                      color={isDarkMode ? "#D4AF37" : "#4f46e5"}
                    />
                  ) : (
                    <User
                      size={24}
                      color={isDarkMode ? "#D4AF37" : "#4f46e5"}
                    />
                  )}
                </TouchableOpacity>

                <Text
                  className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-gm-navy"} text-center ${isCancelled ? "opacity-30 line-through" : ""}`}
                >
                  {invite.guest_name}
                </Text>

                {isStaffEntry && invite.staff_position && (
                  <Text
                    className={`font-bold text-xs mt-0.5 mb-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    numberOfLines={1}
                  >
                    💼 {invite.staff_position}
                  </Text>
                )}

                {!isStaffEntry && (
                  <View
                    className={`${statusDetails?.container || "bg-slate-100"} px-4 py-1.5 rounded-full mt-3 mb-6`}
                  >
                    <Text
                      className={`${statusDetails?.text || "text-slate-600"} text-[10px] font-oswald-semibold uppercase`}
                    >
                      {statusDetails?.label}
                    </Text>
                  </View>
                )}

                {isStaffEntry && (
                  <View
                    className={`px-2 py-2 m-2 rounded-md ${
                      invite.is_activated
                        ? isDarkMode
                          ? "bg-emerald-950/40 border border-emerald-900/30"
                          : "bg-emerald-100"
                        : isDarkMode
                          ? "bg-red-950/40 border border-red-900/30"
                          : "bg-rose-100"
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-extrabold ${invite.is_activated ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {invite.is_activated
                        ? invite.status === "checked_in"
                          ? "INSIDE"
                          : invite.status === "checked_out"
                            ? "ACTIVE"
                            : invite.status === "overstayed"
                              ? "OVERSTAYED"
                              : "ACTIVE"
                        : "DISABLED"}
                    </Text>
                  </View>
                )}

                {/* VISITING DESTINATION CARD */}
                <View
                  className={`${isDarkMode ? "bg-slate-900/40" : "bg-slate-50"} w-full rounded-[30px] p-5 mb-6 border border-slate-100`}
                >
                  <Text className="text-[10px] text-slate-400 uppercase font-montserrat-bold">
                    Visiting Resident
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Home size={16} color="#6366f1" />
                    <Text
                      className={`${isDarkMode ? "text-white" : "text-gm-navy"} ml-2 tracking-widest text-base font-montserrat-extrabold`}
                    >
                      {invite.resident_name || "Resident"}
                    </Text>
                  </View>

                  <Text className="text-[10px] text-indigo-600 uppercase mb-1 ml-6 tracking-widest font-oswald-semibold ">
                    {invite.estate_name || "Estate Security"}
                  </Text>
                  <Text className="text-[10px] text-indigo-600 uppercase mb-3 ml-6 tracking-widest font-oswald-semibold ">
                    {invite.town} / {invite.lga}
                  </Text>

                  {estateLocations && estateLocations.length > 0 ? (
                    <View className="flex-row flex-wrap gap-2 mt-2 w-full">
                      {estateLocations.map((loc, idx) => {
                        const unitsString = Array.isArray(loc.unit)
                          ? loc.unit.join(", ")
                          : typeof loc.unit === "string"
                            ? loc.unit
                            : "N/A";

                        return (
                          <View
                            key={`detail-loc-${idx}`}
                            className={`border px-3 py-1.5 rounded-xl flex-row items-center ${
                              isDarkMode
                                ? "bg-slate-900 border-slate-800"
                                : "bg-indigo-50/90 border-indigo-100"
                            }`}
                          >
                            <Text
                              className={`font-black text-xs ${isDarkMode ? "text-white" : "text-indigo-950"}`}
                            >
                              Blk {loc.block}{" "}
                              <Text
                                className={
                                  isDarkMode
                                    ? "text-slate-700"
                                    : "text-slate-300"
                                }
                              >
                                |
                              </Text>{" "}
                              Unit(s): {unitsString}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View
                      className={`flex-row items-center p-3 rounded-2xl border ${isDarkMode ? "bg-black border-slate-800" : "bg-white border-slate-100"}`}
                    >
                      <MapPin size={14} color="#64748b" />
                      <Text className="text-gray-400 text-xs ml-2 italic">
                        No locations assigned
                      </Text>
                    </View>
                  )}
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
                    isDarkMode={isDarkMode}
                  />
                  <DetailRow
                    label="Validity"
                    value={`${formatDate(invite.start_date)} ${isMultiEntry ? `→ ${formatDate(invite.end_date)}` : ""} ${isStaffEntry && invite.start_date !== invite.end_date ? `→ ${formatDate(invite.end_date)}` : "Present Date"}`}
                    isDarkMode={isDarkMode}
                  />
                  <DetailRow
                    label="Window"
                    value={`${formatTime(invite.start_time)} - ${formatTime(invite.end_time)}`}
                    isDarkMode={isDarkMode}
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
  isDarkMode,
}: {
  label: string;
  value: string;
  isCaps?: boolean;
  isDarkMode: boolean;
}) => (
  <View className="flex-row justify-between py-3 border-b border-slate-50">
    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
      {label}
    </Text>
    <Text
      className={`${isDarkMode ? "text-white" : "text-slate-800"} font-bold text-xs ${isCaps ? "uppercase" : ""}`}
    >
      {value}
    </Text>
  </View>
);

export default InvitationDetailModal;
