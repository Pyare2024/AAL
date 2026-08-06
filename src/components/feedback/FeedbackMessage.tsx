import React from 'react';
import { FeedbackMessage as FeedbackMessageType } from '../../types/feedbackTypes';

interface Props {
  message: FeedbackMessageType;
  isOwnMessage: boolean;
  viewerRole: string;
}

export const FeedbackMessage: React.FC<Props> = ({ message, isOwnMessage, viewerRole }) => {
  const isInternal = message.is_internal_note;
  
  if (isInternal && viewerRole === 'intern') {
    return null; // Safety fallback, though backend should filter it out
  }

  const roleLabel = message.author.role === 'super_admin' ? 'Super Admin' : 
                    message.author.role === 'admin' ? 'Admin' : 'Intern';
                    
  const initials = message.author.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const containerClasses = isOwnMessage
    ? "flex flex-col items-end"
    : "flex flex-col items-start";
    
  const bubbleClasses = isInternal
    ? "bg-amber-50 border border-amber-200 text-amber-900"
    : isOwnMessage
      ? "bg-blue-600 text-white"
      : "bg-gray-100 text-gray-900";

  return (
    <div className={`flex w-full gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className="shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
        {initials || '?'}
      </div>
      
      <div className={`${containerClasses} max-w-[85%]`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs font-bold text-gray-700">{message.author.name}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{roleLabel}</span>
          {isInternal && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              INTERNAL NOTE
            </span>
          )}
        </div>
        
        <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${bubbleClasses}`}>
          {message.content}
        </div>
        
        <div className={`text-[10px] text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {new Date(message.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
