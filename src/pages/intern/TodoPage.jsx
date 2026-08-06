import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TodoTaskCard, TodoTaskForm } from '../../components/productivity/TodoComponents';
import { ConfirmationDialog, ErrorState, LoadingState } from '../../components/productivity/CommonStates';

export function TodoPage() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('todo_items')
        .select('*')
        .eq('intern_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setTodos(data || []);
    } catch (err) {
      console.error('[TodoPage] Error fetching todos:', err);
      setError(err.message || 'Failed to load to-do tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleToggleComplete = async (id) => {
    try {
      const task = todos.find(t => t.id === id);
      if (!task) return;
      
      const nextCompleted = !task.is_completed;
      const completedAt = nextCompleted ? new Date().toISOString() : null;
      
      // Optimistic UI update
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, completed_at: completedAt, is_completed: nextCompleted } : t
      ));
      
      const { error } = await supabase
        .from('todo_items')
        .update({ completed_at: completedAt, is_completed: nextCompleted, updated_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) {
        // Revert on failure
        setTodos(prev => prev.map(t => t.id === id ? task : t));
        throw error;
      }
    } catch (err) {
      console.error('Toggle complete failed:', err);
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (editingTask) {
        // Optimistic
        setTodos(prev => prev.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
        
        const { error } = await supabase
          .from('todo_items')
          .update({
            title: taskData.title,
            description: taskData.description,
            priority: taskData.priority,
            due_date: taskData.due_date,
            is_completed: taskData.is_completed,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskData.id);
          
        if (error) {
          setTodos(prev => prev.map(t => t.id === taskData.id ? editingTask : t));
          throw error;
        }
      } else {
        const payload = {
          intern_id: userId,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.due_date,
          is_completed: false
        };
        
        const { data, error } = await supabase
          .from('todo_items')
          .insert([payload])
          .select()
          .single();
          
        if (error) throw error;
        setTodos(prev => [data, ...prev]);
      }
      setEditingTask(null);
      setShowForm(false);
    } catch (err) {
      console.error('Save task failed:', err);
      setError(err.message || 'Failed to save task.');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const idToDelete = deleteId;
      const backupTodos = [...todos];
      
      try {
        setTodos(prev => prev.filter(t => t.id !== idToDelete));
        setDeleteId(null);
        
        const { error } = await supabase.from('todo_items').delete().eq('id', idToDelete);
        if (error) throw error;
      } catch (err) {
        console.error('Delete task failed:', err);
        setTodos(backupTodos);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-8 bg-[#FFF4F2] border border-[#FFD9D2] rounded-2xl text-center">
        <h3 className="text-lg font-bold text-[#D32F2F]">Error loading tasks</h3>
        <p className="text-sm text-[#737373] mt-2 mb-4">{error}</p>
        <button onClick={fetchTodos} className="px-4 py-2 bg-white border border-[#D32F2F] text-[#D32F2F] text-xs font-bold rounded-xl hover:bg-[#FFF4F2] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  const completedCount = todos.filter(t => t.is_completed).length;
  const totalCount = todos.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Private Productivity</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">To-do Task Management</h1>
          <p className="text-xs text-[#737373] mt-1">Plan and manage personal daily tasks. Private to your intern portal.</p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#FF8A00] hover:bg-[#FF3D00] text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0"
        >
          + Add New Task
        </button>
      </div>

      {/* Progress Summary Banner */}
      <div className="bg-white border border-[#EDEDED] rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#737373] uppercase block">Completion Rate</span>
          <p className="text-lg font-black text-[#171717]">{percent}% ({completedCount} of {totalCount} Completed)</p>
        </div>
        <div className="w-32 sm:w-48 h-2 bg-[#EDEDED] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {(showForm || editingTask) && (
        <TodoTaskForm
          onSubmit={handleSaveTask}
          initialData={editingTask}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}

      {/* Task List */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] border border-[#EDEDED] rounded-2xl text-center">
            <p className="text-xs text-[#737373]">No to-do tasks created yet. Click "+ Add New Task" to start planning.</p>
          </div>
        ) : (
          todos.map(task => (
            <TodoTaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => { setEditingTask(t); setShowForm(false); }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))
        )}
      </div>

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Personal Task"
        description="Are you sure you want to remove this task from your to-do list?"
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
