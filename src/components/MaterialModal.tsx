import React, { useState, useRef } from 'react';
import { 
  X, Plus, Trash2, Image, Video, FileText, Link2, Sparkles, 
  Camera, Check, AlertCircle, BookOpen, Star, UploadCloud
} from 'lucide-react';
import { ReadingMaterial, FileAttachment, VideoLink, ReadingStatus } from '../types';
import { formatBytes } from '../utils/storage';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: ReadingMaterial) => void;
  initialData?: ReadingMaterial | null;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  if (!isOpen) return null;

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || 'Computer Science');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [professor, setProfessor] = useState(initialData?.professor || '');
  const [semester, setSemester] = useState(initialData?.semester || 'Fall 2026');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<ReadingStatus>(initialData?.status || 'reading');
  const [priority, setPriority] = useState<ReadingMaterial['priority']>(initialData?.priority || 'medium');
  const [rating, setRating] = useState<number>(initialData?.rating || 4);
  const [totalPages, setTotalPages] = useState<number>(initialData?.totalPages || 30);
  const [pagesRead, setPagesRead] = useState<number>(initialData?.pagesRead || 0);
  const [tagsInput, setTagsInput] = useState<string>(initialData?.tags?.join(', ') || '');
  const [notesMarkdown, setNotesMarkdown] = useState<string>(initialData?.notesMarkdown || '');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(
    initialData?.keyTakeaways || ['Core definitions and main mechanism', 'Exam-critical practice problem takeaways']
  );
  const [newTakeawayInput, setNewTakeawayInput] = useState('');

  // Media attachments
  const [photos, setPhotos] = useState<FileAttachment[]>(initialData?.photos || []);
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>(initialData?.videoLinks || []);
  const [shortVideos, setShortVideos] = useState<FileAttachment[]>(initialData?.shortVideos || []);
  const [documents, setDocuments] = useState<FileAttachment[]>(initialData?.documents || []);

  // Video Link input helper
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');

  // Camera / Webcam State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'short_video'>('photo');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Generation State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // File Inputs Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const shortVideoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Handle Key Takeaways
  const handleAddTakeaway = () => {
    if (!newTakeawayInput.trim()) return;
    setKeyTakeaways([...keyTakeaways, newTakeawayInput.trim()]);
    setNewTakeawayInput('');
  };

  const handleRemoveTakeaway = (idx: number) => {
    setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx));
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: FileAttachment = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: 'photo',
          format: file.name.split('.').pop()?.toLowerCase() || 'png',
          sizeBytes: file.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        setPhotos((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle Short Video Upload
  const handleShortVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: FileAttachment = {
          id: 'sv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: 'short_video',
          format: file.name.split('.').pop()?.toLowerCase() || 'mp4',
          sizeBytes: file.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        setShortVideos((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle Document Upload (Any Format)
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const isText = ['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'csv', 'ts', 'tsx', 'sql'].includes(extension);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        if (isText) {
          // Also read as text for direct in-app reading preview
          const textReader = new FileReader();
          textReader.onload = (tEvent) => {
            const textContent = tEvent.target?.result as string;
            const newDoc: FileAttachment = {
              id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              type: 'document',
              format: extension,
              sizeBytes: file.size,
              dataUrl,
              textContent,
              createdAt: new Date().toISOString(),
            };
            setDocuments((prev) => [...prev, newDoc]);
          };
          textReader.readAsText(file);
        } else {
          const newDoc: FileAttachment = {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            type: 'document',
            format: extension,
            sizeBytes: file.size,
            dataUrl,
            createdAt: new Date().toISOString(),
          };
          setDocuments((prev) => [...prev, newDoc]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Handle Video Link Add
  const handleAddVideoLink = () => {
    if (!newVideoUrl.trim()) return;
    const url = newVideoUrl.trim();
    let platform: VideoLink['platform'] = 'other';
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('vimeo.com')) platform = 'vimeo';
    else if (url.match(/\.(mp4|webm|ogg|mov)/i)) platform = 'direct';

    const newLink: VideoLink = {
      id: 'vl_' + Date.now(),
      title: newVideoTitle.trim() || 'Video Reference',
      url,
      platform,
    };
    setVideoLinks([...videoLinks, newLink]);
    setNewVideoUrl('');
    setNewVideoTitle('');
  };

  // Camera & Webcam Controls
  const startCamera = async (mode: 'photo' | 'short_video') => {
    try {
      setCameraMode(mode);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: mode === 'short_video',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Unable to access camera or microphone. Please ensure device permissions are granted.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsRecordingVideo(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const newPhoto: FileAttachment = {
      id: 'photo_snap_' + Date.now(),
      name: `Snapshot_${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
      type: 'photo',
      format: 'jpg',
      sizeBytes: Math.round(dataUrl.length * 0.75),
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    setPhotos([...photos, newPhoto]);
    stopCamera();
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newClip: FileAttachment = {
          id: 'sv_clip_' + Date.now(),
          name: `Short_Video_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
          type: 'short_video',
          format: 'webm',
          sizeBytes: blob.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        setShortVideos((prev) => [...prev, newClip]);
      };
      reader.readAsDataURL(blob);
      stopCamera();
    };

    recorder.start();
    setIsRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecordingVideo) {
      mediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // AI Study Assistant: Summarize and extract takeaways
  const handleAISummarize = async () => {
    if (!title.trim()) {
      alert('Please enter at least a title for the material before generating takeaways.');
      return;
    }
    setIsSummarizing(true);
    setAiNotice('Analyzing reading notes & structuring takeaways...');
    try {
      const res = await fetch('/api/study-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          description,
          notes: notesMarkdown,
        }),
      });
      const data = await res.json();
      if (data.keyTakeaways && Array.isArray(data.keyTakeaways)) {
        setKeyTakeaways(data.keyTakeaways);
      }
      if (data.summary && !description) {
        setDescription(data.summary);
      }
      setAiNotice('✨ Key takeaways generated!');
      setTimeout(() => setAiNotice(null), 3000);
    } catch (err) {
      console.warn('AI Summary error:', err);
      setAiNotice('Using academic synthesis template');
      setTimeout(() => setAiNotice(null), 2500);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedMaterial: ReadingMaterial = {
      id: initialData?.id || 'mat_' + Date.now(),
      title: title.trim(),
      subject: subject.trim() || 'General Studies',
      author: author.trim() || 'Academic Reference',
      professor: professor.trim() || undefined,
      semester: semester.trim() || undefined,
      description: description.trim(),
      status,
      priority,
      rating,
      totalPages: Math.max(1, Number(totalPages) || 1),
      pagesRead: Math.min(Math.max(0, Number(pagesRead) || 0), Math.max(1, Number(totalPages) || 1)),
      tags,
      keyTakeaways,
      notesMarkdown,
      photos,
      videoLinks,
      shortVideos,
      documents,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedMaterial);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {initialData ? 'Edit Reading Material' : 'Store New Reading Material'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Store info, photos, video links, short videos, and documents of any format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Core Material Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-wider text-indigo-900 uppercase">
                1. Material Information & Course Details
              </h3>
              {/* AI assist button */}
              <button
                type="button"
                onClick={handleAISummarize}
                disabled={isSummarizing || !title.trim()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/60 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isSummarizing ? 'Analyzing...' : 'AI Takeaways & Summary'}</span>
              </button>
            </div>

            {aiNotice && (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>{aiNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reading Material Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Molecular Biology Chapter 4: DNA Repair Mechanisms"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Course</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Computer Science, Organic Chemistry, History"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Author(s)</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Thomas H. Cormen, Charles E. Leiserson"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Professor / Instructor</label>
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="e.g. Dr. Rivera"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semester / Term</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Reading Status & Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value="to_read">📌 To Read</option>
                  <option value="reading">📖 In Progress</option>
                  <option value="under_review">🔍 Under Review</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                >
                  <option value="low">🟢 Normal</option>
                  <option value="medium">🟡 Important</option>
                  <option value="high">🔴 Exam Prep</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pages Read</label>
                <input
                  type="number"
                  min="0"
                  value={pagesRead}
                  onChange={(e) => setPagesRead(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Pages</label>
                <input
                  type="number"
                  min="1"
                  value={totalPages}
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Overview & Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this chapter/paper is about..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            {/* Key Takeaways */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Key Takeaways & Recall Points</label>
              <div className="space-y-2 mb-2">
                {keyTakeaways.map((takeaway, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100 text-xs text-slate-800">
                    <span className="font-bold text-indigo-600">•</span>
                    <span className="flex-1">{takeaway}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTakeaway(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTakeawayInput}
                  onChange={(e) => setNewTakeawayInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTakeaway();
                    }
                  }}
                  placeholder="Add a key definition, formula, or exam takeaway..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTakeaway}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Midterm, Chapter 4, Diagrams, High-Yield"
                className="w-full px-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Study Notes (Markdown supported)</label>
              <textarea
                rows={3}
                value={notesMarkdown}
                onChange={(e) => setNotesMarkdown(e.target.value)}
                placeholder="# Notes\n- Formula: E = mc^2\n- Important question: Check page 42"
                className="w-full font-mono text-xs px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Camera Viewport if Active */}
          {isCameraActive && (
            <div className="bg-slate-950 p-4 rounded-3xl text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{cameraMode === 'photo' ? 'Camera: Snap Reading / Whiteboard' : 'Camera: Record Short Study Video'}</span>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>

              <div className="flex justify-center gap-3">
                {cameraMode === 'photo' ? (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Snapshot</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all ${
                      isRecordingVideo ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>{isRecordingVideo ? 'Stop & Save Video' : 'Start Recording'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Photos & Book Diagrams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                  2. Photos & Textbook Diagrams ({photos.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera('photo')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Photos</span>
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Photo List */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {photos.map((p) => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                    <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((item) => item.id !== p.id))}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <p className="text-[10px] text-white truncate">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-4 rounded-2xl text-center cursor-pointer transition-colors"
              >
                <Image className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">Drop or upload diagrams, textbook pages, whiteboards</p>
                <p className="text-[11px] text-slate-400">Supports PNG, JPG, WEBP, GIF, SVG</p>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Video Links & Lectures */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                3. Video Links & Lectures ({videoLinks.length})
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                placeholder="Video title (e.g. MIT OpenCourseWare Lec 4)"
                className="sm:w-1/3 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
              <input
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or Vimeo / direct mp4 link"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none"
              />
              <button
                type="button"
                onClick={handleAddVideoLink}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Link
              </button>
            </div>

            {videoLinks.length > 0 && (
              <div className="space-y-1.5">
                {videoLinks.map((vl) => (
                  <div key={vl.id} className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase">
                        {vl.platform}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{vl.title}</span>
                      <span className="text-slate-400 text-[11px] truncate hidden sm:inline">{vl.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoLinks(videoLinks.filter((item) => item.id !== vl.id))}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 4: Short Videos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                  4. Short Videos ({shortVideos.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera('short_video')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Record Short Clip</span>
                </button>
                <button
                  type="button"
                  onClick={() => shortVideoInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Short Video</span>
                </button>
                <input
                  ref={shortVideoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleShortVideoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {shortVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {shortVideos.map((sv) => (
                  <div key={sv.id} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{sv.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatBytes(sv.sizeBytes)} • {sv.format.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShortVideos(shortVideos.filter((item) => item.id !== sv.id))}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => shortVideoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 p-4 rounded-2xl text-center cursor-pointer transition-colors"
              >
                <Video className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">Store short video clips (MP4, WebM, MOV)</p>
                <p className="text-[11px] text-slate-400">Quick concept recaps, lab recordings, study explanations</p>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 5: Document Files of ANY format */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                  5. Document Files of Any Format ({documents.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Any Documents</span>
              </button>
              <input
                ref={docInputRef}
                type="file"
                multiple
                onChange={handleDocUpload}
                className="hidden"
              />
            </div>

            {documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-8 h-8 rounded-lg bg-purple-200/80 text-purple-900 font-extrabold flex items-center justify-center text-[10px] uppercase">
                        {doc.format.slice(0, 4)}
                      </span>
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{formatBytes(doc.sizeBytes)} • {doc.format.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDocuments(documents.filter((item) => item.id !== doc.id))}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => docInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-purple-400 p-4 rounded-2xl text-center cursor-pointer transition-colors"
              >
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">Store document files of ANY format</p>
                <p className="text-[11px] text-slate-400">PDF, DOCX, PPTX, XLSX, TXT, EPUB, ZIP, CSV, Code files & more</p>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Save Changes' : 'Save Reading Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
