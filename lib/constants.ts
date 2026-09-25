export interface Species {
  id: string;
  name: string;
}

export const SPECIES_LIST: Species[] = [
  { id: 'maharashtra', name: 'Maharashtra' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'karnataka', name: 'Karnataka' },
  { id: 'uttar-pradesh', name: 'Uttar Pradesh' },
  { id: 'tamil-nadu', name: 'Tamil Nadu' },
  { id: 'gujarat', name: 'Gujarat' },
  { id: 'west-bengal', name: 'West Bengal' },
  { id: 'rajasthan', name: 'Rajasthan' },
  { id: 'andhra-pradesh', name: 'Andhra Pradesh' },
  { id: 'telangana', name: 'Telangana' },
  { id: 'kerala', name: 'Kerala' },
  { id: 'punjab', name: 'Punjab' },
  { id: 'haryana', name: 'Haryana' },
  { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
  { id: 'bihar', name: 'Bihar' },
  { id: 'odisha', name: 'Odisha' },
  { id: 'assam', name: 'Assam' },
  { id: 'jharkhand', name: 'Jharkhand' },
  { id: 'chhattisgarh', name: 'Chhattisgarh' },
  { id: 'uttarakhand', name: 'Uttarakhand' },
  { id: 'himachal-pradesh', name: 'Himachal Pradesh' },
  { id: 'goa', name: 'Goa' },
  { id: 'tripura', name: 'Tripura' },
  { id: 'jammu-kashmir', name: 'Jammu & Kashmir' },
  { id: 'chandigarh', name: 'Chandigarh' },
  { id: 'meghalaya', name: 'Meghalaya' },
  { id: 'manipur', name: 'Manipur' },
  { id: 'nagaland', name: 'Nagaland' }
];

export const EMOJIS = ['❤️', '👏', '😂', '👎', '💯', '✨', '🔥', '👀', '👍'];

export const STATE_FAMOUS_WORDS: Record<string, [string, string, string]> = {
  maharashtra: ['Mumbai', 'Bollywood', 'Vada Pav'],
  delhi: ['Capital', 'Red Fort', 'Chaat'],
  karnataka: ['Bengaluru', 'Coffee', 'Hampi'],
  'uttar-pradesh': ['Varanasi', 'Taj Mahal', 'Awadh'],
  'tamil-nadu': ['Chennai', 'Carnatic', 'Temples'],
  gujarat: ['Garba', 'Dhokla', 'Kutch'],
  'west-bengal': ['Rosogolla', 'Durga Puja', 'Howrah'],
  rajasthan: ['Palaces', 'Deserts', 'Royalty'],
  'andhra-pradesh': ['Tirupati', 'Kuchipudi', 'Spices'],
  telangana: ['Hyderabad', 'Biryani', 'Charminar'],
  kerala: ['Backwaters', 'Ayurveda', 'Spices'],
  punjab: ['Bhangra', 'Lassi', 'Amritsar'],
  haryana: ['Wrestling', 'Dairy', 'Murrah'],
  'madhya-pradesh': ['Tigers', 'Khajuraho', 'Poha'],
  bihar: ['Nalanda', 'Bodh Gaya', 'Litti Chokha'],
  odisha: ['Puri', 'Konark', 'Rasagola'],
  assam: ['Tea Gardens', 'Kaziranga', 'Bihu'],
  jharkhand: ['Waterfalls', 'Forests', 'Dhoni'],
  chhattisgarh: ['Bastar', 'Waterfalls', 'Tribal'],
  uttarakhand: ['Kedarnath', 'Yoga', 'Himalayas'],
  'himachal-pradesh': ['Apples', 'Snow Peaks', 'Manali'],
  goa: ['Beaches', 'Carnival', 'Shacks'],
  tripura: ['Ujjayanta', 'Bamboo', 'Neermahal'],
  'jammu-kashmir': ['Dal Lake', 'Saffron', 'Snow'],
  chandigarh: ['Rock Garden', 'Sukhna', 'Clean'],
  meghalaya: ['Rainiest', 'Bridges', 'Clouds'],
  manipur: ['Loktak Lake', 'Sangai', 'Polo'],
  nagaland: ['Hornbill', 'Dzukou', 'Hills'],
  sikkim: ['Organic', 'Kanchenjunga', 'Momos'],
  ladakh: ['Pangong', 'Passes', 'Stupas'],
  puducherry: ['Colony', 'Promenade', 'Auroville']
};

export function getStateFamousWords(idOrName: string): [string, string, string] {
  if (!idOrName) return ['Voice Debate', 'Live Stage', 'Open Mic'];
  const normalized = idOrName.toLowerCase().trim().replace(/[\s_]+/g, '-');
  if (STATE_FAMOUS_WORDS[normalized]) {
    return STATE_FAMOUS_WORDS[normalized];
  }
  for (const [key, words] of Object.entries(STATE_FAMOUS_WORDS)) {
    if (key.replace(/-/g, ' ') === idOrName.toLowerCase().trim()) {
      return words;
    }
  }
  return ['Voice Debate', 'Live Stage', 'Open Mic'];
}

export type RegionCategory = 'all' | 'north' | 'south' | 'west' | 'east' | 'central' | 'northeast' | 'custom';

export const REGIONS: { id: RegionCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
  { id: 'north', label: 'North' },
  { id: 'south', label: 'South' },
  { id: 'west', label: 'West' },
  { id: 'east', label: 'East' },
  { id: 'central', label: 'Central' },
  { id: 'northeast', label: 'North East' }
];

export const STATE_REGION_MAP: Record<string, RegionCategory> = {
  delhi: 'north',
  punjab: 'north',
  haryana: 'north',
  'himachal-pradesh': 'north',
  'jammu-kashmir': 'north',
  uttarakhand: 'north',
  chandigarh: 'north',
  'uttar-pradesh': 'north',
  ladakh: 'north',

  karnataka: 'south',
  'tamil-nadu': 'south',
  kerala: 'south',
  'andhra-pradesh': 'south',
  telangana: 'south',
  puducherry: 'south',

  maharashtra: 'west',
  gujarat: 'west',
  goa: 'west',
  rajasthan: 'west',

  'west-bengal': 'east',
  bihar: 'east',
  odisha: 'east',
  jharkhand: 'east',

  'madhya-pradesh': 'central',
  chhattisgarh: 'central',

  assam: 'northeast',
  meghalaya: 'northeast',
  manipur: 'northeast',
  nagaland: 'northeast',
  tripura: 'northeast',
  sikkim: 'northeast'
};

export function getRegionForRoom(roomId: string, isCustom?: boolean): RegionCategory {
  if (isCustom) return 'custom';
  const normalized = (roomId || '').toLowerCase().trim().replace(/[\s_]+/g, '-');
  return STATE_REGION_MAP[normalized] || 'central';
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const SOCKET_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
