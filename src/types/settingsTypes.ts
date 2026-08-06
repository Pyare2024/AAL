export interface GeneralPreferences {
  displayName: string;
  mobile: string;
  whatsappNumber: string;
  preferredLanguage: 'English' | 'Marathi' | 'Hindi';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY';
}

export interface ReadOnlyAccountInfo {
  fullName: string;
  email: string;
  internId: string;
  role: string;
  profilePhotoUrl?: string;
}

export type SettingsTabId = 'general' | 'notifications' | 'security' | 'privacy' | 'help' | 'about';

export interface SettingsNavItem {
  id: SettingsTabId;
  label: string;
  iconName: string;
  route: string;
}

export const settingsNavItems: SettingsNavItem[] = [
  { id: 'general', label: 'General', iconName: 'Sliders', route: '/intern/settings/general' },
  { id: 'notifications', label: 'Notifications', iconName: 'Bell', route: '/intern/settings/notifications' },
  { id: 'security', label: 'Security', iconName: 'Shield', route: '/intern/settings/security' },
  { id: 'privacy', label: 'Privacy', iconName: 'Lock', route: '/intern/settings/privacy' },
  { id: 'help', label: 'Help & Support', iconName: 'HelpCircle', route: '/intern/settings/help' },
  { id: 'about', label: 'About', iconName: 'Info', route: '/intern/settings/about' }
];
