import type { ImageSourcePropType } from 'react-native';

const maleAvatar = require('../../assets/figma/student/profile-avatar.png');
const femaleAvatar = require('../../assets/figma/student/profile-avatar-female.png');

export type ProfileAvatarPreset = 'male' | 'female';

const PRESET_VALUES: Record<ProfileAvatarPreset, string> = {
  male: 'preset:male',
  female: 'preset:female',
};

export const PROFILE_AVATAR_OPTIONS: Array<{
  label: string;
  preset: ProfileAvatarPreset;
  source: ImageSourcePropType;
}> = [
  { label: '남자', preset: 'male', source: maleAvatar },
  { label: '여자', preset: 'female', source: femaleAvatar },
];

export function getProfileAvatarPresetValue(preset: ProfileAvatarPreset) {
  return PRESET_VALUES[preset];
}

export function getSelectedProfileAvatarPreset(
  avatarUrl: string | null | undefined,
): ProfileAvatarPreset | null {
  if (!avatarUrl || avatarUrl === PRESET_VALUES.male) {
    return 'male';
  }

  if (avatarUrl === PRESET_VALUES.female) {
    return 'female';
  }

  return null;
}

export function isProfileAvatarPreset(
  avatarUrl: string | null | undefined,
) {
  return (
    avatarUrl === PRESET_VALUES.male || avatarUrl === PRESET_VALUES.female
  );
}

export function getProfileAvatarSource(
  avatarUrl: string | null | undefined,
): ImageSourcePropType {
  if (avatarUrl === PRESET_VALUES.female) {
    return femaleAvatar;
  }

  if (!avatarUrl || avatarUrl === PRESET_VALUES.male) {
    return maleAvatar;
  }

  return { uri: avatarUrl };
}
