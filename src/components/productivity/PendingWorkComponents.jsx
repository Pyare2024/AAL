import React, { useState } from 'react';

export function PendingWorkCard({ work, onSubmitProof, onViewDetails }) {
  const getStatusBadge = (st) => {
    if (st === 'assigned') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (st === 'submitted') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (st === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (st === 'changes_requested') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200'; // overdue
  };

  return (
    <div className="p-5 bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-4 hover:border-[#D4D4D4] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDEDED] pb-3">
        <div>
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block">
            Assigned By: {work.assigned_by_name || 'Admin Evaluator'}
          </span>
          <h3 className="text-sm font-bold text-[#171717] mt-0.5">{work.title}</h3>
        </div>
        <span className={`px-2.5 py-1 text-[11px] font-bold border rounded-full uppercase self-start sm:self-auto ${getStatusBadge(work.status)}`}>
          {work.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-xs text-[#737373] leading-relaxed">{work.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1">
        <div className="space-x-3 text-[#737373]">
          <span>Assigned: <strong className="text-[#171717]">{work.assigned_date}</strong></span>
          <span>Due: <strong className="text-red-600">{work.due_date}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button onClick={() => onViewDetails(work)} className="px-3 py-1.5 bg-[#FAFAFA] border border-[#EDEDED] hover:bg-[#E5E5E5] text-[#171717] font-bold text-xs rounded-xl">
              View Details
            </button>
          )}
          {(work.status === 'assigned' || work.status === 'changes_requested' || work.status === 'overdue') && (
            <button onClick={() => onSubmitProof(work)} className="px-4 py-1.5 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm">
              Submit Work Proof
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkSubmissionForm({ work, onSubmit, onCancel }) {
  const [description, setDescription] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Submission description is required.');
      return;
    }
    if (!submissionLink.trim() && !githubLink.trim()) {
      setError('Please provide at least one public submission link or GitHub URL.');
      return;
    }

    onSubmit({
      pending_work_id: work.id,
      description,
      submission_link: submissionLink,
      github_link: githubLink,
      submitted_at: new Date().toISOString(),
      version_number: 1,
      status: 'submitted'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white border border-[#EDEDED] rounded-2xl shadow-sm space-y-4">
      <div className="border-b border-[#EDEDED] pb-3">
        <span className="text-[10px] font-bold text-[#737373] uppercase block">Submit Formal Work</span>
        <h3 className="text-sm font-bold text-[#171717]">{work.title}</h3>
      </div>

      {error && <p className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold">{error}</p>}

      <div className="space-y-3 text-xs">
        <div>
          <label className="font-bold text-[#171717] block mb-1">Submission Notes & Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your solution, architectural decisions, and key features implemented..."
            className="w-full p-3 bg-white border border-[#EDEDED] rounded-xl focus:border-[#FF8A00] focus:outline-none"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-[#171717] block mb-1">GitHub Repo / PR Link</label>
            <input
              type="url"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full p-2.5 bg-white border border-[#EDEDED] rounded-xl focus:border-[#FF8A00] focus:outline-none"
            />
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1">Live Demo / Drive Link</label>
            <input
              type="url"
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full p-2.5 bg-white border border-[#EDEDED] rounded-xl focus:border-[#FF8A00] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEDED]">
        <button type="button" onClick={onCancel} className="px-4 py-2 font-bold text-xs text-[#737373]">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl shadow-sm">
          Submit Work For Review
        </button>
      </div>
    </form>
  );
}
