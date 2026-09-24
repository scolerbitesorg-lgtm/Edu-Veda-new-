export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  hindiName?: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  status?: string;
  published?: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonVisible?: boolean;
  actionType?: 'link' | 'test' | 'subject' | 'ai' | 'notes' | 'pyq';
  actionTargetId?: string;
  order?: number;
  published?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface HomeSection {
  id: string;
  sectionId: 'banners' | 'announcements' | 'categories' | 'featuredSubjects' | 'featuredTests' | 'pyqs' | 'quickNotes' | 'custom' | string;
  title: string;
  subtitle?: string;
  order: number;
  visible: boolean;
  itemLimit?: number;
  [key: string]: any;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  badge?: string;
  link?: string;
  published?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface QuickLink {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  image?: string;
  badge?: string;
  color?: string;
  bgColor?: string;
  url?: string;
  link?: string;
  actionType?: 'link' | 'test' | 'subject' | 'ai' | 'notes' | 'pyq' | 'categories' | string;
  targetId?: string;
  order?: number;
  published?: boolean;
  [key: string]: any;
}

export interface CustomDynamicItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  icon?: string;
  badge?: string;
  buttonText?: string;
  url?: string;
  link?: string;
  actionType?: 'link' | 'test' | 'subject' | 'ai' | 'notes' | 'pyq' | 'category' | string;
  targetId?: string;
  [key: string]: any;
}

export interface CustomSection {
  id: string;
  sectionId?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  type?: 'cards' | 'banner' | 'grid' | 'list' | 'notice' | 'html' | 'custom' | string;
  order?: number;
  visible?: boolean;
  items?: CustomDynamicItem[];
  htmlContent?: string;
  buttonText?: string;
  buttonUrl?: string;
  [key: string]: any;
}

export interface Subject {
  id: string;
  name: string;
  hindiName?: string;
  description?: string;
  categoryId?: string;
  category?: string;
  icon?: string;
  image?: string;
  tag?: string;
  lessonCount?: number;
  color?: string;
  badge?: string;
  order?: number;
  published: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Topic {
  id: string;
  subjectId: string;
  subject?: string;
  title: string;
  description?: string;
  order?: number;
  published: boolean;
  badge?: string;
  lessonCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Lecture {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  instructorName?: string;
  description?: string;
  storagePath: string; // Video URL or Firebase storage path
  videoUrl?: string;
  thumbnail?: string;
  duration?: number; // duration in seconds
  order?: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Note {
  id: string;
  subjectId?: string;
  topicId?: string;
  subject?: string;
  chapter?: string;
  title: string;
  type: 'text' | 'pdf';
  content?: string; // Rich markdown or HTML text content
  storagePath?: string; // Storage path or download URL for PDF
  pdfUrl?: string;
  fileUrl?: string;
  thumbnail?: string;
  order?: number;
  published: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface PYQ {
  id: string;
  title: string;
  exam?: string;
  subject?: string;
  subjectId?: string;
  chapter?: string;
  year?: number;
  description?: string;
  pdfUrl?: string;
  fileUrl?: string;
  solutionPdfUrl?: string;
  thumbnail?: string;
  totalMarks?: number;
  duration?: number; // minutes
  published: boolean;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface MCQ {
  id: string;
  subjectId?: string;
  topicId?: string;
  subject?: string;
  chapter?: string;
  question: string;
  hindiQuestion?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, or 3
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface MockTest {
  id: string;
  title: string;
  subject?: string;
  subjectId?: string;
  description?: string;
  duration: number; // in minutes
  totalMarks?: number;
  totalQuestions?: number;
  cutoffPercentage?: number;
  negativeMarking?: number;
  tags?: string[];
  questionIds: string[];
  questions?: MCQ[];
  published: boolean;
  status?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface MockAttempt {
  id: string;
  uid: string;
  userName?: string;
  userEmail?: string;
  mockId: string;
  mockTitle?: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percentage: number;
  timeTaken: number; // seconds
  answers: Record<string, number>; // questionId -> selectedIndex
  createdAt: string;
}

export interface MCQAttempt {
  id: string;
  uid: string;
  topicId: string;
  topicTitle?: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  answers: Record<string, number>;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  uid: string;
  topicId: string;
  lectureId?: string;
  progress: number; // 0 - 100 percentage
  completed: boolean;
  videoCompleted?: boolean;
  mcqCompleted?: boolean;
  updatedAt: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface MultiAISettings {
  enableAutoFailover: boolean;
  activeOrder: string[]; // e.g. ["gemini", "openai", "groq", "anthropic"]
  gemini?: AIProviderConfig;
  openai?: AIProviderConfig;
  groq?: AIProviderConfig;
  anthropic?: AIProviderConfig;
  [key: string]: any;
}

export interface AppSettings {
  appName?: string;
  hindiName?: string;
  subTitle?: string;
  welcomeHeading?: string;
  welcomeSubtext?: string;
  tagline?: string;
  bannerImage?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerButtonText?: string;
  bannerButtonVisible?: boolean;
  logo?: string;
  supportEmail?: string;
  supportPhone?: string;
  themeColor?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  showBanner?: boolean;
  bannerNotice?: string;
  announcement?: string;
  version?: string;
  geminiApiKey?: string;
  aiApiKey?: string;
  aiMultiProviders?: MultiAISettings;
  [key: string]: any;
}

export interface SearchResultItem {
  id: string;
  title: string;
  type: 'subject' | 'topic' | 'lecture' | 'note' | 'pyq' | 'test';
  subtitle?: string;
  subjectId?: string;
  topicId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
  timestamp: Date;
}
