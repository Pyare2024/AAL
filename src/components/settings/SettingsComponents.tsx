import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Bell, 
  Shield, 
  Lock, 
  HelpCircle, 
  Info, 
  User, 
  LogOut, 
  Save, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Key,
  Laptop,
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { settingsNavItems, SettingsTabId, GeneralPreferences, ReadOnlyAccountInfo } from '../../types/settingsTypes';

const iconMap: Record<string, React.ElementType> = {
  Sliders,
  Bell,
  Shield,
  Lock,
  HelpCircle,
  Info
};

/**
 * Compact Horizontal Tab Header Navigation
 * Displayed cleanly at the top of the Settings content surface.
 * Active state: Orange text, orange bottom border line, slightly bold text.
 * Inactive state: Dark gray text, transparent background.
 */
export function SettingsHorizontalTabs({ 
  activeTab, 
  onSelectTab 
}: { 
  activeTab: SettingsTabId; 
  onSelectTab: (tab: SettingsTabId) => void; 
}) {
  return (
    <div className="border-b border-[#EDEDED] overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-6 min-w-max">
        {settingsNavItems.map((item) => {
          const Icon = iconMap[item.iconName] || Sliders;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 py-3 px-1 text-xs transition-all relative border-b-2 font-bold ${
                isActive 
                  ? 'border-[#FF8A00] text-[#FF8A00]' 
                  : 'border-transparent text-[#737373] hover:text-[#171717]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#FF8A00]' : 'text-[#737373]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * General Settings Section Component
 */
export function GeneralSettingsForm({
  accountInfo,
  initialPreferences,
  onSave,
  onOpenLogout
}: {
  accountInfo: ReadOnlyAccountInfo;
  initialPreferences: GeneralPreferences;
  onSave: (updated: GeneralPreferences) => Promise<boolean>;
  onOpenLogout: () => void;
}) {
  const [formData, setFormData] = useState<GeneralPreferences>(initialPreferences);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setFormData(initialPreferences);
  }, [initialPreferences]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialPreferences);

  const handleChange = <K extends keyof GeneralPreferences>(field: K, value: GeneralPreferences[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData(initialPreferences);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const success = await onSave(formData);
    setIsSubmitting(false);

    if (success) {
      setFeedback({ type: 'success', message: 'Your general settings changes have been saved.' });
    } else {
      setFeedback({ type: 'error', message: 'Failed to save settings. Please try again.' });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">General Settings</h2>
        <p className="text-xs text-[#737373] mt-0.5">Manage your personal application preferences.</p>
      </div>

      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-300 text-[#FF8A00] font-bold flex items-center justify-center overflow-hidden shrink-0">
            {accountInfo.profilePhotoUrl ? (
              <img src={accountInfo.profilePhotoUrl} alt={accountInfo.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#171717]">{accountInfo.fullName}</h3>
            <span className="text-[11px] text-[#737373]">{accountInfo.email}</span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-bold uppercase text-[#737373] block">Intern ID</span>
          <span className="font-mono font-bold text-[#171717]">{accountInfo.internId}</span>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form id="general-settings-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-[#171717] block mb-1">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            />
          </div>

          <div>
            <label className="font-bold text-[#737373] block mb-1">Registered Email (Read-Only)</label>
            <input
              type="email"
              disabled
              value={accountInfo.email}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Mobile Number</label>
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={formData.whatsappNumber}
              onChange={(e) => handleChange('whatsappNumber', e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Preferred Language</label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => handleChange('preferredLanguage', e.target.value as any)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            >
              <option value="English">English</option>
              <option value="Marathi">Marathi</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (+0:00)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-[#171717] block mb-1">Date Display Format</label>
            <select
              value={formData.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value as any)}
              className="w-full p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none text-[#171717]"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 03/08/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-03)</option>
              <option value="DD MMM YYYY">DD MMM YYYY (e.g. 03 Aug 2026)</option>
            </select>
          </div>
        </div>
      </form>

      {/* Sticky Bottom Action Bar (Only shows when isDirty is true) */}
      {isDirty && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-40 bg-white border border-[#EDEDED] shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4 max-w-xl mx-auto border-t-2 border-t-[#FF8A00]">
          <span className="text-xs font-bold text-[#171717]">You have unsaved changes.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-gray-100 text-[#737373] font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="general-settings-form"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Danger Zone */}
      <div className="p-5 border border-red-200 bg-red-50/50 rounded-2xl space-y-3 mt-8">
        <div>
          <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
          <p className="text-xs text-red-700 mt-0.5">Sign out from your active Intern Portal session on this device.</p>
        </div>

        <button
          type="button"
          onClick={onOpenLogout}
          className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-2xs"
        >
          <LogOut className="h-4 w-4 text-red-600" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Notifications Section Component (Compact Rows with Active/Inactive Toggles)
 */
export function NotificationsSettingsPanel() {
  const [toggles, setToggles] = useState({
    attendance: true,
    diary: true,
    pendingWork: true,
    learning: true,

    community: false,
    leaderboard: true,
    feedback: true
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const rows = [
    { key: 'attendance', title: 'Attendance Reminder', desc: 'Remind me before check-in and check-out times.' },
    { key: 'diary', title: 'Daily Diary Reminder', desc: 'Remind me to write and submit today’s diary before cutoff.' },
    { key: 'pendingWork', title: 'Pending Work Reminder', desc: 'Notify me before assigned work deadlines.' },
    { key: 'learning', title: 'Learning Updates', desc: 'Notify me about new courses and assigned learning track updates.' },

    { key: 'community', title: 'Community Replies', desc: 'Notify me when someone replies to my post or comment.' },
    { key: 'leaderboard', title: 'Leaderboard Updates', desc: 'Notify me about meaningful rank changes on the leaderboard.' },
    { key: 'feedback', title: 'Feedback Responses', desc: 'Notify me when my feedback ticket receives an admin response.' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">Notification Preferences</h2>
        <p className="text-xs text-[#737373] mt-0.5">Control how and when you receive non-critical updates.</p>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 flex items-center gap-2">
        <Info className="h-4 w-4 text-amber-700 shrink-0" />
        <span>Critical account, security alerts, and urgent internship status notifications cannot be disabled.</span>
      </div>

      <div className="divide-y divide-[#EDEDED] text-xs">
        {rows.map((row) => {
          const isActive = toggles[row.key as keyof typeof toggles];
          return (
            <div key={row.key} className="py-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-[#171717]">{row.title}</h4>
                <p className="text-[#737373] mt-0.5">{row.desc}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle(row.key as keyof typeof toggles)}
                  className={`w-11 h-6 rounded-full transition-colors relative border ${
                    isActive ? 'bg-[#FF8A00] border-[#FF8A00]' : 'bg-gray-200 border-gray-300'
                  }`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-5.5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Security Section Component (Actions, Active Sessions, 2FA)
 */
export function SecuritySettingsPanel() {
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">Security Settings</h2>
        <p className="text-xs text-[#737373] mt-0.5">Manage password, session security, and account protection.</p>
      </div>

      {/* Password Action Row */}
      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-[#171717]">Account Password</h4>
          <p className="text-[#737373] mt-0.5">Last changed: 01 August 2026</p>
        </div>
        <button
          type="button"
          onClick={() => alert('Password reset link sent to your registered email.')}
          className="px-4 py-2 bg-white border border-[#EDEDED] hover:bg-gray-50 font-bold text-[#171717] rounded-xl shadow-2xs shrink-0"
        >
          Change Password
        </button>
      </div>

      {/* Active Sessions */}
      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#EDEDED] pb-2">
          <h4 className="font-bold text-[#171717]">Active Sessions</h4>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Current Session Active</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Laptop className="h-5 w-5 text-[#FF8A00]" />
            <div>
              <span className="font-bold text-[#171717] block">Windows PC — Chrome Browser</span>
              <span className="text-[#737373] block">Nandurbar, India · Active Now</span>
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-[#FF8A00] hover:underline"
          >
            Sign Out Other Sessions
          </button>
        </div>
      </div>

      {/* 2FA Status */}
      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-[#171717]">Two-Factor Authentication (2FA)</h4>
          <p className="text-[#737373] mt-0.5">Extra verification layer managed by organizational single-sign-on.</p>
        </div>
        <span className="px-3 py-1 bg-gray-100 border border-gray-200 font-bold text-gray-700 rounded-full shrink-0">
          Disabled
        </span>
      </div>
    </div>
  );
}

/**
 * Privacy Section Component (Compact Toggle Rows & Location Disclosure)
 */
export function PrivacySettingsPanel() {
  const [toggles, setToggles] = useState({
    profileVisibility: true,
    leaderboardVisibility: true,
    communityProfile: true,
    activityStatus: true
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">Privacy Settings</h2>
        <p className="text-xs text-[#737373] mt-0.5">Control how your details are displayed inside the Intern Portal.</p>
      </div>

      <div className="divide-y divide-[#EDEDED]">
        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-[#171717]">Profile Visibility</h4>
            <p className="text-[#737373] mt-0.5">Allow other interns in your track to view your professional skills.</p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('profileVisibility')}
            className={`w-11 h-6 rounded-full transition-colors relative border ${
              toggles.profileVisibility ? 'bg-[#FF8A00] border-[#FF8A00]' : 'bg-gray-200 border-gray-300'
            }`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
              toggles.profileVisibility ? 'translate-x-5.5' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-[#171717]">Leaderboard Visibility</h4>
            <p className="text-[#737373] mt-0.5">Display your name and points on the track leaderboard.</p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('leaderboardVisibility')}
            className={`w-11 h-6 rounded-full transition-colors relative border ${
              toggles.leaderboardVisibility ? 'bg-[#FF8A00] border-[#FF8A00]' : 'bg-gray-200 border-gray-300'
            }`}
          >
            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
              toggles.leaderboardVisibility ? 'translate-x-5.5' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="py-4 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-[#171717]">Contact Information Visibility</h4>
            <p className="text-[#737373] mt-0.5">Contact details are strictly visible only to assigned Admins and Super Admins.</p>
          </div>
          <span className="px-2.5 py-1 font-bold text-gray-600 bg-gray-100 rounded-full border border-gray-200">
            Protected
          </span>
        </div>
      </div>

      <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-1">
        <h4 className="font-bold text-[#171717]">Attendance Location Privacy</h4>
        <p className="text-[#737373] leading-relaxed">
          Your location is captured only during attendance Check-in and Check-out. Continuous background tracking is not used.
        </p>
      </div>
    </div>
  );
}

/**
 * Help & Support Section Component
 */
export function HelpSupportPanel() {
  const supportRows = [
    { title: 'Frequently Asked Questions', desc: 'Find quick answers for attendance, daily diary, and submissions.' },
    { title: 'Contact Assigned Admin', desc: 'Send a direct inquiry to Mr. Pankaj Wankhade.' },
    { title: 'Raise Support Ticket', desc: 'Submit a technical issue or platform assistance request.' },
    { title: 'View My Support Tickets', desc: 'Track status and responses for your raised support tickets.' },
    { title: 'Platform Usage Guide', desc: 'Read guidelines and best practices for AI Apex Launchpad.' }
  ];

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">Help & Support</h2>
        <p className="text-xs text-[#737373] mt-0.5">Find answers, raise support tickets, or contact program administrators.</p>
      </div>

      <div className="divide-y divide-[#EDEDED]">
        {supportRows.map((row, idx) => (
          <button
            key={idx}
            onClick={() => alert(`Opening ${row.title}`)}
            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] px-2 rounded-xl text-left transition-colors"
          >
            <div>
              <h4 className="font-bold text-[#171717]">{row.title}</h4>
              <p className="text-[#737373] mt-0.5">{row.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#FF8A00] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * About Section Component
 */
export function AboutPanel() {
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-[#EDEDED] pb-3">
        <h2 className="text-base font-bold text-[#171717]">About AI Apex Launchpad</h2>
        <p className="text-xs text-[#737373] mt-0.5">Application details and legal information.</p>
      </div>

      <div className="p-5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-3">
        <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
          <span className="font-bold text-[#737373]">Application</span>
          <span className="font-bold text-[#171717]">AI Apex Launchpad</span>
        </div>
        <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
          <span className="font-bold text-[#737373]">Portal</span>
          <span className="font-bold text-[#171717]">Intern Portal</span>
        </div>
        <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
          <span className="font-bold text-[#737373]">Application Version</span>
          <span className="font-mono font-bold text-[#171717]">v1.0.0 (Production)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-[#737373]">Build Version</span>
          <span className="font-mono font-bold text-[#171717]">2026.08.03-RELEASE</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <button onClick={() => alert('Opening Privacy Policy')} className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-1">
          <span>Privacy Policy</span>
          <ExternalLink className="h-3 w-3" />
        </button>
        <button onClick={() => alert('Opening Terms of Service')} className="text-xs font-bold text-[#FF8A00] hover:underline flex items-center gap-1">
          <span>Terms of Service</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/**
 * Logout Confirmation Dialog Component
 */
export function LogoutConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#171717]">Log out of AI Apex?</h4>
            <p className="text-xs text-[#737373] mt-0.5">You will need to sign in again to access the Intern Portal.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
