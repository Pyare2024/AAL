import React from 'react';
import { FeedbackTicket } from '../../types/feedbackTypes';

const FeedbackTicketCard = ({ ticket, onClick }: { ticket: FeedbackTicket; onClick?: () => void }) => {
  return (
    <div onClick={onClick} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{ticket.title}</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {ticket.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
        {ticket.description}
      </p>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-600 dark:text-gray-300">{ticket.author.name}</span>
          <span>•</span>
          <span className="uppercase">{ticket.category.replace('_', ' ')}</span>
        </div>
        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export const FeedbackTicketList = ({ tickets, onTicketClick }: { tickets: FeedbackTicket[]; onTicketClick?: (ticket: FeedbackTicket) => void }) => {
  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <FeedbackTicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick?.(ticket)} />
      ))}
    </div>
  );
};
