import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  'All',
  'Hypertrophy',
  'Calistenics',
  'Strength',
  'Upper',
  'Full body',
];

export default function CatalogScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          <View className="px-6 mt-4 mb-5">
            <Text className="text-white text-3xl font-bold">Routines</Text>
            <Text className="text-gray-400 text-base mt-1">
              Explore routines to add
            </Text>
          </View>

          <View className="mx-6 mb-5 bg-zinc-900 rounded-2xl px-4 py-4 flex-row items-center border border-zinc-800">
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput 
              placeholder="Search routines..." 
              placeholderTextColor="#9ca3af"
              className="text-white text-base ml-3 flex-1"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="px-6 flex-row">
              {CATEGORIES.map((category, index) =>
                index === 0 ? (
                  <View key={category} className="rounded-full px-4 py-2 mr-2 bg-white">
                    <Text className="text-sm font-medium text-black">{category}</Text>
                  </View>
                ) : (
                  <View key={category} className="rounded-full px-4 py-2 mr-2 bg-zinc-900 border border-zinc-800">
                    <Text className="text-sm font-medium text-gray-300">{category}</Text>
                  </View>
                )
              )}
            </View>
          </ScrollView>

          {/* Aquí mapearás las rutinas completas cuando tengas el endpoint listo */}
          <View className="px-6 items-center mt-10">
            <Text className="text-zinc-600">No routines found.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}