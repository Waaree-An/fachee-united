import React, { useState, useRef } from 'react';
import { 
  X, Share2, Copy, Check, Download, Upload, 
  FileText, CheckCircle2, BookOpen, AlertCircle
} from 'lucide-react';
import { ReadingMaterial, StudyTip } from '../types';
import confetti from 'canvas-confetti';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToShare?: ReadingMaterial | null;
  allMaterials: ReadingMaterial[];
  allTips: StudyTip[];
  onImportData: (materials: ReadingMaterial[], tips?: StudyTip[]) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  materialToShare,
  allMaterials,
  allTips,
  onImportData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'card' | 'export' | 'import'>(
    materialToShare ? 'card' : 'export'
  );
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Generate formatted text for sharing
  const generateShareText = (m: ReadingMaterial) => {
    return `📚 [Fachee United] Reading Material Share:
Title: ${m.title}
Course/Subject: ${m.subject} ${m.semester ? `(${m.semester})` : ''}
Author: ${m.author}
Status: ${m.status.toUpperCase()} • Progress: ${m.pagesRead}/${m.totalPages} pages

${m.description ? `Overview: ${m.description}\n` : ''}
Key Exam Takeaways:
${m.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Media Attached:
• Photos: ${m.photos.length}
• Video Links: ${m.videoLinks.length}
• Short Videos: ${m.shortVideos.length}
• Documents: ${m.documents.length} (${m.documents.map(d => d.name).join(', ')})

Shared from Fachee United Student Hub`;
  };

  const shareText = materialToShare ? generateShareText(materialToShare) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export full JSON packet
  const handleExportJSON = () => {
    const bundle = {
      app: 'Fachee United',
      version: '1.0',
      exportDate: new Date().toISOString(),
      materials: allMaterials,
      tips: allTips,
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fachee_United_Study_Packet_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 50, spread: 60 });
  };

  // Import JSON packet
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.materials)) {
          onImportData(parsed.materials, Array.isArray(parsed.tips) ? parsed.tips : undefined);
          setImportStatus(`Successfully imported ${parsed.materials.length} reading materials!`);
          confetti({ particleCount: 70, spread: 70 });
        } else if (Array.isArray(parsed)) {
          onImportData(parsed);
          setImportStatus(`Successfully imported ${parsed.length} reading materials!`);
          confetti({ particleCount: 70, spread: 70 });
        } else {
          throw new Error('Invalid JSON format for Fachee United');
        }
      } catch (err) {
        setImportStatus('Error importing file: invalid JSON schema.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Share & Exchange Study Materials
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
          {materialToShare && (
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === 'card' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Study Card
            </button>
          )}
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'export' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Export All Library
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'import' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Import Classmate Packet
          </button>
        </div>

        {/* Tab 1: Share Single Material Card */}
        {activeTab === 'card' && materialToShare && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Copy a formatted summary of <span className="font-bold text-slate-900">{materialToShare.title}</span> to share in your study group chat (WhatsApp, Discord, Teams, or Email):
            </p>

            <pre className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-mono text-slate-800 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {shareText}
            </pre>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Study Card to Clipboard'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Export All Library */}
        {activeTab === 'export' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Export Full Fachee United Bundle
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Downloads your entire reading materials collection, attached documents, photos, video links, notes, and study tips as a standalone `.json` backup file.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 flex justify-around">
              <div>
                <span className="font-black text-indigo-700 font-mono text-sm">{allMaterials.length}</span>
                <p className="text-[10px] text-slate-400">Materials</p>
              </div>
              <div>
                <span className="font-black text-amber-700 font-mono text-sm">{allTips.length}</span>
                <p className="text-[10px] text-slate-400">Study Tips</p>
              </div>
            </div>

            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Fachee Study Packet (.json)</span>
            </button>
          </div>
        )}

        {/* Tab 3: Import Classmate Packet */}
        {activeTab === 'import' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Import Study Packet from Classmate
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Load a Fachee United JSON bundle exported by a friend or professor to merge new reading materials into your library.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Choose JSON File to Import</span>
            </button>

            {importStatus && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                {importStatus}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
