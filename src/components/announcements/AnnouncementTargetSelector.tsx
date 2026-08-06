import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { AnnouncementFilterOptions } from '../../types/announcementTypes';
import { X } from 'lucide-react';

export interface TargetSelection {
  target_type: string;
  target_reference_id: string | null;
}

interface Props {
  targets: TargetSelection[];
  onChange: (targets: TargetSelection[]) => void;
  options: AnnouncementFilterOptions | null;
  disabled?: boolean;
}

export const AnnouncementTargetSelector: React.FC<Props> = ({ targets, onChange, options, disabled }) => {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  const handleAddTarget = (type: string, id: string | null) => {
    if (!targets.find(t => t.target_type === type && t.target_reference_id === id)) {
      onChange([...targets, { target_type: type, target_reference_id: id }]);
    }
  };

  const handleRemoveTarget = (index: number) => {
    const newTargets = [...targets];
    newTargets.splice(index, 1);
    onChange(newTargets);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getTargetName = (t: TargetSelection) => {
    if (t.target_type === 'all_interns') return 'All Interns';
    
    if (t.target_type === 'problem_statement') {
      const ps = options?.problemStatements?.find(p => p.id === t.target_reference_id);
      return `Problem Statement: ${ps?.title || t.target_reference_id}`;
    }
    
    return `${t.target_type}: ${t.target_reference_id}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-[#171717]">Target Audience</label>
          {targets.length > 0 && !disabled && (
            <button 
              type="button" 
              onClick={handleClearAll}
              className="text-xs font-bold text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        
        {/* Active Targets */}
        <div className="flex flex-wrap gap-2 mb-2 p-3 bg-[#F7F7F7] border border-[#EDEDED] rounded-xl min-h-[50px]">
          {targets.map((t, index) => (
            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8A00]/10 text-[#FF8A00] rounded-lg text-sm font-bold border border-[#FF8A00]/20">
              <span>{getTargetName(t)}</span>
              {!disabled && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveTarget(index)}
                  className="hover:text-[#FF3D00]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {targets.length === 0 && (
            <div className="text-sm text-[#737373] italic self-center">No targets selected (Announcement will remain invisible)</div>
          )}
        </div>

        {/* Target Selection Controls */}
        {!disabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {isSuperAdmin && (
              <button 
                type="button" 
                onClick={() => handleAddTarget('all_interns', null)}
                className="w-full px-3 py-2 bg-white hover:bg-[#F5F5F5] text-[#171717] rounded-lg text-sm font-bold transition-colors border border-[#EDEDED] text-left"
              >
                + All Interns
              </button>
            )}

            {options?.problemStatements && options.problemStatements.length > 0 && (
              <select
                className="w-full text-sm border border-[#EDEDED] rounded-lg bg-white px-3 py-2 focus:ring-2 focus:ring-[#FF8A00] outline-none"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddTarget('problem_statement', e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>+ Problem Statement</option>
                {options.problemStatements.map(ps => (
                  <option key={ps.id} value={ps.id}>{ps.title}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
