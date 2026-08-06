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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAttendanceLocations();
      setLocations(data);
    } catch (err) {
      setError('Failed to load attendance locations.');
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
      latitude: '28.6273928',
      longitude: '77.3726112',
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
      location_name: loc.location_name,
      address: loc.address || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
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

    const res = await saveAttendanceLocation(formData);
    setSubmitting(false);

    if (res.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      setFormError(res.message);
    }
  };

  const handleToggleStatus = async (loc) => {
    const res = await toggleLocationStatus(loc.id, loc.status);
    if (res.success) loadData();
  };

  const handleDelete = async (locId) => {
    if (window.confirm('Are you sure you want to delete this attendance location?')) {
      const res = await deleteAttendanceLocation(locId);
      if (res.success) loadData();
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = loc.location_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (loc.address && loc.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-6"><LoadingState message="Loading Attendance Locations..." /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={loadData} /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Top Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF8A00] uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            Super Admin Controls
          </div>
          <h1 className="text-2xl font-bold text-[#171717] mt-1">Attendance Location Management</h1>
          <p className="text-xs text-[#737373] mt-1">Define GPS geofencing zones, set allowed radii, and assign location rules to interns.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Attendance Location
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search location name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#737373]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Locations Table / Cards */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                <th className="p-4">Location & Address</th>
                <th className="p-4">Coordinates (Lat, Lng)</th>
                <th className="p-4">Geofence Radius</th>
                <th className="p-4">Assignment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] text-xs font-medium text-[#171717]">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#737373]">
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
                          <p className="font-bold text-[#171717]">{loc.location_name}</p>
                          <p className="text-[11px] text-[#737373] truncate max-w-xs">{loc.address || 'No specific street address'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#404040]">
                      {loc.latitude}, {loc.longitude}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-lg text-[11px]">
                        {loc.allowed_radius_meters}m Radius
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[11px]">
                        {loc.assignment_type.replace('_', ' ')}
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
                        className="p-1.5 text-[#737373] hover:text-[#FF8A00] hover:bg-[#FAFAFA] rounded-lg transition-colors"
                        title="Edit Location"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className="p-1.5 text-[#737373] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white rounded-2xl border border-[#EDEDED] shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-[#EDEDED] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#FF8A00]" />
                <h2 className="text-base font-bold text-[#171717]">
                  {editingLocation ? 'Edit Attendance Location' : 'Configure New Attendance Location'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#737373] hover:text-[#171717] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#171717]">Location Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Lab Tower B"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#171717]">Assignment Type *</label>
                  <select
                    value={formData.assignment_type}
                    onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#FF8A00] outline-none"
                  >
                    <option value="all">All Interns</option>
                    <option value="problem_statement">By Problem Statement</option>
                    <option value="college">By College</option>
                    <option value="city">By City</option>
                    <option value="selected_interns">Selected Interns Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717]">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 62, Noida, Uttar Pradesh"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none"
                />
              </div>

              {/* Coordinates & Use Current GPS Button */}
              <div className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                    <Navigation className="h-4 w-4 text-[#FF8A00]" />
                    Geofence GPS Coordinates *
                  </span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="px-3 py-1 bg-white border border-[#EDEDED] rounded-lg text-[11px] font-bold text-[#FF8A00] hover:bg-orange-50 transition-colors shadow-xs"
                  >
                    Use Current Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#737373]">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="28.6273928"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg text-xs font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#737373]">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="77.3726112"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-[#EDEDED] rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Allowed Radius & Accuracy Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#171717]">Allowed Radius (Metres) *</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    required
                    value={formData.allowed_radius_meters}
                    onChange={(e) => setFormData({ ...formData, allowed_radius_meters: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#171717]">Max GPS Accuracy (Metres) *</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={formData.maximum_accuracy_meters}
                    onChange={(e) => setFormData({ ...formData, maximum_accuracy_meters: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs focus:ring-2 focus:ring-[#FF8A00] outline-none"
                  />
                </div>
              </div>

              {/* Time Window Config */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#737373]">Check-in Start</label>
                  <input
                    type="time"
                    value={formData.check_in_start_time}
                    onChange={(e) => setFormData({ ...formData, check_in_start_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#737373]">Check-in End</label>
                  <input
                    type="time"
                    value={formData.check_in_end_time}
                    onChange={(e) => setFormData({ ...formData, check_in_end_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#737373]">Check-out Start</label>
                  <input
                    type="time"
                    value={formData.check_out_start_time}
                    onChange={(e) => setFormData({ ...formData, check_out_start_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#737373]">Check-out End</label>
                  <input
                    type="time"
                    value={formData.check_out_end_time}
                    onChange={(e) => setFormData({ ...formData, check_out_end_time: e.target.value })}
                    className="w-full px-2 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#EDEDED] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
