import React, { useState, useEffect } from 'react';
import { fetchAttendanceLogsForAdmin } from '../../services/attendanceLocationService';
import { 
  Calendar, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export function AdminAttendanceReviewPage() {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAdminAttendance = async () => {
    setLoading(true);
    try {
      const data = await fetchAttendanceLogsForAdmin([], {
        search: searchTerm,
        status: statusFilter
      });

      const formatted = data.map(item => ({
        id: item.id,
        internName: item.profiles?.full_name || 'Intern User',
        email: item.profiles?.email || 'intern@asg.com',
        problemStatement: item.problem_statements?.title || 'Allocated Problem Statement',
        date: item.date || (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        checkInTime: item.check_in_time || '09:00 AM',
        checkOutTime: item.check_out_time || 'In Progress',
        distanceMeters: item.distance_meters || 0,
        status: item.status || 'Present',
        locationName: item.attendance_locations?.location_name || 'Campus Headquarters'
      }));
      setAttendanceRecords(formatted);
    } catch (err) {
      console.warn('[AdminAttendance] Error loading logs:', err);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminAttendance();
  }, [statusFilter]);

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPresent = attendanceRecords.filter(r => r.status === 'Present').length;
  const totalLate = attendanceRecords.filter(r => r.status === 'Late').length;
  const totalViolated = attendanceRecords.filter(r => r.status === 'Geofence_Violated').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF8A00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF8A00] mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin Review Scope</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Attendance Review</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Monitor real-time GPS check-in & check-out logs for interns in your allocated Problem Statement.
          </p>
        </div>
        <button
          onClick={loadAdminAttendance}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] text-[#0D0D0D] hover:bg-[#EDEDED] rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Present Today</p>
            <p className="text-2xl font-extrabold text-[#0D0D0D]">{totalPresent}</p>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Late Check-ins</p>
            <p className="text-2xl font-extrabold text-[#0D0D0D]">{totalLate}</p>
          </div>
        </div>

        <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Geofence Warnings</p>
            <p className="text-2xl font-extrabold text-[#0D0D0D]">{totalViolated}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search intern name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#9A9A9A]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Geofence_Violated">Geofence Violated</option>
          </select>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDEDED] flex justify-between items-center bg-[#FAFAFA]">
          <h2 className="text-sm font-bold text-[#0D0D0D] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#FF8A00]" />
            <span>Assigned Intern Attendance Logs</span>
          </h2>
          <span className="text-xs font-semibold text-[#9A9A9A]">
            Showing {filteredRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F7] text-[#9A9A9A] uppercase tracking-wider font-bold border-b border-[#EDEDED]">
              <tr>
                <th className="px-6 py-3">Intern</th>
                <th className="px-6 py-3">Problem Statement</th>
                <th className="px-6 py-3">Date & Times</th>
                <th className="px-6 py-3">GPS Location</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] text-[#0D0D0D]">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-[#F9F9F9] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#0D0D0D]">{item.internName}</div>
                    <div className="text-[11px] text-[#9A9A9A]">{item.email}</div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg font-medium text-[#0D0D0D]">
                      {item.problemStatement}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold">{item.date}</div>
                    <div className="text-[11px] text-[#9A9A9A]">
                      In: <span className="font-semibold text-emerald-600">{item.checkInTime}</span> | Out: <span className="font-semibold text-[#0D0D0D]">{item.checkOutTime}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-semibold text-[#0D0D0D]">
                      <MapPin className="h-3.5 w-3.5 text-[#FF8A00]" />
                      <span>{item.locationName}</span>
                    </div>
                    <div className="text-[10px] text-[#9A9A9A] mt-0.5">
                      Distance: <span className="font-bold">{item.distanceMeters}m</span> from center
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {item.status === 'Present' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Present
                      </span>
                    )}

                    {item.status === 'Late' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                        <Clock className="h-3 w-3" />
                        Late
                      </span>
                    )}

                    {item.status === 'Geofence_Violated' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        Outside Fence
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#9A9A9A] text-xs">
                    No attendance records found for your allocated interns.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
