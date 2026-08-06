import React, { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Eye,
  User,
  MapPin,
  Star,
  Award,
  Medal,
  BarChart3,
} from 'lucide-react';
import {
  LeaderboardRow,
  LeaderboardSummaryData,
  FilterState,
  FilterOptions,
  PaginationState,
  SortField,
  SortState,
  ViewerRole,
  SCORE_CATEGORIES,
} from '../../types/leaderboardTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function RankMovementIcon({ movement, delta }: { movement: LeaderboardRow['rankMovement']; delta: number }) {
  if (movement === 'up')   return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><TrendingUp className="h-3 w-3" />+{delta}</span>;
  if (movement === 'down') return <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500"><TrendingDown className="h-3 w-3" />−{delta}</span>;
  if (movement === 'new')  return <span className="text-[10px] font-bold text-[#FF8A00]">NEW</span>;
  return <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#737373]"><Minus className="h-3 w-3" /></span>;
}

function Avatar({ name, url, size = 36 }: { name: string; url?: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF3D00] text-white font-bold flex items-center justify-center shrink-0"
    >
      {initials}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-white font-black text-sm shadow">🥇</span>;
  if (rank === 2) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-400 text-white font-black text-sm shadow">🥈</span>;
  if (rank === 3) return <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white font-black text-sm shadow">🥉</span>;
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#EDEDED] text-[#171717] font-bold text-xs">
      {rank}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardHeader
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardHeader({ totalRanked }: { totalRanked: number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Leaderboard</h1>
        <p className="text-xs text-[#737373] mt-0.5">
          View verified intern performance and overall ranking.
        </p>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[#737373] bg-[#F5F5F5] px-3 py-1.5 rounded-xl">
        <BarChart3 className="h-3.5 w-3.5 text-[#FF8A00]" />
        <span className="font-semibold">{totalRanked} ranked interns</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardSummary — stat cards row
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardSummary({
  summary,
  viewerRole,
}: {
  summary: LeaderboardSummaryData;
  viewerRole: ViewerRole;
}) {
  const cards = [
    {
      label: 'Total Ranked',
      value: summary.totalRanked,
      icon: <User className="h-4 w-4 text-[#FF8A00]" />,
    },
    {
      label: 'Top Performer',
      value: summary.topPerformerName,
      sub: `Score ${summary.topPerformerScore}`,
      icon: <Trophy className="h-4 w-4 text-amber-500" />,
    },
    {
      label: 'Average Score',
      value: `${summary.averageScore}`,
      icon: <Star className="h-4 w-4 text-blue-500" />,
    },
    ...(viewerRole === 'intern' && summary.myRank
      ? [{
          label: 'My Rank',
          value: `#${summary.myRank}`,
          sub: summary.myMovement === 'up' ? '↑ Improved' : summary.myMovement === 'down' ? '↓ Dropped' : '→ Stable',
          icon: <Award className="h-4 w-4 text-emerald-500" />,
        }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">{c.label}</span>
            {c.icon}
          </div>
          <p className="text-lg font-bold text-[#171717] truncate">{c.value}</p>
          {c.sub && <p className="text-[10px] text-[#737373] mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TopPerformers — top 3 podium cards
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TopPerformersPodium — Visual 3D-style Podium for Top 3 Interns
// Order: Rank 2 (Left) | Rank 1 (Center & Highest) | Rank 3 (Right)
// ─────────────────────────────────────────────────────────────────────────────

interface TopPerformersProps {
  top3: LeaderboardRow[];
  onSelectIntern?: (row: LeaderboardRow) => void;
}

export function TopPerformers({ top3, onSelectIntern }: TopPerformersProps) {
  if (!top3 || top3.length === 0) return null;

  const rank1 = top3.find((r) => r.rank === 1) || top3[0];
  const rank2 = top3.find((r) => r.rank === 2);
  const rank3 = top3.find((r) => r.rank === 3);

  const desktopOrdered = [
    { item: rank2, position: 'left', rank: 2 },
    { item: rank1, position: 'center', rank: 1 },
    { item: rank3, position: 'right', rank: 3 },
  ].filter((x) => x.item);

  const mobileOrdered = [
    { item: rank1, rank: 1 },
    { item: rank2, rank: 2 },
    { item: rank3, rank: 3 },
  ].filter((x) => x.item);

  const getCardStyle = (rank: number) => {
    if (rank === 1) {
      return {
        cardClass: 'bg-white rounded-[20px] shadow-sm border border-[#FF8A00] flex flex-col pt-8 pb-6 px-4 md:px-6 h-[400px]',
        avatarSize: 88,
        medalClass: 'bg-amber-400 text-white border-white',
        titleClass: 'text-lg font-extrabold text-[#171717] line-clamp-2 leading-tight',
      };
    }
    if (rank === 2) {
      return {
        cardClass: 'bg-white rounded-[20px] shadow-sm border border-[#EDEDED] flex flex-col pt-6 pb-6 px-4 md:px-6 h-[360px]',
        avatarSize: 72,
        medalClass: 'bg-slate-300 text-slate-800 border-white',
        titleClass: 'text-base font-bold text-[#171717] line-clamp-2 leading-tight',
      };
    }
    return {
      cardClass: 'bg-white rounded-[20px] shadow-sm border border-[#EDEDED] flex flex-col pt-6 pb-6 px-4 md:px-6 h-[360px]',
      avatarSize: 72,
      medalClass: 'bg-[#cd7f32] text-white border-white',
      titleClass: 'text-base font-bold text-[#171717] line-clamp-2 leading-tight',
    };
  };

  const renderCardContent = (item: LeaderboardRow, rank: number) => {
    const theme = getCardStyle(rank);
    return (
      <>
        {rank === 1 && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-500 bg-white p-1.5 rounded-full border border-amber-200 shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col items-center text-center flex-1">
          <div className="relative mb-4">
            <Avatar name={item.fullName} url={item.profilePhotoUrl} size={theme.avatarSize} />
            <div className={`absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full border-2 font-bold text-[10px] shadow-sm ${theme.medalClass}`}>
              #{rank}
            </div>
          </div>
          
          <h3 className={theme.titleClass}>{item.fullName}</h3>
          <p className="text-[11px] text-[#737373] mt-1 font-medium">{item.internCode}</p>

          <div className="mt-3 flex flex-col items-center space-y-1 w-full text-[11px] text-[#737373]">
            <p className="flex items-center justify-center gap-1"><MapPin className="h-3 w-3 text-[#FF8A00]" /> {item.city}</p>
            <p className="truncate w-full max-w-full text-center px-1" title={item.problemStatement}>{item.problemStatement}</p>
            {item.collegeName && <p className="truncate w-full max-w-full text-center px-1" title={item.collegeName}>{item.collegeName}</p>}
          </div>
        </div>

        <div className="w-full mt-4 pt-4 border-t border-[#EDEDED] flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div className="text-left">
              <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Points</p>
              <p className="text-xl font-black text-[#171717] leading-none mt-0.5">{item.totalPoints}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Score</p>
              <p className="text-sm font-bold text-[#FF8A00] leading-none mt-0.5">{item.overallScore}/100</p>
            </div>
          </div>
          
          <div className="w-full h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-full" 
              style={{ width: `${item.overallScore}%` }}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-black text-[#171717]">Top Performers Podium</h2>
        <p className="text-xs text-[#737373] mt-1 font-medium">Recognising the highest ranking interns across all activities</p>
      </div>

      <div className="hidden sm:flex justify-center items-end gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
        {desktopOrdered.map(({ item, rank, position }) => {
          if (!item) return null;
          const theme = getCardStyle(rank);
          const orderClass = position === 'left' ? 'order-1' : position === 'center' ? 'order-2 z-10' : 'order-3';

          return (
            <div
              key={item.internId}
              onClick={() => onSelectIntern?.(item)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${item.fullName}, Rank #${rank}`}
              className={`relative w-1/3 max-w-[280px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF8A00] rounded-[20px] ${orderClass}`}
            >
              <div className={theme.cardClass}>
                {renderCardContent(item, rank)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sm:hidden flex flex-col gap-4">
        {mobileOrdered.map(({ item, rank }) => {
          if (!item) return null;
          const theme = getCardStyle(rank);
          return (
            <div
              key={item.internId}
              onClick={() => onSelectIntern?.(item)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${item.fullName}, Rank #${rank}`}
              className={`relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF8A00] rounded-[20px]`}
            >
              <div className={`${theme.cardClass} !h-auto`}>
                {renderCardContent(item, rank)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardFilterBar
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardFilterBar({
  filters,
  filterOptions,
  onSearchChange,
  onCityChange,
  onPSChange,
}: {
  filters: FilterState;
  filterOptions: FilterOptions;
  onSearchChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onPSChange: (v: string) => void;
}) {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
          <input
            id="leaderboard-search"
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, contact or intern ID..."
            className="w-full pl-9 pr-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF8A00] transition-all"
          />
        </div>

        {/* City */}
        <div className="relative sm:w-44">
          <select
            id="leaderboard-city"
            value={filters.city}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FF8A00] pr-8"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
        </div>

        {/* Problem Statement */}
        <div className="relative sm:w-64">
          <select
            id="leaderboard-ps"
            value={filters.problemStatementId}
            onChange={(e) => onPSChange(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FF8A00] pr-8"
          >
            <option value="">All Problem Statements</option>
            {filterOptions.problemStatements.map((ps) => (
              <option key={ps.id} value={ps.id}>{ps.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#737373] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActiveFilterChips
// ─────────────────────────────────────────────────────────────────────────────

export function ActiveFilterChips({
  filters,
  filterOptions,
  onRemoveSearch,
  onRemoveCity,
  onRemovePS,
  onClearAll,
  total,
  grandTotal,
}: {
  filters: FilterState;
  filterOptions: FilterOptions;
  onRemoveSearch: () => void;
  onRemoveCity: () => void;
  onRemovePS: () => void;
  onClearAll: () => void;
  total: number;
  grandTotal: number;
}) {
  const psLabel = filterOptions.problemStatements.find(
    (p) => p.id === filters.problemStatementId
  )?.title;

  const hasFilters = !!filters.search || !!filters.city || !!filters.problemStatementId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Result count */}
      <span className="text-xs text-[#737373] font-semibold mr-1">
        Showing <strong className="text-[#171717]">{total}</strong> of <strong className="text-[#171717]">{grandTotal}</strong> interns
      </span>

      {filters.search && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF4E6] border border-orange-200 text-[#FF8A00] text-[11px] font-bold rounded-full">
          Search: {filters.search}
          <button onClick={onRemoveSearch} className="hover:text-[#FF3D00]"><X className="h-3 w-3" /></button>
        </span>
      )}
      {filters.city && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold rounded-full">
          City: {filters.city}
          <button onClick={onRemoveCity} className="hover:text-blue-900"><X className="h-3 w-3" /></button>
        </span>
      )}
      {psLabel && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-full">
          PS: {psLabel.split('&')[0].trim()}
          <button onClick={onRemovePS} className="hover:text-purple-900"><X className="h-3 w-3" /></button>
        </span>
      )}
      {hasFilters && (
        <button
          onClick={onClearAll}
          className="text-[11px] font-bold text-[#737373] hover:text-red-600 transition-colors underline underline-offset-2"
        >
          Clear All
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column sort header button
// ─────────────────────────────────────────────────────────────────────────────

function SortTh({
  field,
  label,
  sort,
  onSort,
}: {
  field: SortField;
  label: string;
  sort: SortState;
  onSort: (f: SortField) => void;
}) {
  const isActive = sort.field === field;
  return (
    <th
      className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-[#171717] transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive
          ? sort.dir === 'asc'
            ? <ChevronUp className="h-3 w-3 text-[#FF8A00]" />
            : <ChevronDown className="h-3 w-3 text-[#FF8A00]" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardTable — desktop
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardTable({
  rows,
  sort,
  onSort,
  viewerRole,
  onViewDetail,
  showCategoryColumns,
  onClearFilters,
}: {
  rows: LeaderboardRow[];
  sort: SortState;
  onSort: (f: SortField) => void;
  viewerRole: ViewerRole;
  onViewDetail: (row: LeaderboardRow) => void;
  showCategoryColumns: boolean;
  onClearFilters?: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#EDEDED] rounded-2xl p-12 text-center">
        <Trophy className="h-8 w-8 text-[#FF8A00] mx-auto mb-3" />
        <p className="text-sm font-bold text-[#171717] mb-1">No interns match the selected filters.</p>
        <p className="text-xs text-[#737373] mb-4">Try adjusting your search or clearing filters.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-xl hover:opacity-90 transition-opacity"
            >
              Clear Filters
            </button>
          )}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-xs font-bold text-[#737373] bg-[#F5F5F5] border border-[#EDEDED] rounded-xl hover:bg-gray-200 transition-colors"
            >
              Return to All Interns
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#FAFAFA] border-b border-[#EDEDED]">
            <tr>
              <SortTh field="rank"             label="Rank"     sort={sort} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider">Intern</th>
              <SortTh field="city"             label="City"     sort={sort} onSort={onSort} />
              <SortTh field="problemStatement" label="Problem Statement" sort={sort} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider whitespace-nowrap">Contact</th>
              <SortTh field="totalPoints"      label="Points"   sort={sort} onSort={onSort} />
              <SortTh field="overallScore"     label="Score"    sort={sort} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider">Movement</th>
              {showCategoryColumns && SCORE_CATEGORIES.map((sc) => (
                <th key={sc.key as string} className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider whitespace-nowrap">
                  {sc.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-[#737373] uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {rows.map((row) => (
              <tr
                key={row.internId}
                className={`transition-colors ${
                  row.isSelf
                    ? 'bg-orange-50 border-l-2 border-l-[#FF8A00]'
                    : 'hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Rank */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <RankBadge rank={row.rank} />
                </td>

                {/* Intern */}
                <td className="px-3 py-3 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <Avatar name={row.fullName} url={row.profilePhotoUrl} size={32} />
                    <div>
                      <p className="font-bold text-[#171717] leading-tight">
                        {row.fullName}
                        {row.isSelf && <span className="ml-1 text-[9px] font-bold text-[#FF8A00] bg-orange-100 px-1.5 py-0.5 rounded">YOU</span>}
                      </p>
                      <p className="text-[10px] text-[#737373]">{row.internCode}</p>
                    </div>
                  </div>
                </td>

                {/* City */}
                <td className="px-3 py-3 whitespace-nowrap text-[#737373]">{row.city}</td>

                {/* Problem Statement */}
                <td className="px-3 py-3 min-w-[160px]">
                  <span className="block max-w-[180px] truncate text-[#737373]">{row.problemStatement}</span>
                </td>

                {/* Email */}
                <td className="px-3 py-3 text-[#737373] whitespace-nowrap">{row.email}</td>

                {/* Contact */}
                <td className="px-3 py-3 text-[#737373] whitespace-nowrap">{row.mobile}</td>

                {/* Points */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="font-bold text-[#171717]">{row.totalPoints}</span>
                </td>

                {/* Score */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-full"
                        style={{ width: `${row.overallScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#171717]">{row.overallScore}</span>
                  </div>
                </td>

                {/* Movement */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <RankMovementIcon movement={row.rankMovement} delta={row.rankMovementDelta} />
                </td>

                {/* Category columns */}
                {showCategoryColumns && SCORE_CATEGORIES.map((sc) => (
                  <td key={sc.key as string} className="px-3 py-3 whitespace-nowrap text-[#737373]">
                    {row[sc.key] as number}
                  </td>
                ))}

                {/* Details */}
                <td className="px-3 py-3">
                  <button
                    onClick={() => onViewDetail(row)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-[#737373] bg-[#F5F5F5] border border-[#EDEDED] rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardMobileCard — one per intern on mobile
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardMobileCard({
  row,
  onViewDetail,
}: {
  row: LeaderboardRow;
  onViewDetail: (row: LeaderboardRow) => void;
}) {
  return (
    <div
      className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 ${
        row.isSelf ? 'border-[#FF8A00] border-2' : 'border-[#EDEDED]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={row.rank} />
          <Avatar name={row.fullName} url={row.profilePhotoUrl} size={40} />
          <div>
            <p className="text-xs font-bold text-[#171717]">
              {row.fullName}
              {row.isSelf && <span className="ml-1 text-[9px] font-bold text-[#FF8A00] bg-orange-100 px-1.5 py-0.5 rounded">YOU</span>}
            </p>
            <p className="text-[10px] text-[#737373]">{row.internCode}</p>
            <p className="text-[10px] text-[#737373] flex items-center gap-0.5 mt-0.5">
              <MapPin className="h-2.5 w-2.5" />{row.city}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-[#171717]">{row.totalPoints} pts</p>
          <p className="text-[10px] text-[#FF8A00] font-semibold">Score {row.overallScore}/100</p>
          <RankMovementIcon movement={row.rankMovement} delta={row.rankMovementDelta} />
        </div>
      </div>

      <p className="text-[10px] text-[#737373] truncate">{row.problemStatement}</p>

      <button
        onClick={() => onViewDetail(row)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#737373] bg-[#F5F5F5] border border-[#EDEDED] rounded-xl hover:bg-gray-200 transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
        View Details
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardPagination
// ─────────────────────────────────────────────────────────────────────────────

export function LeaderboardPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationState;
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: 25 | 50 | 100) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const canPrev = pagination.page > 1;
  const canNext = pagination.page < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-[#EDEDED] rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-[#737373]">
        <span>Rows per page:</span>
        {([25, 50, 100] as const).map((s) => (
          <button
            key={s}
            onClick={() => onPageSizeChange(s)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
              pagination.pageSize === s
                ? 'bg-[#FF8A00] text-white'
                : 'bg-[#F5F5F5] text-[#737373] hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#737373]">
        <span>
          Page <strong className="text-[#171717]">{pagination.page}</strong> of{' '}
          <strong className="text-[#171717]">{totalPages}</strong> ·{' '}
          <strong className="text-[#171717]">{pagination.total}</strong> interns
        </span>
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!canPrev}
          className="p-1.5 rounded-lg bg-[#F5F5F5] disabled:opacity-40 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!canNext}
          className="p-1.5 rounded-lg bg-[#F5F5F5] disabled:opacity-40 hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// InternDetailsDrawer — role-aware detail panel
// ─────────────────────────────────────────────────────────────────────────────

export function InternDetailsDrawer({
  row,
  viewerRole,
  onClose,
}: {
  row: LeaderboardRow;
  viewerRole: ViewerRole;
  onClose: () => void;
}) {
  // canSeeDetails: authorised to view raw sensitive fields and breakdown
  const canSeeDetails =
    row.isSelf ||
    viewerRole === 'super_admin' ||
    (viewerRole === 'admin' && row.isAssigned);

  // The row fields already have privacy applied by the service layer.
  // row.email / row.mobile are already masked for unauthorised callers.
  // We render them directly — no additional client-side masking needed.
  // This is defence-in-depth: the service already applied applyLeaderboardPrivacy.

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white border-l border-[#EDEDED] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#EDEDED] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={row.fullName} url={row.profilePhotoUrl} size={44} />
            <div>
              <p className="text-sm font-bold text-[#171717]">
                {row.fullName}
                {row.isSelf && (
                  <span className="ml-1.5 text-[9px] font-bold text-[#FF8A00] bg-orange-100 px-1.5 py-0.5 rounded">
                    YOU
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#737373]">{row.internCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#737373] hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Public summary badge when access is restricted */}
          {!canSeeDetails && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F5F5] border border-[#EDEDED] rounded-xl">
              <Eye className="h-3.5 w-3.5 text-[#737373] shrink-0" />
              <span className="text-[11px] font-semibold text-[#737373]">
                Public Summary Only
              </span>
            </div>
          )}

          {/* Rank + Score */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rank', value: `#${row.rank}` },
              { label: 'Points', value: row.totalPoints },
              { label: 'Score', value: `${row.overallScore}/100` },
            ].map((s) => (
              <div key={s.label} className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#737373] font-semibold mb-1">{s.label}</p>
                <p className="text-sm font-black text-[#171717]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Public info */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Info</p>
            {[
              { label: 'City', value: row.city },
              { label: 'Problem Statement', value: row.problemStatement },
              { label: 'Rank Movement', value: <RankMovementIcon movement={row.rankMovement} delta={row.rankMovementDelta} /> },
            ].map((i) => (
              <div key={i.label} className="flex items-center justify-between py-2 border-b border-[#F5F5F5]">
                <span className="text-[11px] text-[#737373]">{i.label}</span>
                <span className="text-[11px] font-semibold text-[#171717]">{i.value}</span>
              </div>
            ))}

            {/* Sensitive fields — row.email / row.mobile are already privacy-masked
                by applyLeaderboardPrivacy() in the service. We render what we receive.
                Authorised viewers get raw values; unauthorised get masked values. */}
            <div className="flex items-center justify-between py-2 border-b border-[#F5F5F5]">
              <span className="text-[11px] text-[#737373]">Email</span>
              <span className="text-[11px] font-semibold text-[#171717] font-mono">{row.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F5F5F5]">
              <span className="text-[11px] text-[#737373]">Contact</span>
              <span className="text-[11px] font-semibold text-[#171717] font-mono">{row.mobile}</span>
            </div>
          </div>

          {/* Points breakdown — authorised viewers only */}
          {canSeeDetails ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Points Breakdown</p>
              <div className="space-y-2">
                {SCORE_CATEGORIES.map((sc) => {
                  const val = row[sc.key] as number;
                  const max = 100;
                  return (
                    <div key={sc.key as string}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#737373]">{sc.label}</span>
                        <span className="text-[11px] font-bold text-[#171717]">{val}</span>
                      </div>
                      <div className="h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] rounded-full"
                          style={{ width: `${Math.min((val / max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-4 text-center">
              <p className="text-[11px] text-[#737373]">
                Detailed points breakdown is only visible to the intern, their assigned admin, and super admins.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
