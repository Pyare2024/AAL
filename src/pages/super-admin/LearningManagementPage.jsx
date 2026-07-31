import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ManagementFilterBar } from '../../components/common/ManagementFilterBar';
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Key, 
  Link as LinkIcon,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

export function LearningManagementPage() {
  const [activePlatform, setActivePlatform] = useState('advanced-lms');

  // Reusable Filter Bar State
  const initialFilters = {
    search: '',
    problemStatement: 'all',
    college: 'all',
    city: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  };
  const [filters, setFilters] = useState(initialFilters);

  // Platform Integration Config States (Sample external integration keys)
  const [advancedLmsConfig, setAdvancedLmsConfig] = useState({
    baseUrl: 'https://lms.apexlaunchpad.ai/api/v1',
    apiKey: 'lms_live_sk_9876543210',
    status: 'Connected (Sync Active)',
    autoSync: true,
  });

  const [tenonConfig, setTenonConfig] = useState({
    baseUrl: 'https://api.tenonlearning.com/v2',
    apiKey: 'tenon_live_key_abcdef123456',
    status: 'Connected (Sync Active)',
    autoSync: true,
  });

  // Sample External Sync Data Records
  const sampleLmsProgress = [
    { id: 'lms-1', internName: 'Aarav Sharma', email: 'aarav.sharma@asg.com', course: 'Agentic AI Workflows 101', progressPct: 90, lastSynced: 'Just now', status: 'In Sync' },
    { id: 'lms-2', internName: 'Ananya Verma', email: 'ananya.v@asg.com', course: 'Agentic AI Workflows 101', progressPct: 85, lastSynced: '10 mins ago', status: 'In Sync' },
    { id: 'lms-3', internName: 'Rohan Deshmukh', email: 'rohan.d@asg.com', course: 'Agentic AI Workflows 101', progressPct: 70, lastSynced: '1 hour ago', status: 'In Sync' },
  ];

  const sampleTenonProgress = [
    { id: 'ten-1', internName: 'Aarav Sharma', email: 'aarav.sharma@asg.com', track: 'Full-Stack Agentic Systems', progressPct: 95, verifiedModules: '12 / 12', lastSynced: 'Just now' },
    { id: 'ten-2', internName: 'Ananya Verma', email: 'ananya.v@asg.com', track: 'Full-Stack Agentic Systems', progressPct: 80, verifiedModules: '10 / 12', lastSynced: '15 mins ago' },
    { id: 'ten-3', internName: 'Rohan Deshmukh', email: 'rohan.d@asg.com', track: 'Full-Stack Agentic Systems', progressPct: 65, verifiedModules: '8 / 12', lastSynced: '2 hours ago' },
  ];

  const filteredLmsData = sampleLmsProgress.filter(i => 
    !filters.search || 
    i.internName.toLowerCase().includes(filters.search.toLowerCase()) || 
    i.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  const filteredTenonData = sampleTenonProgress.filter(i => 
    !filters.search || 
    i.internName.toLowerCase().includes(filters.search.toLowerCase()) || 
    i.email.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>External API Integrations Only</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Learning Management</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Synchronize, monitor, and configure external learning platforms (Advanced LMS & Tenon).
          </p>
        </div>
      </div>

      {/* External Platform Cards Grid (Submodules as Cards) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider">External Learning Platforms</h2>
          <span className="text-xs text-[#9A9A9A]">Select a platform to inspect API sync & progress</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Advanced LMS Card */}
          <button
            onClick={() => setActivePlatform('advanced-lms')}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 group ${
              activePlatform === 'advanced-lms'
                ? 'bg-white border-[#FF8A00] shadow-md ring-2 ring-[#FF8A00]/20'
                : 'bg-white border-[#EDEDED] hover:border-[#FF8A00]/40 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <div className={`p-3 rounded-xl transition-colors ${
                activePlatform === 'advanced-lms' ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white' : 'bg-[#F7F7F7] text-[#FF8A00]'
              }`}>
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> API Active
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-[#FF8A00] transition-colors">Advanced LMS</h3>
              <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">
                External course sync, module completion webhooks, and progress tracking API.
              </p>
            </div>
          </button>

          {/* Tenon Platform Card */}
          <button
            onClick={() => setActivePlatform('tenon')}
            className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 group ${
              activePlatform === 'tenon'
                ? 'bg-white border-[#FF8A00] shadow-md ring-2 ring-[#FF8A00]/20'
                : 'bg-white border-[#EDEDED] hover:border-[#FF8A00]/40 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-center w-full">
              <div className={`p-3 rounded-xl transition-colors ${
                activePlatform === 'tenon' ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white' : 'bg-[#F7F7F7] text-[#FF3D00]'
              }`}>
                <Globe className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> API Active
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0D0D0D] group-hover:text-[#FF3D00] transition-colors">Tenon Platform</h3>
              <p className="text-xs text-[#9A9A9A] mt-1 leading-relaxed">
                External skill track verification, interactive lab webhooks, and certification API.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Common Reusable Filter Bar */}
      <ManagementFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        showProblemStatement={false}
        showCollege={false}
        showCity={false}
        placeholderSearch={`Search ${activePlatform === 'advanced-lms' ? 'Advanced LMS' : 'Tenon'} sync records by Intern Name or Email...`}
      />

      {/* Active Platform Sync Details & Roster View */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
        {/* PLATFORM 1: ADVANCED LMS VIEW */}
        {activePlatform === 'advanced-lms' && (
          <div className="space-y-6">
            {/* API Config Box */}
            <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EDEDED] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <Key className="h-4 w-4 text-[#FF8A00]" />
                    <span>Advanced LMS Integration Endpoint Settings</span>
                  </h3>
                  <p className="text-xs text-[#9A9A9A]">External API credentials & webhook endpoint configuration</p>
                </div>
                <button className="px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-lg text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5 hover:border-[#FF8A00]">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Trigger Manual Sync</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-[#9A9A9A] block">Base API URL:</span>
                  <code className="text-[#0D0D0D] bg-white px-2 py-1 rounded border border-[#EDEDED] block mt-0.5 truncate">
                    {advancedLmsConfig.baseUrl}
                  </code>
                </div>
                <div>
                  <span className="font-bold text-[#9A9A9A] block">Secret API Key:</span>
                  <code className="text-[#0D0D0D] bg-white px-2 py-1 rounded border border-[#EDEDED] block mt-0.5 truncate">
                    {advancedLmsConfig.apiKey}
                  </code>
                </div>
              </div>
            </div>

            {/* Synced Learning Progress Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0D0D0D]">Synced Intern Course Progress ({filteredLmsData.length})</h3>
                <span className="text-xs font-semibold text-[#9A9A9A]">Updated via Webhook</span>
              </div>

              <div className="space-y-3">
                {filteredLmsData.map((item) => (
                  <div key={item.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{item.internName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{item.email} | Course: <strong className="text-[#0D0D0D]">{item.course}</strong></p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-black text-[#FF3D00] block">{item.progressPct}% Complete</span>
                        <span className="text-[10px] text-[#9A9A9A]">Synced: {item.lastSynced}</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 2: TENON VIEW */}
        {activePlatform === 'tenon' && (
          <div className="space-y-6">
            {/* API Config Box */}
            <div className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EDEDED] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#FF3D00]" />
                    <span>Tenon Integration API Endpoint Settings</span>
                  </h3>
                  <p className="text-xs text-[#9A9A9A]">External Tenon REST API endpoint & webhook configuration</p>
                </div>
                <button className="px-3 py-1.5 bg-white border border-[#D4D4D4] rounded-lg text-xs font-bold text-[#0D0D0D] flex items-center gap-1.5 hover:border-[#FF3D00]">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync Tenon Labs</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-[#9A9A9A] block">Tenon API Endpoint:</span>
                  <code className="text-[#0D0D0D] bg-white px-2 py-1 rounded border border-[#EDEDED] block mt-0.5 truncate">
                    {tenonConfig.baseUrl}
                  </code>
                </div>
                <div>
                  <span className="font-bold text-[#9A9A9A] block">Tenon Secret Token:</span>
                  <code className="text-[#0D0D0D] bg-white px-2 py-1 rounded border border-[#EDEDED] block mt-0.5 truncate">
                    {tenonConfig.apiKey}
                  </code>
                </div>
              </div>
            </div>

            {/* Synced Tenon Progress Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#0D0D0D]">Synced Tenon Track Completion ({filteredTenonData.length})</h3>
                <span className="text-xs font-semibold text-[#9A9A9A]">Updated via Webhook</span>
              </div>

              <div className="space-y-3">
                {filteredTenonData.map((item) => (
                  <div key={item.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#0D0D0D]">{item.internName}</h4>
                      <p className="text-xs text-[#9A9A9A]">{item.email} | Track: <strong className="text-[#0D0D0D]">{item.track}</strong></p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-black text-blue-600 block">{item.progressPct}% Completed</span>
                        <span className="text-[10px] text-[#9A9A9A]">Labs: {item.verifiedModules}</span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md shrink-0">
                        Tenon Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
