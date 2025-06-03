import React from 'react';

interface DefaultAvatarProps {
  className?: string;
  gender?: 'female' | 'male';
  size?: number;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ className, gender = 'unknown', size = 64 }) => {
  const getMaleAvatar = () => (
    <svg
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      <circle
        cx="32"
        cy="32"
        fill="#4A90E2"
        r="32"
      />
      <circle
        cx="32"
        cy="24"
        fill="#FFF"
        r="8"
      />
      <path
        d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56"
        fill="#FFF"
      />
    </svg>
  );

  const getFemaleAvatar = () => (
    <svg
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      <circle
        cx="32"
        cy="32"
        fill="#E91E63"
        r="32"
      />
      <circle
        cx="32"
        cy="24"
        fill="#FFF"
        r="8"
      />
      <path
        d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56"
        fill="#FFF"
      />
      <path
        d="M24 20 Q32 16, 40 20"
        fill="none"
        stroke="#FFF"
        strokeWidth="2"
      />
    </svg>
  );

  const getUnknownAvatar = () => (
    <svg
      className={className}
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      <circle
        cx="32"
        cy="32"
        fill="#9E9E9E"
        r="32"
      />
      <circle
        cx="32"
        cy="24"
        fill="#FFF"
        r="8"
      />
      <path
        d="M18 56 C18 44, 24 40, 32 40 C40 40, 46 44, 46 56"
        fill="#FFF"
      />
    </svg>
  );

  if (gender === 'male') {
    return getMaleAvatar();
  } else if (gender === 'female') {
    return getFemaleAvatar();
  }
  return getUnknownAvatar();
};

export default DefaultAvatar;
