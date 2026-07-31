import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Bell, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  ListTodo
} from 'lucide-react';

export function InternDashboardPage() {
  const { profile } = useAuth();

  // Placeholder Data for UI Mockup
  const internInfo = {
    name: profile?.full_name || 'Vishal Bhelave',
    photo: profile?.profile_photo_url || null,
    status: 'Active Intern',
    problemStatement: profile?.problem_statement_id ? 'AI Automated Workflow Engine' : 'AI Automated Workflow & Intelligent Data Pipeline Engine',
    allocatedAdmins: ['Admin Rajesh Sharma', 'Admin Priya Patel'],
  };

  const sampleTasks = [
    { id: 1, title: 'Implement Edge Function API Endpoint for Supabase', due: 'Today, 6:00 PM', priority: 'High', status: 'In Progress' },
    { id: 2, title: 'Submit Daily Work Diary with Code Screenshots', due: 'Today, 11:59 PM', priority: 'High', status: 'Pending' },
    { id: 3, title: 'Complete Tenon LMS Module 4: Agentic Frameworks', due: 'Tomorrow', priority: 'Medium', status: 'Pending' },
  ];

  const announcements = [
    { id: 1, title: 'Weekly Technical Sprint Review Meeting Scheduled for Friday', date: 'Jul 28, 2026' },
    { id: 2, title: 'New Guidelines Released for NotebookLM & AI Blog Submissions', date: 'Jul 26, 2026' },
    { id: 3, title: 'System Maintenance Window: Supabase RLS Policies Update', date: 'Jul 24, 2026' },
  ];

  const topInterns = [
    { rank: 1, name: 'Aarav Sharma', points: 1450, badge: '🥇' },
    { rank: 2, name: 'Ananya Verma', points: 1320, badge: '🥈' },
    { rank: 3, name: 'Rohan Deshmukh', points: 1210, badge: '🥉' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF8A00] to-[#FF3D00] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF3D00]/25 shrink-0 overflow-hidden">
            {internInfo.photo ? (
              <img src={internInfo.photo} alt={internInfo.name} className="w-full h-full object-cover" />
            ) : (
              <span>{internInfo.name.split(' ').map(n => n[0]).join('')}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#9A9A9A] uppercase tracking-wider">Welcome Back 👋</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> {internInfo.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0D0D0D] tracking-tight">{internInfo.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#9A9A9A]">
              <p>Problem Statement: <strong className="text-[#0D0D0D]">{internInfo.problemStatement}</strong></p>
              <p className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>Admins: <strong className="text-[#0D0D0D]">{internInfo.allocatedAdmins.join(', ')}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Date Display */}
        <div className="px-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-right shrink-0 hidden sm:block">
          <span className="text-[11px] font-semibold text-[#9A9A9A] block uppercase">Today's Date</span>
          <span className="text-xs font-bold text-[#0D0D0D]">Tuesday, Jul 28, 2026</span>
        </div>
      </div>

      {/* 2. Today's Action Banner */}
      <div className="bg-gradient-to-r from-[#FF8A00]/10 via-[#FF3D00]/5 to-transparent border border-[#FF8A00]/20 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FF3D00]" />
            <span>Today's Action Items</span>
          </h2>
          <span className="text-xs font-bold text-[#FF3D00] bg-white px-2.5 py-0.5 rounded-full border border-[#FF3D00]/20">
            2 Urgent
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/intern/attendance" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Mark Attendance</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Ready for today</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link to="/intern/diary" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF3D00]/10 text-[#FF3D00] rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Submit Daily Diary</p>
                <p className="text-[10px] text-[#FF3D00] font-semibold">Pending Submission</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="p-3 bg-white border border-[#EDEDED] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg">
                <ListTodo className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Pending Work Due</p>
                <p className="text-[10px] text-[#9A9A9A]">2 Tasks Due Today</p>
              </div>
            </div>
          </div>

          <Link to="/intern/learning" className="p-3 bg-white border border-[#EDEDED] rounded-xl hover:border-[#FF8A00] transition-all flex items-center justify-between group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0D0D0D]">Learning Reminder</p>
                <p className="text-[10px] text-blue-600 font-semibold">Module 4 Pending</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-[#9A9A9A] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 3. Productivity Cards (Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Attendance Rate</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D0D0D]">95%</p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> 19 of 20 days present
          </p>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Pending Work</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D0D0D]">3 Tasks</p>
          <p className="text-xs text-[#FF3D00] font-semibold">2 Tasks Due Today</p>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Daily Diary Status</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D0D0D]">Not Submitted</p>
          <p className="text-xs text-[#9A9A9A]">Last: Yesterday (Submitted)</p>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Learning Progress</span>
            <div className="p-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl shadow-sm">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0D0D0D]">80%</p>
          <p className="text-xs text-blue-600 font-semibold">4 of 5 LMS Modules</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 4. Pending Work Preview */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#0D0D0D]">Pending Work Tasks</h2>
                <p className="text-xs text-[#9A9A9A]">Tasks assigned by your allocated Admin</p>
              </div>
              <Link
                to="/intern/pending-work"
                className="text-xs font-bold text-[#FF8A00] hover:text-[#FF3D00] flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {sampleTasks.map((task) => (
                <div key={task.id} className="p-4 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl flex items-center justify-between hover:bg-white hover:border-[#D4D4D4] transition-all">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-[#0D0D0D]">{task.title}</h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#9A9A9A]">
                      <span>Due: <strong className="text-[#0D0D0D]">{task.due}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className="text-[#FF8A00]">{task.status}</strong></span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
                    task.priority === 'High' ? 'bg-[#FF3D00]/10 text-[#FF3D00]' : 'bg-[#FF8A00]/10 text-[#FF8A00]'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Daily Diary Preview & 6. Learning Progress Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Diary Preview */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#FF3D00]" />
                    <span>Daily Diary Log</span>
                  </h3>
                  <span className="text-[10px] font-bold text-[#FF3D00] bg-[#FF3D00]/10 px-2 py-0.5 rounded">
                    Due Today
                  </span>
                </div>
                <p className="text-xs text-[#9A9A9A] leading-relaxed">
                  Log your daily learnings, completed features, blockages, and code screenshots.
                </p>
                <div className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs space-y-1">
                  <p className="text-[#9A9A9A]">Today's Status: <strong className="text-[#FF3D00]">Pending</strong></p>
                  <p className="text-[#9A9A9A]">Last Submission: <strong className="text-[#0D0D0D]">Jul 27, 2026 (Submitted)</strong></p>
                </div>
              </div>

              <Link
                to="/intern/diary"
                className="w-full py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 flex items-center justify-center gap-2 transition-all"
              >
                <span>Open Daily Diary</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Learning Progress Preview */}
            <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#EDEDED] pb-2">
                  <h3 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Learning & LMS</span>
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    80% Complete
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-[#0D0D0D]">
                    <span>Advanced LMS Progress</span>
                    <span>4 / 5 Modules</span>
                  </div>
                  <div className="w-full bg-[#EDEDED] h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full w-[80%]"></div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-[#0D0D0D] pt-1">
                    <span>Tenon Integration</span>
                    <span className="text-emerald-600 font-bold">Verified</span>
                  </div>
                </div>
              </div>

              <Link
                to="/intern/learning"
                className="w-full py-2.5 bg-white border border-[#D4D4D4] text-[#0D0D0D] font-semibold text-xs rounded-xl hover:border-[#FF8A00] hover:text-[#FF8A00] flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue Learning</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-6">
          {/* 7. Announcements Preview */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#FF8A00]" />
                <span>Announcements</span>
              </h2>
              <span className="text-xs font-bold text-[#9A9A9A]">3 New</span>
            </div>

            <div className="space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl space-y-1 hover:bg-white hover:border-[#D4D4D4] transition-all">
                  <h4 className="text-xs font-bold text-[#0D0D0D] leading-snug">{item.title}</h4>
                  <span className="text-[10px] text-[#9A9A9A] block">{item.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Leaderboard Preview */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3">
              <h2 className="text-base font-bold text-[#0D0D0D] flex items-center gap-2">
                <Award className="h-4 w-4 text-[#FF3D00]" />
                <span>Leaderboard Preview</span>
              </h2>
              <Link to="/intern/leaderboard" className="text-xs font-bold text-[#FF8A00] hover:underline">
                View All
              </Link>
            </div>

            <div className="p-3 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-[#9A9A9A] uppercase block">Your Current Rank</span>
                <span className="text-lg font-black text-[#FF3D00]">Rank #4</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#9A9A9A] uppercase block">Total Points</span>
                <span className="text-lg font-black text-[#0D0D0D]">1,180 pts</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {topInterns.map((top) => (
                <div key={top.rank} className="flex justify-between items-center p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{top.badge}</span>
                    <span className="font-bold text-[#0D0D0D]">{top.name}</span>
                  </div>
                  <span className="font-extrabold text-[#FF8A00]">{top.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* 9. Quick Actions Navigation Grid */}
          <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#0D0D0D]">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/intern/attendance" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <Calendar className="h-5 w-5 text-[#FF8A00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Attendance</span>
              </Link>

              <Link to="/intern/diary" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <FileText className="h-5 w-5 text-[#FF3D00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Daily Diary</span>
              </Link>

              <Link to="/intern/learning" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <BookOpen className="h-5 w-5 text-blue-600 mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Learning</span>
              </Link>

              <Link to="/intern/leaderboard" className="p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-center hover:border-[#FF8A00] hover:bg-white transition-all space-y-1">
                <Award className="h-5 w-5 text-[#FF8A00] mx-auto" />
                <span className="text-xs font-bold text-[#0D0D0D] block">Leaderboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
