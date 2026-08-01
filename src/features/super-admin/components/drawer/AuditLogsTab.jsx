import React from 'react';
import { History, RefreshCw } from 'lucide-react';

export function AuditLogsTab({ auditLogs, loadingAudit }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-[#0D0D0D] uppercase tracking-wider">
        Super Admin Audit Trail History
      </h3>

      {loadingAudit ? (
        <div className="p-8 text-center text-xs text-[#9A9A9A] flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-[#FF3D00]" />
          <span>Loading audit history...</span>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="p-8 text-center bg-[#F7F7F7] border border-[#EDEDED] rounded-xl text-xs text-[#9A9A9A]">
          No audit logs recorded for this intern yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-white border border-[#EDEDED] rounded-xl text-xs space-y-1 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#FF3D00] uppercase tracking-wider text-[11px]">{log.action}</span>
                <span className="text-[10px] text-[#9A9A9A]">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#0D0D0D]">Actor ID: <span className="font-mono text-[#9A9A9A]">{log.actor_id || 'System'}</span></p>
              {log.new_data && (
                <pre className="p-2 bg-[#F7F7F7] border border-[#EDEDED] rounded-lg text-[10px] text-[#0D0D0D] font-mono overflow-x-auto">
                  {JSON.stringify(log.new_data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
