import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { 
  fetchAssignedInternLocation, 
  performCheckInWithLocation, 
  performCheckOutWithLocation 
} from '../../services/attendanceLocationService';
import { calculateGpsDistanceMeters } from '../../utils/attendanceUtils';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Info, 
  RefreshCw,
  XCircle,
  Briefcase
} from 'lucide-react';
import { LoadingState } from '../../components/productivity/CommonStates';

export function AttendancePage() {
  const { user } = useAuth();
  const [locationConfig, setLocationConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | requesting | success | denied | unavailable | low_accuracy | outside_radius
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);

  // Attendance Record state
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // History state
  const [history, setHistory] = useState([]);

  // Load Assigned Geofence Location
  useEffect(() => {
    async function loadAssignedLocation() {
      setLoadingConfig(true);
      const loc = await fetchAssignedInternLocation(user?.id);
      setLocationConfig(loc);
      setLoadingConfig(false);
    }
    loadAssignedLocation();
  }, [user?.id]);

  // Handle Requesting Geolocation Permission & Distance Verification
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setFeedback({ type: 'error', message: 'We could not detect your current location. Turn on GPS and try again.' });
      return;
    }

    setGpsStatus('requesting');
    setFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentCoords({ latitude, longitude });
        setGpsAccuracy(accuracy);

        if (!locationConfig) {
          setGpsStatus('unavailable');
          setFeedback({ type: 'error', message: 'No attendance location has been assigned to you. Contact the Super Admin.' });
          return;
        }

        // Calculate Haversine Distance from center point
        const dist = calculateGpsDistanceMeters(
          locationConfig.latitude,
          locationConfig.longitude,
          latitude,
          longitude
        );
        const roundedDist = Math.round(dist);
        setDistanceMeters(roundedDist);

        const allowedRadius = Number(locationConfig.allowed_radius_meters) || 100000;

        if (roundedDist <= allowedRadius) {
          setGpsStatus('success');
          setFeedback({ type: 'success', message: 'You are inside the verified attendance area!' });
        } else {
          setGpsStatus('outside_radius');
          setFeedback({
            type: 'warning',
            message: `You are outside the assigned attendance area. You must move ${roundedDist - allowedRadius} metres closer.`
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setFeedback({ type: 'error', message: 'Location permission is required to mark attendance. Enable location access in your browser settings.' });
        } else {
          setGpsStatus('unavailable');
          setFeedback({ type: 'error', message: 'Could not fetch current GPS location. Ensure location services are enabled.' });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCheckIn = async () => {
    if (!currentCoords || !locationConfig) return;
    setSubmittingAction(true);
    setFeedback(null);

    try {
      const res = await performCheckInWithLocation({
        locationId: locationConfig.id,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        accuracy: gpsAccuracy,
        distanceMeters: distanceMeters
      });

      if (res?.success) {
        const rec = res.data || {
          id: `att-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          check_out_time: 'In Progress',
          status: 'Present',
          distance_meters: distanceMeters
        };
        setAttendanceRecord(rec);
        
        const historyItem = {
          id: rec.id,
          attendance_date: rec.date || rec.attendance_date || new Date().toISOString().split('T')[0],
          check_in_time: rec.check_in_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          check_out_time: rec.check_out_time || 'In Progress',
          status: 'Present',
          remarks: `GPS Verified (${distanceMeters}m)`
        };
        setHistory(prev => [historyItem, ...prev]);
        setFeedback({ type: 'success', message: 'Successfully checked in!' });
      } else {
        setFeedback({ type: 'error', message: res?.message || 'Check-in failed.' });
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setFeedback({ type: 'error', message: err.message || 'Check-in failed.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentCoords || !attendanceRecord) return;
    setSubmittingAction(true);

    try {
      const res = await performCheckOutWithLocation({
        attendanceId: attendanceRecord.id,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        accuracy: gpsAccuracy
      });

      const updatedRecord = {
        ...attendanceRecord,
        check_out_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Present'
      };

      setAttendanceRecord(updatedRecord);
      setHistory(prev => prev.map(h => h.id === attendanceRecord.id ? {
        ...h,
        check_out_time: updatedRecord.check_out_time
      } : h));
      setFeedback({ type: 'success', message: 'Checked out successfully!' });
    } catch (err) {
      console.error('Check-out error:', err);
      setFeedback({ type: 'error', message: err.message || 'Check-out failed.' });
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loadingConfig) return <LoadingState message="Loading assigned attendance location..." />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#FF8A00]/10 to-[#FF3D00]/10 border border-[#FF8A00]/20 rounded-full text-xs font-bold text-[#FF3D00] mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Productivity Module</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">GPS Geofence Attendance</h1>
          <p className="text-sm text-[#9A9A9A] mt-0.5">
            Super Admin-controlled geofencing guarantees secure daily verification.
          </p>
        </div>

        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Geofence Active</span>
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          feedback.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#9A9A9A] hover:text-[#0D0D0D]">✕</button>
        </div>
      )}

      {/* Main Location Card */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-start border-b border-[#EDEDED] pb-4">
          <div>
            <p className="text-xs font-semibold text-[#9A9A9A] uppercase tracking-wider">Assigned Attendance Location</p>
            <h2 className="text-xl font-extrabold text-[#0D0D0D] mt-1 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF8A00]" />
              <span>{locationConfig?.location_name || 'Ramanand Nagar Campus'}</span>
            </h2>
            <p className="text-xs text-[#9A9A9A] mt-1">{locationConfig?.address || 'Ramanand Nagar Rd, Jalgaon'}</p>
          </div>

          <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-1">
            <Navigation className="h-3.5 w-3.5" />
            Allowed Radius: {locationConfig?.allowed_radius_meters || 100000} Metres
          </span>
        </div>

        {/* GPS Verification Box */}
        <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white border border-[#EDEDED] rounded-xl">
              <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase">GPS Status</p>
              <p className="text-xs font-bold text-[#0D0D0D] mt-1 capitalize">{gpsStatus.replace('_', ' ')}</p>
            </div>
            <div className="p-3 bg-white border border-[#EDEDED] rounded-xl">
              <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase">Distance From Location</p>
              <p className="text-xs font-bold text-[#FF8A00] mt-1">
                {distanceMeters !== null ? `${distanceMeters} metres` : '—'}
              </p>
            </div>
            <div className="p-3 bg-white border border-[#EDEDED] rounded-xl">
              <p className="text-[11px] font-semibold text-[#9A9A9A] uppercase">GPS Accuracy</p>
              <p className="text-xs font-bold text-[#0D0D0D] mt-1">
                {gpsAccuracy !== null ? `±${Math.round(gpsAccuracy)} metres` : '—'}
              </p>
            </div>
          </div>

          {/* Location Request Action */}
          {gpsStatus === 'idle' || gpsStatus === 'low_accuracy' || gpsStatus === 'outside_radius' || gpsStatus === 'denied' || gpsStatus === 'unavailable' ? (
            <button
              onClick={requestLocation}
              className="w-full py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF3D00]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              <span>{gpsStatus === 'requesting' ? 'Detecting GPS Coordinates...' : 'Detect GPS Location & Verify Geofence'}</span>
            </button>
          ) : null}

          {/* Check-in / Check-out Buttons */}
          {gpsStatus === 'success' && (
            <div className="flex gap-4 pt-2">
              {!attendanceRecord ? (
                <button
                  onClick={handleCheckIn}
                  disabled={submittingAction}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{submittingAction ? 'Recording Check-in...' : 'Check In Now'}</span>
                </button>
              ) : (
                <button
                  onClick={handleCheckOut}
                  disabled={submittingAction || attendanceRecord.check_out_time !== 'In Progress'}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Clock className="h-4 w-4" />
                  <span>{attendanceRecord.check_out_time !== 'In Progress' ? 'Checked Out Today' : submittingAction ? 'Recording Check-out...' : 'Check Out Now'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Log */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDEDED] bg-[#FAFAFA]">
          <h3 className="font-bold text-sm text-[#0D0D0D]">Attendance Log & Verification History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F7] text-[#9A9A9A] uppercase tracking-wider font-bold border-b border-[#EDEDED]">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Verification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] text-[#0D0D0D]">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-[#F9F9F9] transition-colors">
                  <td className="px-6 py-4 font-bold">{row.attendance_date}</td>
                  <td className="px-6 py-4 text-emerald-700 font-semibold">{row.check_in_time}</td>
                  <td className="px-6 py-4 font-semibold">{row.check_out_time}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] text-[#9A9A9A]">{row.remarks}</td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#9A9A9A] text-xs">
                    No attendance records marked yet today.
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
