import React, { useState, useEffect, useRef } from 'react';
import { FeedbackTicket, FeedbackMessage } from '../../types/feedbackTypes';
import { feedbackService } from '../../services/feedbackService';
import { FeedbackConversation } from './FeedbackConversation';

interface Props {
  ticket: FeedbackTicket | null;
  isOpen: boolean;
  onClose: () => void;
  role: string;
  viewerId: string;
  onTicketUpdated: () => void;
}

export const FeedbackDetailDrawer: React.FC<Props> = ({ ticket, isOpen, onClose, role, viewerId, onTicketUpdated }) => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket && isOpen) {
      loadMessages();
    }
  }, [ticket?.id, isOpen]);

  const handleCloseDrawer = () => {
    setReplyText('');
    setIsInternal(false);
    setIsSending(false);
    setIsUpdatingStatus(false);
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleCloseDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseDrawer]);

  const loadMessages = async () => {
    if (!ticket) return;
    setIsLoadingMessages(true);
    setMessagesError(null);
    try {
      const data = await feedbackService.fetchFeedbackMessages(ticket.id);
      setMessages(data);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e: any) {
      setMessagesError(e.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;
    
    setIsSending(true);
    try {
      await feedbackService.addFeedbackReply(ticket.id, replyText, isInternal);
      setReplyText('');
      setIsInternal(false);
      await loadMessages();
      onTicketUpdated(); // refresh list & summary
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setIsUpdatingStatus(true);
    try {
      await feedbackService.updateFeedbackStatus(ticket.id, newStatus);
      onTicketUpdated(); // refresh list & summary
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!ticket || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity" 
        onClick={handleCloseDrawer}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-dvh shadow-2xl flex flex-col z-10 transition-transform transform translate-x-0">
        <div className="p-4 border-b flex justify-between items-center shrink-0 bg-white">
          <h2 className="font-bold text-lg truncate pr-4">{ticket.title}</h2>
          <button type="button" onClick={handleCloseDrawer} className="text-gray-500 hover:text-black shrink-0 px-2 py-1">Close</button>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-white flex flex-col">
          {/* Ticket Details */}
          <div className="p-4 bg-white border-b">
            <div className="flex justify-between items-start mb-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                ${ticket.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                  ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-800'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-500">{ticket.ticket_number}</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-y-2 mb-4 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Author</span>
                  <span className="font-semibold text-gray-900">{ticket.author.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Category</span>
                  <span className="font-semibold text-gray-900 capitalize">{ticket.category.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Priority</span>
                  <span className={`font-semibold capitalize
                    ${ticket.priority === 'critical' ? 'text-red-600' : 
                      ticket.priority === 'high' ? 'text-orange-600' : 'text-gray-900'}
                  `}>{ticket.priority}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Created</span>
                  <span className="font-semibold text-gray-900">{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <span className="text-gray-500 text-xs block mb-1">Description</span>
                <p className="whitespace-pre-wrap text-gray-800">{ticket.description}</p>
              </div>
            </div>
          </div>
          
          {/* Conversation Area */}
          <div className="flex-1 bg-gray-50">
            <FeedbackConversation 
              messages={messages} 
              isLoading={isLoadingMessages} 
              error={messagesError} 
              viewerId={viewerId}
              viewerRole={role}
            />
            <div ref={bottomRef} className="h-4" />
          </div>
        </div>
        
        {/* Actions / Reply Area */}
        <div className="p-4 border-t bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          {(role === 'admin' || role === 'super_admin') && (
            <div className="flex gap-2 mb-3 items-center">
              {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                <button 
                  onClick={() => handleStatusChange('in_progress')} 
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 bg-yellow-50 text-yellow-800 text-xs font-bold rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Mark In Progress'}
                </button>
              )}
              {ticket.status !== 'resolved' && (
                <button 
                  onClick={() => handleStatusChange('resolved')} 
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 bg-green-50 text-green-800 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Resolve Ticket'}
                </button>
              )}
              
              <label className="flex items-center text-xs font-semibold ml-auto cursor-pointer text-gray-700">
                <input 
                  type="checkbox" 
                  checked={isInternal} 
                  onChange={e => setIsInternal(e.target.checked)} 
                  className="mr-1.5 rounded text-amber-600 focus:ring-amber-500" 
                />
                Internal Note
              </label>
            </div>
          )}
          
          <div className="flex flex-col gap-2 relative">
            <textarea 
              value={replyText} 
              onChange={e => setReplyText(e.target.value)}
              className={`w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors ${
                isInternal ? 'bg-amber-50 border-amber-200 focus:ring-amber-500 focus:border-amber-500' : 'bg-gray-50'
              }`}
              rows={3} 
              placeholder={isInternal ? "Type an internal note (hidden from intern)..." : "Type your reply..."} 
              disabled={isSending}
            />
            <button 
              onClick={handleReply} 
              disabled={isSending || !replyText.trim()}
              className={`w-full text-white font-bold py-2.5 rounded-xl transition-colors ${
                isSending || !replyText.trim() ? 'opacity-50 cursor-not-allowed bg-blue-400' : 
                isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSending ? 'Sending...' : (isInternal ? 'Add Internal Note' : 'Send Reply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
