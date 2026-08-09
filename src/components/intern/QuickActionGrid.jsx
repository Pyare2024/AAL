import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ListTodo, BookOpen, Users, ChevronRight } from 'lucide-react';

/**
 * Section 4 — Quick Actions
 * Action cards with icon + title + arrow indicator.
 */
export function QuickActionGrid() {
  const actions = [
    { title: 'Mark Attendance', desc: 'Daily check-in', icon: Calendar, to: '/intern/attendance', color: 'text-[#FF8A00]', bg: 'bg-[#FF8A00]/10' },
    { title: 'Open Daily Diary', desc: 'Log today\'s work', icon: FileText, to: '/intern/diary', color: 'text-[#FF3D00]', bg: 'bg-[#FF3D00]/10' },
    { title: 'Pending Work', desc: 'Action tasks', icon: ListTodo, to: '/intern/pending-work', color: 'text-[#FF8A00]', bg: 'bg-[#FF8A00]/10' },
    { title: 'Learning LMS', desc: 'Course modules', icon: BookOpen, to: '/intern/learning', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Community', desc: 'Discussions & feed', icon: Users, to: '/intern/community', color: 'text-[#0D0D0D]', bg: 'bg-[#F7F7F7]' },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-extrabold text-[#0D0D0D] uppercase tracking-wider">
        Quick Action Shortcuts
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              to={act.to}
              className="p-4 bg-white border border-[#EDEDED] hover:border-[#FF8A00]/40 rounded-2xl flex flex-col justify-between items-start gap-3 transition-all hover:-translate-y-0.5 shadow-xs hover:shadow-md group text-left"
            >
              <div className="w-full flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${act.bg} shrink-0`}>
                  <Icon className={`h-5 w-5 ${act.color}`} />
                </div>
                <ChevronRight className="h-4 w-4 text-[#9A9A9A] group-hover:text-[#FF3D00] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#0D0D0D] block group-hover:text-[#FF3D00] transition-colors">
                  {act.title}
                </span>
                <span className="text-[10px] text-[#9A9A9A] font-medium block mt-0.5">
                  {act.desc}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

