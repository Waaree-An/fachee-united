import React from 'react';
import { X, Play, Pause, RotateCcw, Clock, Sparkles, Coffee, Flame } from 'lucide-react';

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerActive: boolean;
  timerSecondsRemaining: number;
  timerMode: 'focus' | 'break';
  completedPomodoros: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSetMode: (mode: 'focus' | 'break') => void;
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  timerActive,
  timerSecondsRemaining,
  timerMode,
  completedPomodoros,
  onToggleTimer,
  onResetTimer,
  onSetMode,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(timerSecondsRemaining / 60);
  const seconds = timerSecondsRemaining % 60;
  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalTime = timerMode === 'focus' ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalTime - timerSecondsRemaining) / totalTime) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Fachee Study Sprint Timer
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => onSetMode('focus')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              timerMode === 'focus' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>25m Focus</span>
          </button>
          <button
            onClick={() => onSetMode('break')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              timerMode === 'break' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-500" />
            <span>5m Break</span>
          </button>
        </div>

        {/* Big Clock Display */}
        <div className="py-2">
          <div className="text-5xl font-black text-slate-900 tracking-tight font-mono">
            {formatted}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {timerMode === 'focus' ? 'Deep Reading & Material Review' : 'Rest your eyes & hydrate'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timerMode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onToggleTimer}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
              timerActive
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {timerActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Timer</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Session</span>
              </>
            )}
          </button>

          <button
            onClick={onResetTimer}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Completed count */}
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Completed Sprints Today:</span>
          <span className="font-extrabold text-amber-600 font-mono text-sm">
            {completedPomodoros} 🍅
          </span>
        </div>

      </div>
    </div>
  );
};
