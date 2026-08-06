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
  const [history, setHistory] = useState([
    { id: 'att-1', attendance_date: '2026-08-01', check_in_time: '09:02 AM', check_out_time: '05:30 PM', working_minutes: 508, status: 'present', remarks: 'GPS Verified (42m)' },
    { id: 'att-2', attendance_date: '2026-08-02', check_in_time: '09:18 AM', check_out_time: '05:45 PM', working_minutes: 507, status: 'late', remarks: 'GPS Verified (88m)' }
  ]);

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

        // Validate Accuracy
        if (accuracy > (locationConfig.maximum_accuracy_meters || 100)) {
          setGpsStatus('low_accuracy');
          setFeedback({ type: 'error', message: 'Your location accuracy is too low. Move to an open area and try again.' });
          return;
        }

        // Calculate Haversine Distance
        const dist = calculateGpsDistanceMeters(
          locationConfig.latitude,
          locationConfig.longitude,
          latitude,
          longitude
        );
        const roundedDist = Math.round(dist);
        setDistanceMeters(roundedDist);

        if (roundedDist <= locationConfig.allowed_radius_meters) {
          setGpsStatus('success');
          setFeedback({ type: 'success', message: 'You are inside the attendance area.' });
        } else {
          setGpsStatus('outside_radius');
          setFeedback({
            type: 'warning',
            message: `You are outside the assigned attendance area. You must move ${roundedDist - locationConfig.allowed_radius_meters} metres closer.`
          });
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
          setFeedback({ type: 'error', message: 'Location permission is required to mark attendance. Enable location access in your browser settings.' });
        } else {
          setGpsStatus('unavailable');
          setFeedback({ type: 'error', message: 'We could not detect your current location. Turn on GPS and try again.' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Check-In Handler
  const handleCheckIn = async () => {
    if (!currentCoords || !locationConfig) return;
    setSubmittingAction(true);
    setFeedback(null);

    const res = await performCheckInWithLocation({
      locationId: locationConfig.id,
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      accuracy: gpsAccuracy
    });

    setSubmittingAction(false);

    if (res.success) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAttendanceRecord({
        id: res.attendance_id || 'att-today',
        checkIn: nowTime,
        checkOut: null,
        status: 'present'
      });
      setFeedback({ type: 'success', message: res.message || 'Check-in recorded successfully with GPS evidence!' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  // Check-Out Handler
  const handleCheckOut = async () => {
    if (!currentCoords || !attendanceRecord) return;
    setSubmittingAction(true);
    setFeedback(null);

    const res = await performCheckOutWithLocation({
      attendanceId: attendanceRecord.id,
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      accuracy: gpsAccuracy
    });

    setSubmittingAction(false);

    if (res.success) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAttendanceRecord((prev) => ({
        ...prev,
        checkOut: nowTime,
        workingMinutes: res.working_minutes || 480
      }));
      setFeedback({ type: 'success', message: res.message || 'Check-out completed successfully!' });
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  if (loadingConfig) return <div className="p-6"><LoadingState message="Fetching assigned attendance location..." /></div>;

  const allowedRadius = locationConfig?.allowed_radius_meters || 100;
  const isInside = gpsStatus === 'success';
  const hasCheckedIn = !!attendanceRecord?.checkIn;
  const hasCheckedOut = !!attendanceRecord?.checkOut;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Productivity Module</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">GPS Geofence Attendance</h1>
          <p className="text-xs text-[#737373] mt-1">Super Admin-controlled geofencing guarantees secure daily verification.</p>
        </div>
        <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-[#FF8A00] rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>Geofence Active</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm">{feedback.message}</p>
            {distanceMeters !== null && (
              <p className="text-[11px] mt-1 font-normal opacity-90">
                Current Distance: <strong>{distanceMeters}m</strong> | Allowed Geofence Radius: <strong>{allowedRadius}m</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Primary Action Card (Mobile & Desktop First Class) */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#EDEDED]">
          <div>
            <span className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">Assigned Attendance Location</span>
            <h2 className="text-lg font-bold text-[#171717] mt-0.5">{locationConfig?.location_name}</h2>
            <p className="text-xs text-[#737373] flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 text-[#FF8A00]" />
              {locationConfig?.address || 'Configured Geofence Zone'}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl text-xs font-bold text-[#171717] flex items-center gap-2">
            <Navigation className="h-4 w-4 text-[#FF8A00]" />
            <span>Allowed Radius: {allowedRadius} Metres</span>
          </div>
        </div>

        {/* Live Distance & GPS Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl p-4">
          <div>
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">GPS Status</span>
            <p className="text-xs font-bold text-[#171717] capitalize mt-0.5 flex items-center gap-1.5">
              {gpsStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {gpsStatus === 'outside_radius' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
              {gpsStatus === 'requesting' && <RefreshCw className="h-4 w-4 text-[#FF8A00] animate-spin" />}
              {gpsStatus === 'idle' ? 'Location Not Checked' : gpsStatus.replace('_', ' ')}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">Distance from Location</span>
            <p className="text-xs font-bold text-[#171717] mt-0.5">
              {distanceMeters !== null ? `${distanceMeters} metres` : '—'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">GPS Accuracy</span>
            <p className="text-xs font-bold text-[#171717] mt-0.5">
              {gpsAccuracy !== null ? `±${Math.round(gpsAccuracy)} metres` : '—'}
            </p>
          </div>
        </div>

        {/* Main Dynamic Action Button */}
        <div className="space-y-3 pt-2">
          {gpsStatus === 'idle' || gpsStatus === 'denied' || gpsStatus === 'unavailable' ? (
            <button
              onClick={requestLocation}
              disabled={gpsStatus === 'requesting'}
              className="w-full min-h-[48px] py-3 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="h-5 w-5" />
              <span>Enable Location Access</span>
            </button>
          ) : gpsStatus === 'requesting' ? (
            <button
              disabled
              className="w-full min-h-[48px] py-3 bg-gray-100 border border-gray-200 text-gray-500 font-bold text-sm rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5 animate-spin text-[#FF8A00]" />
              <span>Checking your location...</span>
            </button>
          ) : !hasCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={!isInside || submittingAction}
              className={`w-full min-h-[48px] py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                isInside && !submittingAction
                  ? 'bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white hover:opacity-95 cursor-pointer'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{submittingAction ? 'Verifying Check-in...' : 'Check In'}</span>
            </button>
          ) : !hasCheckedOut ? (
            <button
              onClick={handleCheckOut}
              disabled={!isInside || submittingAction}
              className={`w-full min-h-[48px] py-3 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                isInside && !submittingAction
                  ? 'bg-[#171717] text-white hover:bg-black cursor-pointer'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>{submittingAction ? 'Verifying Check-out...' : 'Check Out'}</span>
            </button>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Attendance Completed Today! Total Duration: 8h 0m</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#737373] justify-center pt-1">
            <Info className="h-3.5 w-3.5 text-[#FF8A00]" />
            <span>Your location is captured only when you check in or check out. AI Apex does not continuously track your location.</span>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#171717]">Attendance Log & Verification History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EDEDED] text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Check In</th>
                <th className="p-3">Check Out</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verification Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDEDED] text-xs font-medium text-[#171717]">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="p-3 font-bold">{rec.attendance_date}</td>
                  <td className="p-3">{rec.check_in_time}</td>
                  <td className="p-3">{rec.check_out_time}</td>
                  <td className="p-3 font-mono">{Math.floor(rec.working_minutes / 60)}h {rec.working_minutes % 60}m</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[11px]">
                      Present
                    </span>
                  </td>
                  <td className="p-3 text-[#737373] text-[11px]">{rec.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
