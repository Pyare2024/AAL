import React from 'react';

interface Props {
  role: string;
  onNewClick?: () => void;
}

export const AnnouncementHeader: React.FC<Props> = ({ role, onNewClick }) => {
  return (
    <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Announcements</h1>
        <p className="text-xs text-[#737373] mt-1">
          Stay updated with important internship notices, events, deadlines, and official communication.
        </p>
      </div>
      {role !== 'intern' && (
        <button 
          onClick={onNewClick}
          className="px-4 py-2 bg-gradient-to-r from-[#FF8A00] to-[#FF3D00] text-white font-bold text-sm rounded-xl shadow-md hover:opacity-90"
        >
          Create Announcement
        </button>
      )}
    </div>
  );
};
