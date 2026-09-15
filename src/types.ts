export type ReadingStatus = 'to_read' | 'reading' | 'under_review' | 'completed';

export type MediaType = 'photo' | 'video_link' | 'short_video' | 'document';

export interface FileAttachment {
  id: string;
  name: string;
  type: MediaType;
  format: string; // e.g., 'pdf', 'docx', 'png', 'mp4', 'pptx', 'zip', etc.
  sizeBytes: number;
  dataUrl?: string; // base64 or object URL for preview and download
  textContent?: string; // for text-based docs preview
  createdAt: string;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'vimeo' | 'direct' | 'other';
  notes?: string;
}

export interface ReadingMaterial {
  id: string;
  title: string;
  subject: string; // e.g. "Computer Science", "Biology", "Calculus"
  author: string;
  professor?: string;
  semester?: string;
  description: string;
  status: ReadingStatus;
  priority: 'low' | 'medium' | 'high';
  rating: number; // 1-5 stars
  totalPages: number;
  pagesRead: number;
  tags: string[];
  keyTakeaways: string[];
  notesMarkdown?: string;
  
  // Media items
  photos: FileAttachment[];
  videoLinks: VideoLink[];
  shortVideos: FileAttachment[];
  documents: FileAttachment[];

  createdAt: string;
  updatedAt: string;
}

export interface VoiceMessage {
  id: string;
  audioUrl: string; // Base64 data URI or blob URL
  durationSeconds: number;
  recordedAt: string;
  fileSizeFormatted?: string;
  waveform?: number[]; // Array of 0..1 amplitude values for stylized waveform rendering
}

export interface StudyTip {
  id: string;
  title: string;
  authorName: string;
  category: 'active_recall' | 'time_management' | 'note_taking' | 'exam_prep' | 'wellness' | 'resource_sharing';
  content: string;
  tags: string[];
  likes: number;
  userLiked?: boolean;
  createdAt: string;
  voiceMessage?: VoiceMessage;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  sourceMaterialTitle?: string;
}

export type EducationLevelType = 'university' | 'high_school';

export type UniversityYear = 
  | 'Year 1 (Freshman)'
  | 'Year 2 (Sophomore)'
  | 'Year 3 (Junior)'
  | 'Year 4 (Senior)'
  | 'Year 5+ (Extended)'
  | "Master's Degree"
  | 'PhD / Doctoral Candidate';

export type HighSchoolGrade = 
  | 'Grade 9 (Freshman)'
  | 'Grade 10 (Sophomore)'
  | 'Grade 11 (Junior)'
  | 'Grade 12 (Senior)'
  | 'Grade 7-8 (Junior High)';

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  educationLevel: EducationLevelType;
  universityYear?: UniversityYear;
  universityName?: string;
  majorFaculty?: string;
  highSchoolGrade?: HighSchoolGrade;
  highSchoolName?: string;
  academicStream?: string;
  primarySubjects?: string[];
  studentIdNumber?: string;
  registeredAt: string;
  updatedAt?: string;
}

export interface DailyStudyGoal {
  date: string; // YYYY-MM-DD
  targetPages: number;
  pagesCompleted: number;
  targetMaterials: number;
  materialsReviewedIds: string[];
  streakDays: number;
  lastAchievedDate?: string;
  history?: {
    [date: string]: {
      pages: number;
      targetPages: number;
      materialsCount: number;
      targetMaterials: number;
      achieved: boolean;
    };
  };
}
