export async function getNotificationPreferences(userId: string) {
  return {
    emailNotifications: true,
    pushNotifications: true,
  };
}

export async function updateNotificationPreferences(userId: string, preferences: any) {
  return preferences;
}
