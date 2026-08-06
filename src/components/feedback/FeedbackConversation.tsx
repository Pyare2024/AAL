import React from 'react';
import { FeedbackMessage as FeedbackMessageType } from '../../types/feedbackTypes';
import { FeedbackMessage } from './FeedbackMessage';

interface Props {
  messages: FeedbackMessageType[];
  isLoading: boolean;
  error: string | null;
  viewerId: string;
  viewerRole: string;
}

export const FeedbackConversation: React.FC<Props> = ({ messages, isLoading, error, viewerId, viewerRole }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-2xl w-3/4"></div>
        <div className="h-16 bg-gray-100 rounded-2xl w-3/4 self-end"></div>
        <div className="h-16 bg-gray-100 rounded-2xl w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
        Failed to load conversation: {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 italic text-sm">
        No messages in this conversation yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4">
      {messages.map(msg => (
        <FeedbackMessage 
          key={msg.id} 
          message={msg} 
          isOwnMessage={msg.author.id === viewerId}
          viewerRole={viewerRole}
        />
      ))}
    </div>
  );
};
