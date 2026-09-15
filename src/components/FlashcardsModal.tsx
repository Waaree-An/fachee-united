import React, { useState } from 'react';
import { Layers, X, Check, RotateCcw, Award, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { ReadingMaterial, Flashcard } from '../types';
import confetti from 'canvas-confetti';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: ReadingMaterial[];
  singleMaterial?: ReadingMaterial | null;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  materials,
  singleMaterial,
}) => {
  if (!isOpen) return null;

  // Build flashcards from key takeaways
  const targetMaterials = singleMaterial ? [singleMaterial] : materials;
  const cards: Flashcard[] = targetMaterials.flatMap((m) =>
    m.keyTakeaways.map((takeaway, idx) => ({
      id: `${m.id}_card_${idx}`,
      front: `Key Concept #${idx + 1} in ${m.title}`,
      back: takeaway,
      sourceMaterialTitle: m.title,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState({ mastered: 0, review: 0 });
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = (mastered: boolean) => {
    setScore((prev) => ({
      mastered: mastered ? prev.mastered + 1 : prev.mastered,
      review: !mastered ? prev.review + 1 : prev.review,
    }));

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setScore({ mastered: 0, review: 0 });
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {singleMaterial ? `Flashcards: ${singleMaterial.title}` : 'Active Recall Flashcard Deck'}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {cards.length} cards generated from key reading takeaways
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {cards.length === 0 ? (
          <div className="text-center py-10">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No flashcards found</p>
            <p className="text-xs text-slate-400 mt-1">
              Add key takeaways to your reading materials to auto-generate study flashcards!
            </p>
          </div>
        ) : isFinished ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">Review Completed!</h4>
              <p className="text-xs text-slate-500 mt-1">
                You tested all {cards.length} cards from your reading materials.
              </p>
            </div>

            <div className="flex justify-center gap-4 py-2">
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
                <p className="text-xs text-emerald-800 font-bold">Mastered</p>
                <p className="text-xl font-black text-emerald-600">{score.mastered}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl">
                <p className="text-xs text-amber-800 font-bold">Need Review</p>
                <p className="text-xl font-black text-amber-600">{score.review}</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
              >
                Close Deck
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <span className="font-mono text-indigo-600">{Math.round(((currentIndex) / cards.length) * 100)}% complete</span>
            </div>

            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
            </div>

            {/* Flashcard Body */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[220px] p-6 sm:p-8 rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-amber-50/30 flex flex-col justify-between items-center text-center cursor-pointer shadow-xs hover:border-indigo-400 transition-all group"
            >
              <div className="w-full flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <span className="truncate max-w-[200px] text-indigo-700">{currentCard?.sourceMaterialTitle}</span>
                <span className="text-indigo-600">{isFlipped ? 'Answer Side' : 'Question Side'}</span>
              </div>

              <div className="my-auto py-4">
                {isFlipped ? (
                  <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentCard?.back}
                  </p>
                ) : (
                  <p className="text-base sm:text-lg font-bold text-indigo-950 leading-relaxed">
                    {currentCard?.front}
                  </p>
                )}
              </div>

              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600">
                (Click to {isFlipped ? 'hide answer' : 'flip & reveal'})
              </span>
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleNext(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Need Review</span>
              </button>

              <button
                onClick={() => handleNext(true)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Mastered It!</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
