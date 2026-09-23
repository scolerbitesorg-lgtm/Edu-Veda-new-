import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  BookOpen,
  Book,
  GraduationCap,
  Video,
  Play,
  Film,
  FileText,
  File,
  Award,
  HelpCircle,
  Compass,
  Globe,
  Layers,
  Cpu,
  Code,
  Atom,
  Calculator,
  Brain,
  Flame,
  Sparkles,
  Bookmark,
  Target,
  Shield,
  Scale,
  Palette,
  Music,
  Heart,
  Activity,
  Zap,
  Folder,
  FolderOpen,
  Library,
  Briefcase,
  Clock,
  User,
  Users,
  PenTool,
  Feather,
  Newspaper,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';

interface UniversalIconProps {
  icon?: string | null;
  image?: string | null;
  name?: string;
  fallbackText?: string;
  className?: string;
  imgClassName?: string;
  size?: number | string;
}

// Map common lowercase / alias names to Lucide icons
const iconLookup: Record<string, React.ComponentType<{ className?: string; size?: number | string }>> = {
  bookopen: BookOpen,
  book_open: BookOpen,
  'book-open': BookOpen,
  book: Book,
  books: Library,
  library: Library,
  graduationcap: GraduationCap,
  'graduation-cap': GraduationCap,
  graduation_cap: GraduationCap,
  education: GraduationCap,
  video: Video,
  play: Play,
  film: Film,
  filetext: FileText,
  'file-text': FileText,
  file_text: FileText,
  file: File,
  note: FileText,
  notes: FileText,
  document: FileText,
  award: Award,
  trophy: Award,
  quiz: HelpCircle,
  test: Award,
  helpcircle: HelpCircle,
  'help-circle': HelpCircle,
  help: HelpCircle,
  compass: Compass,
  globe: Globe,
  map: Globe,
  earth: Globe,
  geography: Globe,
  layers: Layers,
  curriculum: Layers,
  syllabus: Layers,
  cpu: Cpu,
  computer: Cpu,
  code: Code,
  tech: Code,
  atom: Atom,
  physics: Atom,
  science: Atom,
  calculator: Calculator,
  math: Calculator,
  maths: Calculator,
  mathematics: Calculator,
  brain: Brain,
  reasoning: Brain,
  mind: Brain,
  flame: Flame,
  fire: Flame,
  trending: Flame,
  sparkles: Sparkles,
  ai: Sparkles,
  bookmark: Bookmark,
  target: Target,
  goal: Target,
  shield: Shield,
  polity: Shield,
  constitution: Scale,
  scale: Scale,
  law: Scale,
  palette: Palette,
  art: Palette,
  music: Music,
  heart: Heart,
  activity: Activity,
  biology: Activity,
  zap: Zap,
  energy: Zap,
  folder: Folder,
  folderopen: FolderOpen,
  briefcase: Briefcase,
  economy: Briefcase,
  economics: Briefcase,
  clock: Clock,
  history: Clock,
  user: User,
  users: Users,
  pentool: PenTool,
  'pen-tool': PenTool,
  feather: Feather,
  hindi: Feather,
  english: BookOpen,
  newspaper: Newspaper,
  current_affairs: Newspaper,
  gk: Newspaper,
  lightbulb: Lightbulb,
  idea: Lightbulb,
  trendingup: TrendingUp,
};

// Check if a string is an emoji
function isEmojiString(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  // Regex for common emojis
  return /\p{Extended_Pictographic}/u.test(trimmed) && trimmed.length <= 8;
}

// Check if a string is an SVG markup
function isSvgMarkup(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim().toLowerCase();
  return trimmed.startsWith('<svg') && trimmed.endsWith('</svg>');
}

// Check if a string is a valid web URL or data image
function isImageUrl(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

export const UniversalIcon: React.FC<UniversalIconProps> = ({
  icon,
  image,
  name,
  fallbackText,
  className = 'w-6 h-6',
  imgClassName = 'w-full h-full object-contain',
  size,
}) => {
  const [imgError, setImgError] = useState(false);

  const rawSource = (image || icon || '').trim();

  // 1. Direct Image URL (HTTP/HTTPS/Data URL/Local path)
  if (rawSource && isImageUrl(rawSource) && !imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
        <img
          src={rawSource}
          alt={name || 'Icon'}
          className={imgClassName}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 2. Raw SVG code
  if (rawSource && isSvgMarkup(rawSource)) {
    return (
      <div
        className={`flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${className}`}
        dangerouslySetInnerHTML={{ __html: rawSource }}
      />
    );
  }

  // 3. Emoji string (e.g. 📚, 🏛️, 🌍, 🧪, 📐)
  if (rawSource && isEmojiString(rawSource)) {
    return (
      <span
        className="inline-flex items-center justify-center leading-none text-2xl select-none"
        role="img"
        aria-label={name || 'icon'}
      >
        {rawSource}
      </span>
    );
  }

  // 4. Lucide icon name match (e.g. "BookOpen", "book", "GraduationCap", "Cpu")
  if (rawSource) {
    const cleaned = rawSource.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    
    // Check in lookup table
    let MatchedIcon = iconLookup[cleaned];

    // If not in direct lookup, search in all LucideIcons
    if (!MatchedIcon) {
      const pascalCaseKey = Object.keys(LucideIcons).find(
        k => k.toLowerCase() === cleaned
      );
      if (pascalCaseKey) {
        MatchedIcon = (LucideIcons as any)[pascalCaseKey];
      }
    }

    if (MatchedIcon) {
      return <MatchedIcon className={className} size={size} />;
    }
  }

  // 5. Fallback based on Subject/Topic/Lecture Title or Initial
  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes('hist') || lower.includes('इतिहास')) return <Clock className={className} size={size} />;
    if (lower.includes('geog') || lower.includes('भूगोल')) return <Globe className={className} size={size} />;
    if (lower.includes('polity') || lower.includes('constitution') || lower.includes('राजव्यवस्था')) return <Scale className={className} size={size} />;
    if (lower.includes('science') || lower.includes('विज्ञान') || lower.includes('physics') || lower.includes('chemistry')) return <Atom className={className} size={size} />;
    if (lower.includes('math') || lower.includes('गणित') || lower.includes('संख्या')) return <Calculator className={className} size={size} />;
    if (lower.includes('reasoning') || lower.includes('तर्कशक्ति')) return <Brain className={className} size={size} />;
    if (lower.includes('economy') || lower.includes('अर्थशास्त्र')) return <Briefcase className={className} size={size} />;
    if (lower.includes('hindi') || lower.includes('हिन्दी')) return <Feather className={className} size={size} />;
    if (lower.includes('english') || lower.includes('अंग्रेजी')) return <BookOpen className={className} size={size} />;
    if (lower.includes('computer') || lower.includes('कंप्यूटर')) return <Cpu className={className} size={size} />;
    if (lower.includes('current') || lower.includes('gk') || lower.includes('ज्ञान')) return <Newspaper className={className} size={size} />;
  }

  // 6. Generic Text Initial / Default Fallback
  if (fallbackText) {
    return (
      <span className="font-extrabold text-xs uppercase tracking-tight">
        {fallbackText.slice(0, 2)}
      </span>
    );
  }

  return <BookOpen className={className} size={size} />;
};
