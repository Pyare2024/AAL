import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { fetchGeneralSettings, saveGeneralPreferences } from '../../services/settingsService';
import { 
  SettingsHorizontalTabs, 
  GeneralSettingsForm, 
  NotificationsSettingsPanel, 
  SecuritySettingsPanel, 
  PrivacySettingsPanel, 
  HelpSupportPanel, 
  AboutPanel, 
  LogoutConfirmationDialog 
} from '../../components/settings/SettingsComponents';
import { SettingsTabId, GeneralPreferences, ReadOnlyAccountInfo } from '../../types/settingsTypes';
import { LoadingState } from '../../components/productivity/CommonStates';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [accountInfo, setAccountInfo] = useState<ReadOnlyAccountInfo | null>(null);
  const [preferences, setPreferences] = useState<GeneralPreferences | null>(null);

  const userId = (user as any)?.id || 'demo-user';

  const loadData = async () => {
    setLoading(true);
    const res = await fetchGeneralSettings(userId);
    setAccountInfo(res.accountInfo);
    setPreferences(res.preferences);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleSaveGeneral = async (updated: GeneralPreferences): Promise<boolean> => {
    const success = await saveGeneralPreferences(userId, updated);
    if (success) {
      setPreferences(updated);
    }
    return success;
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  if (loading || !accountInfo || !preferences) {
    return <div className="p-6"><LoadingState message="Loading Settings..." /></div>;
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto p-2 sm:p-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Settings</h1>
        <p className="text-xs text-[#737373] mt-1">Manage your account preferences, notifications, security, and privacy.</p>
      </div>

      {/* Top Compact Horizontal Tab Navigation */}
      <SettingsHorizontalTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Clean Single Content Surface Panel */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm min-h-[480px]">
        {activeTab === 'general' && (
          <GeneralSettingsForm
            accountInfo={accountInfo}
            initialPreferences={preferences}
            onSave={handleSaveGeneral}
            onOpenLogout={() => setShowLogoutModal(true)}
          />
        )}

        {activeTab === 'notifications' && <NotificationsSettingsPanel />}

        {activeTab === 'security' && <SecuritySettingsPanel />}

        {activeTab === 'privacy' && <PrivacySettingsPanel />}

        {activeTab === 'help' && <HelpSupportPanel />}

        {activeTab === 'about' && <AboutPanel />}
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
