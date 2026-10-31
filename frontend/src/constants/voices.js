export const AI_VOICE_GROUPS = [
  {
    category: 'Celebrities Voice',
    badge: 'Celebrity',
    voices: [
      { id: '2029912836a045079bf2539751f5db10', name: 'SRK', initials: 'SK', tag: 'Bollywood' },
      { id: '7b2a94a1708d41218d11c7fb051e3eb8', name: 'Akshay Kumar', initials: 'AK', tag: 'Bollywood' },
      { id: 'f3436e1952784a9d9e348fedb15adde9', name: 'Peter Parker (Default)', initials: 'PP', tag: 'Superhero' },
      { id: '9cc81fcf04534a7abc1e8c2a9d88eeec', name: 'Tony Stark', initials: 'TS', tag: 'Iron Man' }
    ]
  },
  {
    category: 'Politicians',
    badge: 'Politician',
    voices: [
      { id: '8b734220ba20480aa95b5e6329730003', name: 'Narendra Modi', initials: 'NM', tag: 'Prime Minister' },
      { id: 'c411173d43764b838e3fe02cf749433b', name: 'Mamta Banerjee', initials: 'MB', tag: 'Chief Minister' },
      { id: '2cecab01bc0648d490f5783b5b3be32f', name: 'Rahul Gandhi', initials: 'RG', tag: 'Opposition Leader' },
      { id: 'a17fceae5f3b492da2d46cfc52b09140', name: 'Mahatma Gandhi', initials: 'MG', tag: 'National Leader' }
    ]
  },
  {
    category: 'Anime and Cartoon',
    badge: 'Anime',
    voices: [
      { id: 'a32f14ad4d66457193d68abb997ed6c1', name: 'Doraemon', initials: 'DM', tag: 'Anime Icon' },
      { id: 'e42bc2b9f99a4e79ac8f0a3e30142ce2', name: 'Nobita', initials: 'NB', tag: 'Anime Classic' },
      { id: 'a1edc95b8d554d1192ac989e5d292689', name: 'Shinchan', initials: 'SC', tag: 'Cartoon Comedy' },
      { id: '58c31ee9e7d5415da6b809b9db89a55f', name: 'Ash Ketchum', initials: 'AK', tag: 'Pokemon Trainer' }
    ]
  },
  {
    category: 'Normal AI voice',
    badge: 'Natural',
    voices: [
      { id: '9a9cf47702da476aa4629e2506d4a857', name: 'Hannah', initials: 'HN', tag: 'Natural AI' },
      { id: 'bf322df2096a46f18c579d0baa36f41d', name: 'Adrian', initials: 'AD', tag: 'Warm and Clear' },
      { id: '933563129e564b19a115bedd57b7406a', name: 'Sarah', initials: 'SA', tag: 'Conversational' },
      { id: '536d3a5e000945adb7038665781a4aca', name: 'Ethan', initials: 'ET', tag: 'Narrative' },
      { id: 'e3cd384158934cc9a01029cd7d278634', name: 'Laura', initials: 'LA', tag: 'Professional' },
      { id: '79d0bd3e4e5444b18f7b6d89b5927bf1', name: 'Jordan', initials: 'JO', tag: 'Casual' },
      { id: 'b347db033a6549378b48d00acb0d06cd', name: 'Selene', initials: 'SE', tag: 'Expressive' }
    ]
  }
];

export const DEFAULT_VOICE_ID = 'f3436e1952784a9d9e348fedb15adde9';

export const ALL_VOICES = AI_VOICE_GROUPS.flatMap(group => group.voices);

export const getVoiceById = (id) => {
  return ALL_VOICES.find(v => v.id === id) || ALL_VOICES.find(v => v.id === DEFAULT_VOICE_ID) || ALL_VOICES[0];
};

export const getVoiceCategory = (id) => {
  const group = AI_VOICE_GROUPS.find(g => g.voices.some(v => v.id === id));
  return group ? group.category : 'Normal AI voice';
};
