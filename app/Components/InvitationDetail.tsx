import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Pressable 
} from 'react-native';
import { User } from 'lucide-react-native';
import { Invitation } from '../services/interfaces';

interface InvitationDetailProps {
  invite: Invitation | null;
  onClose: () => void;
  statusDetails: {
    label: string;
    container: string; // Changed from 'bg' to 'container'
    text: string;
  } | null;
}

const InvitationDetailModal = ({ invite, onClose, statusDetails }: InvitationDetailProps) => {
  if (!invite) return null;

  const isCancelled = invite.is_cancelled;
  const isMultiEntry = invite.invite_type === 'multi_entry';

  // Determine the color of the top bar
  const topBarColor = isCancelled 
    ? 'bg-rose-500' 
    : (isMultiEntry ? 'bg-indigo-500' : 'bg-emerald-500');

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!invite}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-slate-900/60 justify-center items-center p-6"
        onPress={onClose}
      >
        {/* Modal Container */}
        <Pressable 
          className="bg-white w-full max-w-sm rounded-[50px] overflow-hidden shadow-2xl"
          onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Top Decorative Status Bar */}
          <View className={`h-3 ${topBarColor}`} />
          
          <ScrollView contentContainerStyle={{ padding: 32 }}>
            <View className="items-center">
              
              {/* Enlarged Image */}
              <View className="w-32 h-32 bg-slate-100 rounded-[40px] border-4 border-white shadow-lg overflow-hidden mb-6 items-center justify-center">
                {invite.guest_image_url ? (
                  <Image 
                    source={{ uri: invite.guest_image_url }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <User size={48} color="#cbd5e1" />
                )}
              </View>

              {/* Guest Info */}
              <Text className={`text-2xl font-black text-slate-900 text-center ${isCancelled ? 'opacity-30 line-through' : ''}`}>
                {invite.guest_name}
              </Text>
              
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-1 mb-4">
                {invite.invite_type.replace('_', ' ')}
              </Text>

              {/* Status Badge */}
              <View className={`${statusDetails?.container || 'bg-slate-100'} px-5 py-2 rounded-full mb-8`}>
                <Text className={`${statusDetails?.text || 'text-slate-600'} text-xs font-black uppercase`}>
                  {statusDetails?.label}
                </Text>
              </View>

              {/* Big Access Code Card */}
              <View className={`w-full ${isCancelled ? 'bg-slate-100' : 'bg-slate-900'} rounded-[40px] py-8 items-center mb-8 shadow-md`}>
                <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-[3px] mb-2">
                  Access Code
                </Text>
                <Text className={`text-5xl font-bold tracking-[8px] font-mono ${isCancelled ? 'text-slate-300 line-through' : 'text-white'}`}>
                  {invite.access_code}
                </Text>
              </View>

              {/* Details List */}
              <View className="w-full space-y-4 px-2">
                <View className="flex-row justify-between border-b border-slate-50 pb-3">
                  <Text className="text-slate-400 text-sm italic">Validity</Text>
                  <Text className="text-slate-900 font-bold text-sm">
                    {invite.start_date} {isMultiEntry && `to ${invite.end_date}`}
                  </Text>
                </View>
                
                <View className="flex-row justify-between border-b border-slate-50 pb-3">
                  <Text className="text-slate-400 text-sm italic">Daily Time</Text>
                  <Text className="text-slate-900 font-bold text-sm">
                    {invite.start_time.slice(0,5)} - {invite.end_time.slice(0,5)}
                  </Text>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity 
                onPress={onClose}
                className="w-full mt-10 bg-slate-100 p-5 rounded-3xl active:bg-slate-200"
              >
                <Text className="text-slate-600 font-bold text-center text-base">
                  Close Details
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default InvitationDetailModal;