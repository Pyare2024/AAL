import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, ListTodo, BookOpen, Users } from 'lucide-react';

/**
 * Section 4 — Quick Actions
 * Large action buttons containing icon + title.
 */
export function QuickActionGrid() {
  const actions = [
    { title: 'Mark Attendance', icon: Calendar, to: '/intern/attendance', color: 'text-[#FF8A00]', borderHover: 'hover:border-[#FF8A00]' },
    { title: 'Open Daily Diary', icon: FileText, to: '/intern/diary', color: 'text-[#FF3D00]', borderHover: 'hover:border-[#FF3D00]' },
    { title: 'Pending Work', icon: ListTodo, to: '/intern/pending-work', color: 'text-[#FF8A00]', borderHover: 'hover:border-[#FF8A00]' },
    { title: 'Learning', icon: BookOpen, to: '/intern/learning', color: 'text-blue-600', borderHover: 'hover:border-blue-500' },
    { title: 'Community', icon: Users, to: '/intern/community', color: 'text-[#171717]', borderHover: 'hover:border-[#171717]' },
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-[#171717] tracking-tight">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <Link
              key={idx}
              to={act.to}
              className={`p-4 bg-white border border-[#EDEDED] rounded-xl flex flex-col items-center justify-center gap-2.5 text-center transition-all ${act.borderHover} shadow-sm group`}
            >
              <div className={`p-2.5 bg-[#FAFAFA] rounded-xl group-hover:scale-105 transition-transform`}>
                <Icon className={`h-5 w-5 ${act.color}`} />
              </div>
              <span className="text-xs font-bold text-[#171717]">
                {act.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
