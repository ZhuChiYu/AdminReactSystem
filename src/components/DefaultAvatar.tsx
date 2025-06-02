import React from 'react';

interface DefaultAvatarProps {
  gender?: 'male' | 'female';
  size?: number;
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  gender = 'unknown', 
  size = 64, 
  className 
}) => {
  const getMaleAvatar = () => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="32" fill="#4A90E2"/>
      <circle cx="32" cy="24" r="8" fill="#FFF"/>
      <path d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56" fill="#FFF"/>
    </svg>
  );

  const getFemaleAvatar = () => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="32" fill="#E91E63"/>
      <circle cx="32" cy="24" r="8" fill="#FFF"/>
      <path d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56" fill="#FFF"/>
      <path d="M24 20 Q32 16, 40 20" stroke="#FFF" strokeWidth="2" fill="none"/>
    </svg>
  );

  const getUnknownAvatar = () => (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="32" fill="#9E9E9E"/>
      <circle cx="32" cy="24" r="8" fill="#FFF"/>
      <path d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56" fill="#FFF"/>
    </svg>
  );

  if (gender === 'male') {
    return getMaleAvatar();
  } else if (gender === 'female') {
    return getFemaleAvatar();
  } else {
    return getUnknownAvatar();
  }
};

export default DefaultAvatar; 