import React, { useState } from 'react';
import { 
  GraduationCap, BookOpen, Sparkles, Plus, Lightbulb, 
  Layers, Clock, Download, Upload, CheckCircle2, Flame, Heart, Route
} from 'lucide-react';
import { ReadingMaterial, ReadingStatus, StudentProfile } from '../types';
import { InactivityAlertItem } from '../utils/inactivityAlerts';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  materials: ReadingMaterial[];
  currentTab: 'materials' | 'roadmap' | 'tips' | 'flashcards' | 'about';
  onSelectTab: (tab: 'materials' | 'roadmap' | 'tips' | 'flashcards' | 'about') => void;
  onOpenAddModal: () => void;
  onOpenTimerModal: () => void;
  onOpenExportModal: () => void;
  timerActive: boolean;
  timerSecondsRemaining: number;
  studentProfile: StudentProfile | null;
  onOpenRegistrationModal: () => void;
  // Alert system props:
  alerts: InactivityAlertItem[];
  thresholdDays: number;
  onSetThresholdDays: (days: number) => void;
  onOpenMaterial: (material: ReadingMaterial) => void;
  onRefreshActivity: (id: string) => void;
  onRefreshAllActivities: () => void;
  onStartTimerForMaterial: (material: ReadingMaterial) => void;
  onUpdateStatus: (id: string, newStatus: ReadingStatus) => void;
  onSimulateInactivity?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  materials,
  currentTab,
  onSelectTab,
  onOpenAddModal,
  onOpenTimerModal,
  onOpenExportModal,
  timerActive,
  timerSecondsRemaining,
  studentProfile,
  onOpenRegistrationModal,
  alerts,
  thresholdDays,
  onSetThresholdDays,
  onOpenMaterial,
  onRefreshActivity,
  onRefreshAllActivities,
  onStartTimerForMaterial,
  onUpdateStatus,
  onSimulateInactivity,
}) => {
  // Compute stats
  const totalMaterials = materials.length;
  const completedMaterials = materials.filter(m => m.status === 'completed').length;
  const totalPagesRead = materials.reduce((acc, m) => acc + (m.pagesRead || 0), 0);
  const totalPages = materials.reduce((acc, m) => acc + (m.totalPages || 0), 0);
  const completionPercent = totalPages > 0 ? Math.round((totalPagesRead / totalPages) * 100) : 0;

  // Format timer
  const minutes = Math.floor(timerSecondsRemaining / 60);
  const seconds = timerSecondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-indigo-100 shadow-xs sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Crest */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div 
              onClick={() => onSelectTab('materials')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    Fachee United
                  </h1>
                  <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/70">
                    Student Hub
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Reading Materials • Photos • Videos • Documents & Study Tips
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onOpenRegistrationModal}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                title={studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : 'Register Student'}
              >
                {studentProfile ? (
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                    {studentProfile.firstName[0]}
                  </span>
                ) : (
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              <NotificationDropdown
                alerts={alerts}
                thresholdDays={thresholdDays}
                onSetThresholdDays={onSetThresholdDays}
                onOpenMaterial={onOpenMaterial}
                onRefreshActivity={onRefreshActivity}
                onRefreshAllActivities={onRefreshAllActivities}
                onStartTimer={onStartTimerForMaterial}
                onUpdateStatus={onUpdateStatus}
                onSimulateInactivity={onSimulateInactivity}
              />
              <button
                onClick={onOpenTimerModal}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                  timerActive 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formattedTime}</span>
              </button>
              <button
                onClick={onOpenAddModal}
                className="p-2 rounded-xl bg-indigo-600 text-white font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 w-full md:w-auto justify-start md:justify-center overflow-x-auto scrollbar-none">
            <button
              onClick={() => onSelectTab('materials')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'materials'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Materials</span>
              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {totalMaterials}
              </span>
            </button>

            <button
              onClick={() => onSelectTab('roadmap')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'roadmap'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Route className="w-4 h-4 text-indigo-600" />
              <span>Study Roadmap</span>
            </button>

            <button
              onClick={() => onSelectTab('tips')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'tips'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Sharing Tips</span>
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                Tips Hub
              </span>
            </button>

            <button
              onClick={() => onSelectTab('flashcards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'flashcards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Flashcards</span>
            </button>

            <button
              onClick={() => onSelectTab('about')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'about'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
              <span>About</span>
            </button>
          </nav>

          {/* Right Utilities (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold">{totalPagesRead}</span>
                <span className="text-slate-500 text-[11px]">/{totalPages} pgs</span>
              </div>
              <div className="w-px h-3.5 bg-indigo-200" />
              <div className="flex items-center gap-1 font-semibold text-amber-700">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                <span>{completionPercent}% done</span>
              </div>
            </div>

            {/* Notification Center Alert Bell */}
            <NotificationDropdown
              alerts={alerts}
              thresholdDays={thresholdDays}
              onSetThresholdDays={onSetThresholdDays}
              onOpenMaterial={onOpenMaterial}
              onRefreshActivity={onRefreshActivity}
              onRefreshAllActivities={onRefreshAllActivities}
              onStartTimer={onStartTimerForMaterial}
              onUpdateStatus={onUpdateStatus}
              onSimulateInactivity={onSimulateInactivity}
            />

            {/* Pomodoro Timer button */}
            <button
              onClick={onOpenTimerModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                timerActive 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Pomodoro Study Timer"
            >
              <Clock className={`w-4 h-4 ${timerActive ? 'text-amber-600 animate-spin' : 'text-slate-500'}`} />
              <span>{formattedTime}</span>
            </button>

            {/* Export / Share data */}
            <button
              onClick={onOpenExportModal}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Share / Backup Fachee Library"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Student Registration / Profile Badge */}
            {studentProfile ? (
              <button
                onClick={onOpenRegistrationModal}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-all cursor-pointer text-left shadow-2xs group"
                title="View / Edit Student ID Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {studentProfile.firstName[0]}{studentProfile.lastName[0]}
                </div>
                <div className="flex flex-col pr-1 max-w-[120px]">
                  <span className="text-xs font-black text-slate-900 leading-none truncate group-hover:text-indigo-600 transition-colors">
                    {studentProfile.firstName} {studentProfile.lastName[0]}.
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-tight mt-0.5 truncate">
                    {studentProfile.educationLevel === 'university' 
                      ? (studentProfile.universityYear?.split(' ')[0] || 'Uni')
                      : (studentProfile.highSchoolGrade?.split(' ')[0] || 'HS')}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenRegistrationModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black shadow-2xs active:scale-95 transition-all cursor-pointer"
                title="Register as University or High School Student"
              >
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <span>Register</span>
              </button>
            )}

            {/* Add Reading Material Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Material</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

