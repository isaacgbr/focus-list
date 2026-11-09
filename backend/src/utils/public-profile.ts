export function withAvatar<T extends { avatarKey: string | null }>(user: T) {
  const { avatarKey, ...profile } = user;
  return { ...profile, avatarUrl: avatarKey ? `/profile/avatar?v=${avatarKey}` : null };
}
