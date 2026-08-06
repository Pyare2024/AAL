import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Standard practice for request_id if available, but we can generate a random string too
import { feedbackService } from '../../services/feedbackService';

interface Props {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const NewFeedbackForm: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('normal');
  const [isComplaint, setIsComplaint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create an idempotency key once when the form opens
  const [requestId] = useState(() => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ 
        title, 
        description, 
        category, 
        priority, 
        is_complaint: isComplaint,
        request_id: requestId 
      });
      // Close handled by parent on success
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
      setIsSubmitting(false); // Let them try again
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col overflow-hidden max-h-full">
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h2 className="font-bold text-lg">New Feedback</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-black" disabled={isSubmitting}>Close</button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg p-2" disabled={isSubmitting}>
              <option value="platform_issue">Platform Issue</option>
              <option value="program_suggestion">Suggestion</option>
              <option value="academic_query">Academic Query</option>
              <option value="mentor_complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full border rounded-lg p-2" disabled={isSubmitting}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2" required disabled={isSubmitting} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Detailed Message</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2" rows={5} required disabled={isSubmitting} />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="isComplaint" 
              checked={isComplaint} 
              onChange={e => setIsComplaint(e.target.checked)} 
              disabled={isSubmitting}
              className="rounded"
            />
            <label htmlFor="isComplaint" className="text-sm font-medium">This is a confidential complaint</label>
          </div>
          {isComplaint && (
            <p className="text-xs text-gray-500 italic">
              Complaints are routed securely to Super Admins and cannot be viewed by the target.
            </p>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 font-medium text-gray-600" disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};
