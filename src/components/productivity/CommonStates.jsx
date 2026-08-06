import React from 'react';

/**
 * @param {Object} props
 * @param {string} [props.message]
 */
export function LoadingState({ message = 'Loading productivity data...' }) {
  return (
    <div className="p-8 bg-white border border-[#EDEDED] rounded-2xl text-center space-y-3 animate-pulse">
      <div className="w-10 h-10 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-semibold text-[#737373]">{message}</p>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {() => void} [props.onAction]
 * @param {React.ComponentType<any>} [props.icon]
 */
export function EmptyState({ title = 'No Data Available', description = 'There are no items to display at this moment.', actionLabel, onAction, icon: Icon }) {
  return (
    <div className="p-8 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl text-center space-y-3">
      {Icon && <Icon className="h-8 w-8 text-[#A3A3A3] mx-auto" />}
      <h3 className="text-sm font-bold text-[#171717]">{title}</h3>
      <p className="text-xs text-[#737373] max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl transition-all shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {() => void} [props.onRetry]
 */
export function ErrorState({ title = 'Something Went Wrong', message = 'Failed to load module details.', onRetry }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
      <h3 className="text-sm font-bold text-red-900">{title}</h3>
      <p className="text-xs text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.confirmText]
 * @param {string} [props.cancelText]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} [props.isDanger]
 */
export function ConfirmationDialog({ isOpen, title = 'Confirm Action', description = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-[#171717]">{title}</h3>
        <p className="text-xs text-[#737373] leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#404040] font-bold text-xs rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-all shadow-sm ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#FF8A00] hover:bg-[#FF3D00]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
