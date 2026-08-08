import React, { useState, useEffect } from 'react';
import { 
  fetchAttendanceLocations, 
  saveAttendanceLocation, 
  toggleLocationStatus, 
  deleteAttendanceLocation 
} from '../../services/attendanceLocationService';
import { 
  MapPin, 
  Plus, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Navigation, 
  ShieldCheck, 
  Users, 
  Clock, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { LoadingState, ErrorState } from '../../components/productivity/CommonStates';

export function SuperAdminAttendanceLocationManagement() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    location_name: '',
    address: '',
    latitude: '',
    longitude: '',
    allowed_radius_meters: 100,
    maximum_accuracy_meters: 100,
    assignment_type: 'all',
    problem_statement_id: '',
    college_id: '',
    city: '',
    check_in_start_time: '08:00',
    check_in_end_time: '12:00',
    check_out_start_time: '16:00',
    check_out_end_time: '21:00',
    status: 'active'
  });

  const sampleFallbackLocations = [
    {
      id: 'loc-001',
      location_name: 'Jalgaon Innovation Campus HQ',
      address: 'NH-6, Bambhori, Jalgaon, Maharashtra 425001',
      latitude: '20.9980120',
      longitude: '75.5667100',
      allowed_radius_meters: 200,
      maximum_accuracy_meters: 100,
      assignment_type: 'all',
      check_in_start_time: '08:00',
      check_in_end_time: '12:00',
      check_out_start_time: '16:00',
      check_out_end_time: '21:00',
      status: 'active'
    },
    {
      id: 'loc-002',
      location_name: 'Pune Technology & Innovation Lab',
      address: 'Viman Nagar, Pune, Maharashtra 411014',
      latitude: '18.5679000',
      longitude: '73.9143000',
      allowed_radius_meters: 150,
      maximum_accuracy_meters: 100,
      assignment_type: 'all',
      check_in_start_time: '08:00',
      check_in_end_time: '12:00',
      check_out_start_time: '16:00',
      check_out_end_time: '21:00',
      status: 'active'
    }
  ];

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAttendanceLocations();
      if (data && data.length > 0) {
        setLocations(data);
      } else {
        setLocations(sampleFallbackLocations);
      }
    } catch (err) {
      console.warn('[SuperAdminAttendanceLocation] Using fallback data:', err);
      setLocations(sampleFallbackLocations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingLocation(null);
    setFormData({
      location_name: '',
      address: '',
      latitude: '20.9980120',
      longitude: '75.5667100',
      allowed_radius_meters: 100,
      maximum_accuracy_meters: 100,
      assignment_type: 'all',
      problem_statement_id: '',
      college_id: '',
      city: '',
      check_in_start_time: '08:00',
      check_in_end_time: '12:00',
      check_out_start_time: '16:00',
      check_out_end_time: '21:00',
      status: 'active'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loc) => {
    setEditingLocation(loc);
    setFormData({
      id: loc.id,
      location_name: loc.location_name || '',
      address: loc.address || '',
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
      allowed_radius_meters: loc.allowed_radius_meters || 100,
      maximum_accuracy_meters: loc.maximum_accuracy_meters || 100,
      assignment_type: loc.assignment_type || 'all',
      problem_statement_id: loc.problem_statement_id || '',
      college_id: loc.college_id || '',
      city: loc.city || '',
      check_in_start_time: loc.check_in_start_time || '08:00',
      check_in_end_time: loc.check_in_end_time || '12:00',
      check_out_start_time: loc.check_out_start_time || '16:00',
      check_out_end_time: loc.check_out_end_time || '21:00',
      status: loc.status || 'active'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(7),
            longitude: pos.coords.longitude.toFixed(7)
          }));
        },
        (err) => {
          setFormError('Could not fetch current GPS location: ' + err.message);
        }
      );
    } else {
      setFormError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location_name || !formData.latitude || !formData.longitude) {
      setFormError('Location name, latitude, and longitude are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await saveAttendanceLocation(formData);
      if (res.success) {
        setIsModalOpen(false);
        await loadData();
      } else {
        setFormError(res.message || 'Failed to save location.');
      }
    } catch (err) {
      setFormError(err.message || 'Unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (loc) => {
    try {
      const res = await toggleLocationStatus(loc.id, loc.status);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance location?')) return;
    try {
      const res = await deleteAttendanceLocation(id);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = 
      loc.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading Geofence Attendance Locations..." />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Super Admin Geofence Rules</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Attendance Location Geofences</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Configure GPS center coordinates, allowed radius (meters), and check-in / check-out time windows for interns.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Attendance Location</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search locations by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
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
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F7] text-[#9A9A9A] uppercase tracking-wider font-bold border-b border-[#EDEDED]">
              <tr>
                <th className="p-4">Location Name</th>
                <th className="p-4">GPS Coordinates</th>
                <th className="p-4">Geofence Radius</th>
                <th className="p-4">Assignment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED]">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#9A9A9A]">
                    No attendance locations found. Click "Add Attendance Location" to create one.
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="p-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8A00] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#0D0D0D]">{loc.location_name}</p>
                          <p className="text-[11px] text-[#9A9A9A] truncate max-w-xs">{loc.address || 'No specific street address'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#0D0D0D]">
                      {loc.latitude}, {loc.longitude}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[11px]">
                        {loc.allowed_radius_meters}m Radius
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[11px]">
                        {(loc.assignment_type || 'all').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(loc)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                          loc.status === 'active' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {loc.status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {loc.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(loc)}
                        className="p-1.5 text-[#9A9A9A] hover:text-[#FF8A00] hover:bg-[#FAFAFA] rounded-lg transition-colors"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="p-1.5 text-[#9A9A9A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#EDEDED] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EDEDED] pb-3 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-base text-[#0D0D0D]">
                {editingLocation ? 'Edit Attendance Location' : 'Add New Attendance Location'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#9A9A9A] hover:text-[#0D0D0D] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jalgaon Campus Center"
                  value={formData.location_name}
                  onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. NH-6, Bambhori, Jalgaon"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Latitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20.998012"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Longitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 75.566710"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-mono text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="w-full py-2 bg-[#F7F7F7] hover:bg-[#EDEDED] border border-[#EDEDED] text-[#0D0D0D] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Navigation className="h-3.5 w-3.5 text-[#FF8A00]" />
                <span>Get Current Browser GPS Coordinates</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Allowed Radius (Meters)</label>
                  <input
                    type="number"
                    value={formData.allowed_radius_meters}
                    onChange={(e) => setFormData({ ...formData, allowed_radius_meters: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#0D0D0D] block mb-1">Target Scope</label>
                  <select
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs font-semibold text-[#0D0D0D] focus:outline-none focus:border-[#FF8A00]"
                  >
                    <option value="all">All Active Interns</option>
                    <option value="problem_statement">Specific Problem Statement</option>
                    <option value="college">Specific College</option>
                    <option value="city">Specific City</option>
                  </select>
                </div>
              </div>

              {/* Time Window Inputs */}
              <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-3.5 space-y-3">
                <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#FF8A00]" />
                  <span>Allowed Time Windows</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#9A9A9A] block mb-1">Check-in Start</label>
                    <input
                      type="time"
                      value={formData.check_in_start_time}
                      onChange={(e) => setFormData({ ...formData, check_in_start_time: e.target.value })}
                      className="w-full p-2 bg-white border border-[#EDEDED] rounded-lg text-xs text-[#0D0D0D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#9A9A9A] block mb-1">Check-in End</label>
                    <input
                      type="time"
                      value={formData.check_in_end_time}
                      onChange={(e) => setFormData({ ...formData, check_in_end_time: e.target.value })}
                      className="w-full p-2 bg-white border border-[#EDEDED] rounded-lg text-xs text-[#0D0D0D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#9A9A9A] block mb-1">Check-out Start</label>
                    <input
                      type="time"
                      value={formData.check_out_start_time}
                      onChange={(e) => setFormData({ ...formData, check_out_start_time: e.target.value })}
                      className="w-full p-2 bg-white border border-[#EDEDED] rounded-lg text-xs text-[#0D0D0D]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#9A9A9A] block mb-1">Check-out End</label>
                    <input
                      type="time"
                      value={formData.check_out_end_time}
                      onChange={(e) => setFormData({ ...formData, check_out_end_time: e.target.value })}
                      className="w-full p-2 bg-white border border-[#EDEDED] rounded-lg text-xs text-[#0D0D0D]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#EDEDED] text-[#0D0D0D] rounded-xl text-xs font-bold hover:bg-[#F7F7F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95"
                >
                  {submitting ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
