import React, { useState } from 'react';

export function TodoTaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  const getPriorityBadge = (p) => {
    if (p === 'high') return 'bg-red-50 text-red-700 border-red-200';
    if (p === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const isCompleted = task.is_completed === true;

  return (
    <div className={`p-4 bg-white border rounded-xl shadow-sm flex items-start justify-between gap-3 transition-all ${
      isCompleted ? 'border-[#EDEDED] opacity-75' : 'border-[#EDEDED] hover:border-[#D4D4D4]'
    }`}>
      <div className="flex items-start gap-3 min-w-0">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggleComplete(task.id)}
          className="mt-1 w-4 h-4 text-[#FF8A00] border-[#D4D4D4] rounded focus:ring-[#FF8A00] cursor-pointer"
        />
        <div className="min-w-0 space-y-1">
          <h4 className={`text-xs font-bold text-[#171717] ${isCompleted ? 'line-through text-[#737373]' : ''}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-[#737373] leading-relaxed">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
            <span className={`px-2 py-0.5 border rounded-full font-extrabold uppercase ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-[#737373] font-semibold">Due: {task.due_date}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(task)}
          className="p-1 text-[#737373] hover:text-[#171717] text-xs font-semibold"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-red-600 hover:text-red-800 text-xs font-semibold"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function TodoTaskForm({ onSubmit, initialData = null, onCancel }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialData?.due_date || new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      id: initialData?.id || `todo-${Date.now()}`,
      title,
      description,
      priority,
      due_date: dueDate,
      is_completed: initialData?.is_completed || false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[#FAFAFA] border border-[#EDEDED] rounded-xl space-y-3">
      <h3 className="text-xs font-bold text-[#171717]">{initialData ? 'Edit Task' : 'Add New Personal Task'}</h3>
      <input
        type="text"
        placeholder="Task Title (Required)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-[#EDEDED] rounded-lg text-xs font-semibold text-[#171717] focus:outline-none focus:border-[#FF8A00]"
        required
      />
      <textarea
        placeholder="Short Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-[#EDEDED] rounded-lg text-xs text-[#171717] focus:outline-none focus:border-[#FF8A00]"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-[#737373] uppercase block mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-[#EDEDED] rounded-lg text-xs font-semibold text-[#171717]"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-[#737373] uppercase block mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-[#EDEDED] rounded-lg text-xs font-semibold text-[#171717]"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-[#737373]">
            Cancel
          </button>
        )}
        <button type="submit" className="px-4 py-1.5 bg-[#FF8A00] hover:bg-[#FF3D00] text-white text-xs font-bold rounded-lg shadow-sm">
          {initialData ? 'Update Task' : 'Save Task'}
        </button>
      </div>
    </form>
  );
}
