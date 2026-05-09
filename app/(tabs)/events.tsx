import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Calendar, Users, Search, X, Info, UserCheck } from 'lucide-react-native';

// Types for your GateMan app logic
type Event = {
  id: string;
  title: string;
  date: string;
  venue: string;
  guests: { name: string; code: string }[];
  description: string;
};

export default function EventsScreen() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'guests'>('details');
  const [searchQuery, setSearchQuery] = useState('');

  // Dummy data - Replace with your fetch from ScanToExcel or GateMan API
  const events: Event[] = [
    { 
      id: '1', title: 'Estate AGM', date: '2026-06-12', venue: 'Main Hall', 
      description: 'Annual General Meeting for all residents.',
      guests: [{ name: 'Simon Dev', code: 'GT-4421' }, { name: 'Alice Smith', code: 'GT-9901' }] 
    },
  ];

  const filteredGuests = selectedEvent?.guests.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white p-5">
      <Text className="text-2xl font-black text-slate-900 mb-5">Events Showcase</Text>
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => setSelectedEvent(item)}
            className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 mb-4"
          >
            <Text className="font-black text-lg text-indigo-600">{item.title}</Text>
            <View className="flex-row items-center mt-2">
              <Calendar size={14} color="#64748b" />
              <Text className="ml-2 text-slate-500 font-bold">{item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail & Guest Modal */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView 
            edges={['top', 'left', 'right'] as Edge[]} 
            className="bg-white h-[90%] rounded-t-[3rem] overflow-hidden"
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-slate-100">
              <Text className="text-xl font-black text-slate-900 flex-1" numberOfLines={1}>
                {selectedEvent?.title}
              </Text>
              <TouchableOpacity onPress={() => { setSelectedEvent(null); setActiveTab('details'); }}>
                <X color="#0f172a" size={24} />
              </TouchableOpacity>
            </View>

            {/* Two Tabs Switcher */}
            <View className="flex-row p-2 bg-slate-100 m-4 rounded-2xl">
              <TabButton 
                label="Details" 
                icon={<Info size={16} color={activeTab === 'details' ? 'white' : '#64748b'}/>} 
                active={activeTab === 'details'} 
                onPress={() => setActiveTab('details')} 
              />
              <TabButton 
                label="Guest List" 
                icon={<Users size={16} color={activeTab === 'guests' ? 'white' : '#64748b'}/>} 
                active={activeTab === 'guests'} 
                onPress={() => setActiveTab('guests')} 
              />
            </View>

            {activeTab === 'details' ? (
              <ScrollView className="px-6 py-2">
                <DetailRow icon={<Calendar size={18} color="#4f46e5" />} label="Date" value={selectedEvent?.date} />
                <DetailRow icon={<Users size={18} color="#4f46e5" />} label="Venue" value={selectedEvent?.venue} />
                <Text className="text-slate-400 font-black text-[10px] uppercase mt-6 mb-2 tracking-widest">Description</Text>
                <Text className="text-slate-600 leading-6 font-medium">{selectedEvent?.description}</Text>
              </ScrollView>
            ) : (
              <View className="flex-1 px-6">
                {/* Search Bar for Guests */}
                <View className="bg-slate-100 flex-row items-center px-4 py-3 rounded-2xl mb-4 border border-slate-200">
                  <Search size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Search guest or code..."
                    className="flex-1 ml-3 font-bold text-slate-700"
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <FlatList
                  data={filteredGuests}
                  keyExtractor={(g) => g.code}
                  renderItem={({ item }) => (
                    <View className="flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl mb-2 border border-slate-100">
                      <View>
                        <Text className="font-bold text-slate-900">{item.name}</Text>
                        <Text className="text-indigo-600 font-black text-xs uppercase">{item.code}</Text>
                      </View>
                      <UserCheck size={18} color="#10b981" />
                    </View>
                  )}
                  ListEmptyComponent={<Text className="text-center text-slate-400 mt-5">No guests found</Text>}
                />
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// Sub-components for cleaner code
const TabButton = ({ label, active, onPress, icon }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${active ? 'bg-indigo-600 shadow-md' : ''}`}
  >
    {icon}
    <Text className={`ml-2 font-black text-xs uppercase ${active ? 'text-white' : 'text-slate-500'}`}>{label}</Text>
  </TouchableOpacity>
);

const DetailRow = ({ icon, label, value }: any) => (
  <View className="flex-row items-center mb-4">
    <View className="p-3 bg-indigo-50 rounded-xl">{icon}</View>
    <View className="ml-4">
      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</Text>
      <Text className="text-slate-900 font-bold text-base">{value}</Text>
    </View>
  </View>
);