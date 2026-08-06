import React from 'react';

export const FeedbackEmptyState = () => (
  <div className="py-12 text-center text-gray-500">
    No feedback tickets are currently available.
  </div>
);

export const FeedbackErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="py-12 text-center text-red-500">
    <p>{message}</p>
    <button onClick={onRetry} className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 font-medium">
      Retry
    </button>
  </div>
);
