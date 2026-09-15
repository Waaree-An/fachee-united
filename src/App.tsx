import React, { useState, useEffect, useRef } from 'react';
import { ReadingMaterial, StudyTip, ReadingStatus, StudentProfile } from './types';
import { INITIAL_READING_MATERIALS, INITIAL_STUDY_TIPS } from './utils/initialData';
import { loadMaterialsFromDB, saveMaterialsToDB, loadTipsFromDB, saveTipsToDB } from './utils/storage';
import { Navbar } from './components/Navbar';
import { MaterialCard } from './components/MaterialCard';
import { MaterialModal } from './components/MaterialModal';
import { MaterialDetailView } from './components/MaterialDetailView';
import { StudyTipsHub } from './components/StudyTipsHub';
import { FlashcardsModal } from './components/FlashcardsModal';
import { StudyTimerModal } from './components/StudyTimerModal';
import { ShareModal } from './components/ShareModal';
import { DashboardAlertBanner } from './components/DashboardAlertBanner';
import { AboutSection } from './components/AboutSection';
import { StudyRoadmap } from './components/StudyRoadmap';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { DailyStudyGoalTracker } from './components/DailyStudyGoalTracker';
import { DailyStudyGoal } from './types';
import { loadDailyGoal, saveDailyGoal } from './utils/dailyGoals';
import { 
  getInactiveMaterials, 
  DEFAULT_INACTIVITY_THRESHOLD_DAYS, 
  sendDesktopAlert 
} from './utils/inactivityAlerts';
import { 
  Search, Filter, Plus, BookOpen, Layers, Lightbulb, 
  Sparkles, CheckCircle2, Image, Video, FileText, Link2, 
  Flame, Clock, ArrowUpDown, BellRing, Bell, AlertTriangle,
  Heart, Youtube, Facebook, ExternalLink, Route
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Core State
  const [materials, setMaterials] = useState<ReadingMaterial[]>(INITIAL_READING_MATERIALS);
  const [tips, setTips] = useState<StudyTip[]>(INITIAL_STUDY_TIPS);
  const [currentTab, setCurrentTab] = useState<'materials' | 'roadmap' | 'tips' | 'flashcards' | 'about'>('materials');
  const [selectedMaterialDetail, setSelectedMaterialDetail] = useState<ReadingMaterial | null>(null);

  // Inactivity Alert System State
  const [alertThresholdDays, setAlertThresholdDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fachee_alert_threshold_days');
      return saved ? parseInt(saved, 10) || DEFAULT_INACTIVITY_THRESHOLD_DAYS : DEFAULT_INACTIVITY_THRESHOLD_DAYS;
    } catch {
      return DEFAULT_INACTIVITY_THRESHOLD_DAYS;
    }
  });
  const [filterInactiveOnly, setFilterInactiveOnly] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'progress' | 'priority'>('updated');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ReadingMaterial | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [materialToShare, setMaterialToShare] = useState<ReadingMaterial | null>(null);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [flashcardTarget, setFlashcardTarget] = useState<ReadingMaterial | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // Student Registration & Profile State
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem('fachee_student_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSaveProfile = (profile: StudentProfile) => {
    setStudentProfile(profile);
    try {
      localStorage.setItem('fachee_student_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save student profile to localStorage', e);
    }
  };

  // Daily Study Goal Tracker State
  const [dailyGoal, setDailyGoal] = useState<DailyStudyGoal>(() => loadDailyGoal());

  const handleUpdateDailyGoal = (updated: DailyStudyGoal) => {
    setDailyGoal(updated);
    saveDailyGoal(updated);
  };

  // Pomodoro Study Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState(25 * 60);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const timerIntervalRef = useRef<number | null>(null);

  // Load from IndexedDB on initial mount
  useEffect(() => {
    async function loadData() {
      const savedMaterials = await loadMaterialsFromDB();
      if (savedMaterials && savedMaterials.length > 0) {
        setMaterials(savedMaterials);
      }
      const savedTips = await loadTipsFromDB();
      if (savedTips && savedTips.length > 0) {
        setTips(savedTips);
      }
    }
    loadData();
  }, []);

  // Save to IndexedDB whenever materials or tips change
  useEffect(() => {
    saveMaterialsToDB(materials);
  }, [materials]);

  useEffect(() => {
    saveTipsToDB(tips);
  }, [tips]);

  // Pomodoro Study Timer Engine
  useEffect(() => {
    if (timerActive) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer expired chime
            playChimeSound();
            confetti({ particleCount: 75, spread: 70, origin: { y: 0.7 } });
            
            if (timerMode === 'focus') {
              setCompletedPomodoros((c) => c + 1);
              setTimerMode('break');
              return 5 * 60;
            } else {
              setTimerMode('focus');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timerMode]);

  // Web Audio chime sound helper
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio fallback
    }
  };

  const handleToggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSecondsRemaining(timerMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const handleSetTimerMode = (mode: 'focus' | 'break') => {
    setTimerActive(false);
    setTimerMode(mode);
    setTimerSecondsRemaining(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  // Material Handlers
  const handleSaveMaterial = (material: ReadingMaterial) => {
    const existingIndex = materials.findIndex((m) => m.id === material.id);
    if (existingIndex >= 0) {
      const updated = [...materials];
      updated[existingIndex] = material;
      setMaterials(updated);
      if (selectedMaterialDetail?.id === material.id) {
        setSelectedMaterialDetail(material);
      }
    } else {
      setMaterials([material, ...materials]);
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
    if (selectedMaterialDetail?.id === id) {
      setSelectedMaterialDetail(null);
    }
  };

  const handleUpdateProgress = (id: string, newPagesRead: number, newStatus?: ReadingStatus) => {
    const existing = materials.find((m) => m.id === id);
    if (existing && newPagesRead > existing.pagesRead) {
      const delta = newPagesRead - existing.pagesRead;
      setDailyGoal((prev) => {
        const nextPages = prev.pagesCompleted + delta;
        const updatedGoal: DailyStudyGoal = {
          ...prev,
          pagesCompleted: nextPages,
          lastAchievedDate: (nextPages >= prev.targetPages || prev.materialsReviewedIds.length >= prev.targetMaterials) 
            ? prev.date 
            : prev.lastAchievedDate,
        };
        saveDailyGoal(updatedGoal);
        return updatedGoal;
      });
    }

    if (newStatus === 'completed' || newStatus === 'under_review') {
      setDailyGoal((prev) => {
        if (!prev.materialsReviewedIds.includes(id)) {
          const updatedGoal: DailyStudyGoal = {
            ...prev,
            materialsReviewedIds: [...prev.materialsReviewedIds, id],
            lastAchievedDate: (prev.pagesCompleted >= prev.targetPages || (prev.materialsReviewedIds.length + 1) >= prev.targetMaterials) 
              ? prev.date 
              : prev.lastAchievedDate,
          };
          saveDailyGoal(updatedGoal);
          return updatedGoal;
        }
        return prev;
      });
    }

    setMaterials(
      materials.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            pagesRead: newPagesRead,
            status: newStatus || m.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );
  };

  // Study Tips Handlers
  const handleAddTip = (newTip: StudyTip) => {
    setTips([newTip, ...tips]);
  };

  const handleLikeTip = (id: string) => {
    setTips(
      tips.map((t) => {
        if (t.id === id) {
          const liked = !t.userLiked;
          return {
            ...t,
            userLiked: liked,
            likes: liked ? t.likes + 1 : Math.max(0, t.likes - 1),
          };
        }
        return t;
      })
    );
  };

  // Import Data Handler
  const handleImportData = (importedMaterials: ReadingMaterial[], importedTips?: StudyTip[]) => {
    // Merge without duplicating IDs
    const currentIds = new Set(materials.map((m) => m.id));
    const newItems = importedMaterials.filter((m) => !currentIds.has(m.id));
    setMaterials([...newItems, ...materials]);

    if (importedTips) {
      const tipIds = new Set(tips.map((t) => t.id));
      const newTips = importedTips.filter((t) => !tipIds.has(t.id));
      setTips([...newTips, ...tips]);
    }
  };

  // Inactivity Alert System Computations & Handlers
  const handleSetThresholdDays = (days: number) => {
    setAlertThresholdDays(days);
    try {
      localStorage.setItem('fachee_alert_threshold_days', days.toString());
    } catch {
      // ignore
    }
  };

  const inactivityAlerts = getInactiveMaterials(materials, alertThresholdDays);
  const inactiveIdSet = new Set(inactivityAlerts.map((a) => a.material.id));

  const handleRefreshActivity = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
  };

  const handleRefreshAllActivities = () => {
    const now = new Date().toISOString();
    setMaterials((prev) =>
      prev.map((m) => {
        if (inactiveIdSet.has(m.id)) {
          return {
            ...m,
            updatedAt: now,
          };
        }
        return m;
      })
    );
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
  };

  const handleStartTimerForMaterial = (material: ReadingMaterial) => {
    setTimerMode('focus');
    setTimerSecondsRemaining(25 * 60);
    setTimerActive(true);
    setIsTimerModalOpen(true);
  };

  const handleSimulateInactivity = () => {
    handleSetThresholdDays(1);
  };

  // Subject list from existing materials
  const availableSubjects = Array.from(new Set(materials.map((m) => m.subject).filter(Boolean)));

  // Filtered and Sorted Materials
  const filteredMaterials = materials
    .filter((m) => {
      // Inactivity filter toggle
      if (filterInactiveOnly && !inactiveIdSet.has(m.id)) {
        return false;
      }

      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        m.title.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query) ||
        m.author.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query)) ||
        m.documents.some((d) => d.name.toLowerCase().includes(query));

      // Subject match
      const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;

      // Status match
      const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

      // Media type match
      let matchesMedia = true;
      if (selectedMediaType === 'has_photos') matchesMedia = m.photos.length > 0;
      else if (selectedMediaType === 'has_videos') matchesMedia = m.videoLinks.length > 0;
      else if (selectedMediaType === 'has_short_videos') matchesMedia = m.shortVideos.length > 0;
      else if (selectedMediaType === 'has_docs') matchesMedia = m.documents.length > 0;

      return matchesSearch && matchesSubject && matchesStatus && matchesMedia;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'progress') {
        const pctA = a.totalPages > 0 ? a.pagesRead / a.totalPages : 0;
        const pctB = b.totalPages > 0 ? b.pagesRead / b.totalPages : 0;
        return pctB - pctA;
      }
      if (sortBy === 'priority') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      // default: updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        materials={materials}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'flashcards') {
            setFlashcardTarget(null);
            setIsFlashcardModalOpen(true);
          }
        }}
        onOpenAddModal={() => {
          setEditingMaterial(null);
          setIsAddModalOpen(true);
        }}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenExportModal={() => {
          setMaterialToShare(null);
          setIsShareModalOpen(true);
        }}
        timerActive={timerActive}
        timerSecondsRemaining={timerSecondsRemaining}
        studentProfile={studentProfile}
        onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
        alerts={inactivityAlerts}
        thresholdDays={alertThresholdDays}
        onSetThresholdDays={handleSetThresholdDays}
        onOpenMaterial={(m) => setSelectedMaterialDetail(m)}
        onRefreshActivity={handleRefreshActivity}
        onRefreshAllActivities={handleRefreshAllActivities}
        onStartTimerForMaterial={handleStartTimerForMaterial}
        onUpdateStatus={(id, newStatus) => {
          const currentMat = materials.find((m) => m.id === id);
          handleUpdateProgress(id, currentMat ? currentMat.pagesRead : 0, newStatus);
        }}
        onSimulateInactivity={handleSimulateInactivity}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* VIEW 1: Reading Material Detail Reader View */}
        {selectedMaterialDetail ? (
          <MaterialDetailView
            material={selectedMaterialDetail}
            onBack={() => setSelectedMaterialDetail(null)}
            onEdit={(m) => {
              setEditingMaterial(m);
              setIsAddModalOpen(true);
            }}
            onDelete={handleDeleteMaterial}
            onShare={(m) => {
              setMaterialToShare(m);
              setIsShareModalOpen(true);
            }}
            onUpdateMaterial={(updated) => {
              handleSaveMaterial(updated);
              setSelectedMaterialDetail(updated);
            }}
          />
        ) : currentTab === 'roadmap' ? (
          /* VIEW 2: Visual Study Roadmap Progression Tracks */
          <StudyRoadmap
            materials={materials}
            onOpenMaterial={(m) => setSelectedMaterialDetail(m)}
            onUpdateStatus={(id, newStatus) => {
              const currentMat = materials.find((m) => m.id === id);
              handleUpdateProgress(id, currentMat ? currentMat.pagesRead : 0, newStatus);
            }}
            onStartTimer={(m) => handleStartTimerForMaterial(m)}
            onOpenAddModalWithSubject={(subject) => {
              setEditingMaterial({
                id: '',
                title: '',
                subject: subject,
                author: '',
                description: '',
                status: 'to_read',
                priority: 'medium',
                rating: 5,
                totalPages: 10,
                pagesRead: 0,
                tags: [subject],
                keyTakeaways: [],
                photos: [],
                videoLinks: [],
                shortVideos: [],
                documents: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              setIsAddModalOpen(true);
            }}
          />
        ) : currentTab === 'about' ? (
          /* VIEW 3: About Section & Creator Info */
          <AboutSection />
        ) : currentTab === 'tips' ? (
          /* VIEW 4: Study Tips & Wisdom Hub */
          <StudyTipsHub
            tips={tips}
            onAddTip={handleAddTip}
            onLikeTip={handleLikeTip}
          />
        ) : (
          /* VIEW 5: Reading Materials Directory & Media Hub */
          <div className="space-y-6">
            
            {/* Header Hero Banner for Materials */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {/* Student Greeting or Registration prompt */}
                {studentProfile ? (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-1.5 text-xs text-indigo-950 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Welcome, {studentProfile.firstName}!</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-indigo-700 font-medium">
                        {studentProfile.educationLevel === 'university'
                          ? `🎓 ${studentProfile.universityYear} (${studentProfile.majorFaculty || 'University'})`
                          : `🎒 ${studentProfile.highSchoolGrade} (${studentProfile.academicStream || 'High School'})`}
                      </span>
                      <button
                        onClick={() => setIsRegistrationModalOpen(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-900 underline font-bold ml-1 cursor-pointer"
                      >
                        Student ID
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setIsRegistrationModalOpen(true)}
                      className="px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 flex items-center gap-2 text-xs text-amber-950 font-bold transition-all cursor-pointer shadow-2xs group"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Register as a University or High School Student</span>
                      <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform font-black">→</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Academic Repository
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Fachee United Study Station
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Student Reading Materials & Media Hub
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl font-medium mt-0.5">
                  Store lecture reading info, photos & book diagrams, lecture video links, short study videos, and documents of ANY format (PDF, DOCX, Code, PPTX).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setCurrentTab('roadmap')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
                >
                  <Route className="w-4 h-4 text-indigo-600" />
                  <span>Study Roadmap</span>
                </button>

                <button
                  onClick={() => {
                    setFlashcardTarget(null);
                    setIsFlashcardModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Flashcard Deck</span>
                </button>

                <button
                  onClick={() => {
                    setEditingMaterial(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Store Material</span>
                </button>
              </div>
            </div>

            {/* Daily Study Goal Tracker */}
            <DailyStudyGoalTracker
              goal={dailyGoal}
              materials={materials}
              onUpdateGoal={handleUpdateDailyGoal}
              onOpenMaterial={(m) => setSelectedMaterialDetail(m)}
            />

            {/* Inactivity Alert Dashboard Banner (Reminds students of stale 'To Read' / 'Under Review' materials) */}
            <DashboardAlertBanner
              alerts={inactivityAlerts}
              thresholdDays={alertThresholdDays}
              onSetThresholdDays={handleSetThresholdDays}
              onOpenMaterial={(m) => setSelectedMaterialDetail(m)}
              onUpdateStatus={(id, newStatus) => {
                const currentMat = materials.find((m) => m.id === id);
                handleUpdateProgress(id, currentMat ? currentMat.pagesRead : 0, newStatus);
              }}
              onRefreshActivity={handleRefreshActivity}
              onRefreshAllActivities={handleRefreshAllActivities}
              onStartTimer={handleStartTimerForMaterial}
              onFilterInactiveOnly={() => setFilterInactiveOnly(!filterInactiveOnly)}
              isFilteredByInactive={filterInactiveOnly}
            />

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, subject, author, tags, document names..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                {/* Course/Subject Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  >
                    <option value="all">📚 All Subjects</option>
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  >
                    <option value="all">⚡ All Statuses</option>
                    <option value="reading">📖 In Progress</option>
                    <option value="to_read">📌 To Read</option>
                    <option value="under_review">🔍 Under Review</option>
                    <option value="completed">✅ Completed</option>
                  </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                  >
                    <option value="updated">🕒 Recent</option>
                    <option value="progress">📊 Progress</option>
                    <option value="priority">🔥 Priority</option>
                    <option value="title">🔤 Title</option>
                  </select>
                </div>
              </div>

              {/* Media Format & Inactivity Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  Filter:
                </span>

                {/* Inactivity Alert Toggle Pill */}
                <button
                  onClick={() => setFilterInactiveOnly(!filterInactiveOnly)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    filterInactiveOnly
                      ? 'bg-amber-600 text-white shadow-xs'
                      : inactivityAlerts.length > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Toggle filter to show only inactive materials requiring review"
                >
                  <BellRing className={`w-3.5 h-3.5 ${inactivityAlerts.length > 0 ? 'text-amber-700 animate-pulse' : ''}`} />
                  <span>Review Due ({inactivityAlerts.length})</span>
                </button>

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <button
                  onClick={() => setSelectedMediaType('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    selectedMediaType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Formats ({materials.length})
                </button>
                <button
                  onClick={() => setSelectedMediaType('has_docs')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    selectedMediaType === 'has_docs'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Has Documents</span>
                </button>
                <button
                  onClick={() => setSelectedMediaType('has_photos')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    selectedMediaType === 'has_photos'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Has Photos</span>
                </button>
                <button
                  onClick={() => setSelectedMediaType('has_videos')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    selectedMediaType === 'has_videos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Has Video Links</span>
                </button>
                <button
                  onClick={() => setSelectedMediaType('has_short_videos')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                    selectedMediaType === 'has_short_videos'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Has Short Videos</span>
                </button>
              </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMaterials.map((material) => {
                  const isInactive = inactiveIdSet.has(material.id);
                  const alertItem = inactivityAlerts.find((a) => a.material.id === material.id);
                  return (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      isInactiveAlert={isInactive}
                      daysInactive={alertItem ? alertItem.daysInactive : 0}
                      onOpenDetail={(m) => setSelectedMaterialDetail(m)}
                      onEdit={(m) => {
                        setEditingMaterial(m);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDeleteMaterial}
                      onShare={(m) => {
                        setMaterialToShare(m);
                        setIsShareModalOpen(true);
                      }}
                      onQuickFlashcards={(m) => {
                        setFlashcardTarget(m);
                        setIsFlashcardModalOpen(true);
                      }}
                      onUpdateProgress={handleUpdateProgress}
                      onRefreshActivity={handleRefreshActivity}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800">
                  {filterInactiveOnly ? 'No inactive materials needing review under this filter' : 'No reading materials found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {filterInactiveOnly
                    ? 'All your "To Read" and "Under Review" items have been recently reviewed or accessed.'
                    : 'Try adjusting your search query, subject, or format filters.'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedStatus('all');
                    setSelectedMediaType('all');
                    setFilterInactiveOnly(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal 1: Add / Edit Reading Material Modal */}
      <MaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveMaterial}
        initialData={editingMaterial}
      />

      {/* Modal 2: Active Recall Flashcard Deck */}
      <FlashcardsModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        materials={materials}
        singleMaterial={flashcardTarget}
      />

      {/* Modal 3: Pomodoro Study Sprint Clock */}
      <StudyTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        timerActive={timerActive}
        timerSecondsRemaining={timerSecondsRemaining}
        timerMode={timerMode}
        completedPomodoros={completedPomodoros}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        onSetMode={handleSetTimerMode}
      />

      {/* Modal 4: Share & Backup Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        materialToShare={materialToShare}
        allMaterials={materials}
        allTips={tips}
        onImportData={handleImportData}
      />

      {/* Modal 5: Student Registration & Profile Modal */}
      <StudentRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        currentProfile={studentProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="text-center md:text-left">
              <p className="font-extrabold text-slate-800 text-sm flex items-center justify-center md:justify-start gap-1.5">
                <span>Fachee United</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  This Useful app provided to you by your LOVER -Waaree Jabboo Bakar
                </span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supporting documents of any format, photos, video links, short videos, flashcards, and study tips sharing.
              </p>
            </div>

            {/* Social Links in Footer */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <a
                href="https://www.youtube.com/@Waareetube"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors"
              >
                <Youtube className="w-4 h-4 text-red-600" />
                <span>Waaree Tube💥</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <a
                href="https://www.facebook.com/Waareetube"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1877F2] font-bold text-xs border border-blue-200 transition-colors"
              >
                <Facebook className="w-4 h-4 text-[#1877F2]" />
                <span>Waaree J Bakar</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <button
                onClick={() => {
                  setSelectedMaterialDetail(null);
                  setCurrentTab('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-100" />
                <span>About Section</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>© {new Date().getFullYear()} Fachee United. Dedicated to academic excellence and peer collaboration.</p>
            <p className="font-medium text-slate-500">Facebook: Waaree J Bakar • YouTube: Waaree Tube💥</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
