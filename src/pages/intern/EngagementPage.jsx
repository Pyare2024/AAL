import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Sparkles, 
  Trophy, 
  Megaphone, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

/**
 * Engagement Overview Page (Step 1 of Module 3)
 * Displays 5 professional feature cards:
 * 1. Community
 * 2. AI Post Generation
 * 3. Leaderboard
 * 4. Announcements
 * 5. Feedback & Suggestions
 */
export function EngagementPage() {
  const navigate = useNavigate();

  const engagementCards = [
    {
      id: 'community',
      title: 'Community',
      description: 'Ask questions, share learnings, and collaborate with other interns in topic categories.',
      statusText: '12 Active Discussions',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      route: '/intern/community',
      buttonText: 'Open Community'
    },
    {
      id: 'ai-post-generator',
      title: 'AI Post Generation',
      description: 'Draft professional LinkedIn posts based on your daily work summary, learning, or certificates.',
      statusText: 'Ready to Draft',
      icon: Sparkles,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      route: '/intern/ai-post-generator',
      buttonText: 'Open Generator'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'Track your points, weekly/monthly rank, and top performers across problem statements.',
      statusText: 'Rank #4 (850 pts)',
      icon: Trophy,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      route: '/intern/leaderboard',
      buttonText: 'View Leaderboard'
    },

    {
      id: 'feedback',
      title: 'Feedback & Suggestions',
      description: 'Submit private feedback, report platform issues, or send suggestions to program management.',
      statusText: '1 Ticket Responded',
      icon: MessageSquare,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      route: '/intern/feedback',
      buttonText: 'Submit Feedback'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Module 3</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Engagement</h1>
          <p className="text-xs text-[#737373] mt-1">
            Communicate professionally, stay informed, receive recognition, and provide feedback.
          </p>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {engagementCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold ${card.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#737373] bg-[#FAFAFA] border border-[#EDEDED] px-2.5 py-1 rounded-full">
                    {card.statusText}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#171717]">{card.title}</h3>
                  <p className="text-xs text-[#737373] leading-relaxed mt-1">{card.description}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(card.route)}
                className="w-full py-2.5 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-gray-100 text-[#171717] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <span>{card.buttonText}</span>
                <ArrowRight className="h-4 w-4 text-[#FF8A00]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
