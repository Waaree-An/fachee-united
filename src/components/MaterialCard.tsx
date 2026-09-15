import React from 'react';
import { 
  BookOpen, Image, Video, FileText, Link2, CheckCircle2, 
  Clock, MoreVertical, Edit3, Trash2, Share2, Layers, Flame, Plus, Minus,
  BellRing, RefreshCw, AlertCircle
} from 'lucide-react';
import { ReadingMaterial, ReadingStatus } from '../types';
import confetti from 'canvas-confetti';

interface MaterialCardProps {
  material: ReadingMaterial;
  isInactiveAlert?: boolean;
  daysInactive?: number;
  onOpenDetail: (material: ReadingMaterial) => void;
  onEdit: (material: ReadingMaterial) => void;
  onDelete: (id: string) => void;
  onShare: (material: ReadingMaterial) => void;
  onQuickFlashcards: (material: ReadingMaterial) => void;
  onUpdateProgress: (id: string, newPagesRead: number, newStatus?: ReadingStatus) => void;
  onRefreshActivity?: (id: string) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  isInactiveAlert = false,
  daysInactive = 0,
  onOpenDetail,
  onEdit,
  onDelete,
  onShare,
  onQuickFlashcards,
  onUpdateProgress,
  onRefreshActivity,
}) => {
  const percent = material.totalPages > 0 
    ? Math.min(100, Math.round((material.pagesRead / material.totalPages) * 100)) 
    : 0;

  const handleIncrementPages = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPages = Math.min(material.totalPages, material.pagesRead + 5);
    const newStatus: ReadingStatus = nextPages >= material.totalPages ? 'completed' : 'reading';
    
    if (nextPages >= material.totalPages && material.status !== 'completed') {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    }
    
    onUpdateProgress(material.id, nextPages, newStatus);
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (material.status === 'completed') {
      onUpdateProgress(material.id, 0, 'to_read');
    } else {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.7 } });
      onUpdateProgress(material.id, material.totalPages, 'completed');
    }
  };

  const getStatusBadge = (status: ReadingStatus) => {
    switch (status) {
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">✅ Completed</span>;
      case 'reading':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">📖 Reading</span>;
      case 'under_review':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">🔍 Review</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">📌 To Read</span>;
    }
  };

  const getPriorityDot = (priority: ReadingMaterial['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="w-2 h-2 rounded-full bg-rose-500" title="Exam Prep / High Priority" />;
      case 'medium':
        return <span className="w-2 h-2 rounded-full bg-amber-500" title="Important" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400" title="Normal" />;
    }
  };

  return (
    <div 
      onClick={() => onOpenDetail(material)}
      className={`bg-white rounded-3xl border shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
        isInactiveAlert
          ? 'border-amber-300 ring-2 ring-amber-300/40 bg-gradient-to-b from-amber-50/20 to-white'
          : 'border-slate-200/90 hover:border-indigo-200'
      }`}
    >
      {/* Inactivity Alert Notification Pill on the Card */}
      {isInactiveAlert && (
        <div className="mb-3 -mt-1 flex items-center justify-between bg-amber-100/90 border border-amber-300/80 px-3 py-1.5 rounded-xl text-amber-900 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <BellRing className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Review Due: {daysInactive}d Inactive</span>
          </div>

          {onRefreshActivity && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefreshActivity(material.id);
              }}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-amber-200 text-amber-900 font-extrabold text-[10px] border border-amber-300 transition-colors flex items-center gap-1"
              title="Reset inactivity counter (marked reviewed)"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Mark Reviewed</span>
            </button>
          )}
        </div>
      )}

      <div>
        {/* Top bar: Subject & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getPriorityDot(material.priority)}
            <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-100">
              {material.subject}
            </span>
            {material.semester && (
              <span className="text-[10px] text-slate-400 font-medium">
                • {material.semester}
              </span>
            )}
          </div>
          <div>{getStatusBadge(material.status)}</div>
        </div>

        {/* Title & Author */}
        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5">
          {material.title}
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-3 truncate">
          By {material.author || 'Unknown Author'} {material.professor ? `• Prof. ${material.professor}` : ''}
        </p>

        {/* Description snippet */}
        {material.description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-normal">
            {material.description}
          </p>
        )}

        {/* Media Attachments Counter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {material.photos.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
              <Image className="w-3 h-3" />
              <span>{material.photos.length} photos</span>
            </span>
          )}

          {material.videoLinks.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
              <Link2 className="w-3 h-3" />
              <span>{material.videoLinks.length} videos</span>
            </span>
          )}

          {material.shortVideos.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
              <Video className="w-3 h-3" />
              <span>{material.shortVideos.length} clips</span>
            </span>
          )}

          {material.documents.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
              <FileText className="w-3 h-3" />
              <span>{material.documents.length} docs ({material.documents.map(d => d.format).slice(0, 2).join(', ')})</span>
            </span>
          )}

          {material.keyTakeaways.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
              <Layers className="w-3 h-3" />
              <span>{material.keyTakeaways.length} takeaways</span>
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Interactive Reading Progress */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700">Reading Progress</span>
            <span className="font-extrabold text-indigo-700 font-mono">
              {material.pagesRead} / {material.totalPages} pgs ({percent}%)
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-300 ${
                percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleIncrementPages}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>+5 Pages</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                material.status === 'completed'
                  ? 'text-slate-500 hover:text-slate-700'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{material.status === 'completed' ? 'Reset' : 'Done!'}</span>
            </button>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickFlashcards(material);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
            title="Recall Flashcards"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quiz</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(material);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Share Study Summary"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(material);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Edit Material"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${material.title}"?`)) {
                  onDelete(material.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Material"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
