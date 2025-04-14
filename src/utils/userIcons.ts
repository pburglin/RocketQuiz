// Array of emoji icons that can be used as user avatars
const avatarEmojis = [
  '👨', '👩', '🧑', '👶', '👦', '👧', '👱', '👴', '👵', 
  '🧔', '👲', '👳', '👮', '👷', '💂', '🕵️', '👩‍⚕️', '👨‍⚕️',
  '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤',
  '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼',
  '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒',
  '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👸', '🤴', '🦸‍♀️', '🦸‍♂️',
  '🦹‍♀️', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️', '🧚‍♀️', '🧚‍♂️', '🧛‍♀️', '🧛‍♂️',
  '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🧞‍♀️', '🧞‍♂️', '🧟‍♀️', '🧟‍♂️'
];

// Array of background colors for the avatar circles
const avatarColors = [
  'bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 
  'bg-purple-200', 'bg-pink-200', 'bg-indigo-200', 'bg-teal-200',
  'bg-orange-200', 'bg-cyan-200', 'bg-lime-200', 'bg-emerald-200',
  'bg-violet-200', 'bg-fuchsia-200', 'bg-rose-200', 'bg-amber-200'
];

/**
 * Generates a deterministic avatar for a username
 * @param username The username to generate an avatar for
 * @returns An object containing the emoji and background color class
 */
export function getUserAvatar(username: string) {
  // Create a simple hash of the username to ensure consistent avatars
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to select an emoji and color
  const emojiIndex = Math.abs(hash) % avatarEmojis.length;
  const colorIndex = Math.abs(hash >> 4) % avatarColors.length; // Use a different bit range for color
  
  return {
    emoji: avatarEmojis[emojiIndex],
    colorClass: avatarColors[colorIndex]
  };
}

// Size classes for avatar rendering
export const avatarSizeClasses = {
  sm: 'w-6 h-6 text-sm',
  md: 'w-8 h-8 text-base',
  lg: 'w-10 h-10 text-lg'
};