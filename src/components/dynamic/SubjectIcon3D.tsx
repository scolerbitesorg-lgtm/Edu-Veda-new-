import React, { useState } from 'react';
import type { Subject } from '../../types';
import { UniversalIcon } from '../UniversalIcon';

interface SubjectIcon3DProps {
  subject: Subject;
  index?: number;
  className?: string;
}

export const SubjectIcon3D: React.FC<SubjectIcon3DProps> = ({
  subject,
  index = 1,
  className = 'w-10 h-10',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Check all possible admin fields for icons/images
  const customSource = (
    subject.image ||
    subject.icon ||
    subject.thumbnail ||
    (subject as any).logo ||
    (subject as any).iconUrl
  )?.trim();

  // If admin provided a custom image URL and it hasn't failed
  if (
    customSource &&
    !imgFailed &&
    (customSource.startsWith('http://') ||
      customSource.startsWith('https://') ||
      customSource.startsWith('data:image/') ||
      customSource.startsWith('blob:') ||
      customSource.startsWith('/'))
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-50">
        <img
          src={customSource}
          alt={subject.name}
          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // If admin specified an emoji, SVG, or a Lucide icon name (e.g. "GraduationCap", "BookOpen", "Atom", "📚")
  if (
    customSource &&
    !customSource.startsWith('http') &&
    customSource.length > 0
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <UniversalIcon
          icon={customSource}
          name={subject.name}
          className={className}
          imgClassName="w-full h-full object-contain"
        />
      </div>
    );
  }

  const name = (subject.name || '').toLowerCase();
  const id = (subject.id || '').toLowerCase();
  const hindiName = (subject.hindiName || '').toLowerCase();

  // 1. History / इतिहास (Golden Ancient Rolled Scroll)
  if (
    id.includes('hist') ||
    name.includes('hist') ||
    name.includes('इतिहास') ||
    hindiName.includes('इतिहास')
  ) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="32" cy="56" rx="20" ry="3.5" fill="#000000" fillOpacity="0.08" />
        <path
          d="M18 16C18 13.7909 19.7909 12 22 12H44C45.1046 12 46 12.8954 46 14V46C46 48.2091 44.2091 50 42 50H20C18.8954 50 18 49.1046 18 48V16Z"
          fill="url(#scrollBody)"
        />
        <path d="M24 22H40" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M24 28H38" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M24 34H40" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        <path d="M24 40H32" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        <rect x="15" y="10" width="34" height="7" rx="3.5" fill="url(#rollTop)" stroke="#92400E" strokeWidth="1" />
        <ellipse cx="16.5" cy="13.5" rx="2" ry="3" fill="#D97706" />
        <ellipse cx="47.5" cy="13.5" rx="2" ry="3" fill="#FDE68A" />
        <rect x="13" y="12" width="3" height="3" rx="1.5" fill="#78350F" />
        <rect x="48" y="12" width="3" height="3" rx="1.5" fill="#78350F" />
        <rect x="17" y="47" width="34" height="7" rx="3.5" fill="url(#rollTop)" stroke="#92400E" strokeWidth="1" />
        <ellipse cx="18.5" cy="50.5" rx="2" ry="3" fill="#D97706" />
        <ellipse cx="49.5" cy="50.5" rx="2" ry="3" fill="#FDE68A" />
        <rect x="15" y="49" width="3" height="3" rx="1.5" fill="#78350F" />
        <rect x="50" y="49" width="3" height="3" rx="1.5" fill="#78350F" />
        <defs>
          <linearGradient id="scrollBody" x1="18" y1="12" x2="46" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF3C7" />
            <stop offset="0.5" stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="rollTop" x1="15" y1="10" x2="49" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="0.3" stopColor="#F59E0B" />
            <stop offset="0.8" stopColor="#D97706" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 2. Geography / भूगोल (3D Earth Globe)
  if (
    id.includes('geog') ||
    name.includes('geog') ||
    name.includes('भूगोल') ||
    hindiName.includes('भूगोल')
  ) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="32" cy="57" rx="18" ry="4" fill="#000000" fillOpacity="0.1" />
        <circle cx="32" cy="32" r="23" fill="url(#oceanGrad)" />
        <path
          d="M17 22C19 20 23 21 24 24C24.5 25.5 26 27 24.5 29C23 31 22 34 23 37C23.5 39 21 40 20 37C19 34 16 32 16 28C16 25 15.5 23.5 17 22Z"
          fill="#22C55E"
        />
        <path
          d="M23 38C26 38 28 41 27 44C26 47 24 50 22 51C21 50 20 48 21 45C22 42 21 40 23 38Z"
          fill="#16A34A"
        />
        <path
          d="M32 15C34 14 37 15 38 18C37 20 35 22 36 24C37 26 39 28 38 31C37 35 38 40 37 44C36 47 33 46 32 43C31 40 30 36 31 32C32 28 31 25 30 22C29 19 30 16 32 15Z"
          fill="#22C55E"
        />
        <path
          d="M40 16C43 16 48 18 50 22C51 25 49 28 47 30C45 32 44 35 46 38C48 41 45 44 43 42C41 40 40 36 41 33C42 30 39 28 38 25C38 22 38 18 40 16Z"
          fill="#16A34A"
        />
        <circle cx="48" cy="45" r="3.5" fill="#22C55E" />
        <circle cx="32" cy="32" r="23" fill="url(#globeShine)" />
        <ellipse cx="25" cy="22" rx="10" ry="6" fill="#FFFFFF" fillOpacity="0.25" transform="rotate(-30 25 22)" />
        <defs>
          <linearGradient id="oceanGrad" x1="15" y1="12" x2="49" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="0.4" stopColor="#0284C7" />
            <stop offset="1" stopColor="#1E40AF" />
          </linearGradient>
          <radialGradient id="globeShine" cx="0.3" cy="0.3" r="0.7" fx="0.25" fy="0.25">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  // 3. Indian Polity & Constitution / राजव्यवस्था
  if (
    id.includes('polity') ||
    name.includes('polity') ||
    name.includes('constitution') ||
    name.includes('राजव्यवस्था') ||
    name.includes('संविधान') ||
    hindiName.includes('राजव्यवस्था')
  ) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="32" cy="56" rx="19" ry="3.5" fill="#000000" fillOpacity="0.08" />
        <rect x="16" y="14" width="32" height="38" rx="4" fill="url(#polityBookCover)" />
        <path d="M16 14C16 14 18 15 20 15V52C18 52 16 51 16 51V14Z" fill="#1E3A8A" />
        <rect x="18" y="50" width="30" height="3" rx="1.5" fill="#E2E8F0" />
        <rect x="22" y="19" width="20" height="27" rx="2" fill="url(#goldEmblemBg)" stroke="#F59E0B" strokeWidth="1.2" />
        <line x1="32" y1="23" x2="32" y2="41" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="27" x2="39" y2="27" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="28" x2="24" y2="34" stroke="#B45309" strokeWidth="1.2" />
        <line x1="30" y1="28" x2="28" y2="34" stroke="#B45309" strokeWidth="1.2" />
        <path d="M23 34C24 36.5 28 36.5 29 34H23Z" fill="#D97706" />
        <line x1="34" y1="28" x2="36" y2="34" stroke="#B45309" strokeWidth="1.2" />
        <line x1="38" y1="28" x2="40" y2="34" stroke="#B45309" strokeWidth="1.2" />
        <path d="M35 34C36 36.5 40 36.5 41 34H35Z" fill="#D97706" />
        <defs>
          <linearGradient id="polityBookCover" x1="16" y1="14" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="goldEmblemBg" x1="22" y1="19" x2="42" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF3C7" />
            <stop offset="0.6" stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 4. Science / विज्ञान (3D Glowing Conical Chemistry Flask)
  if (
    id.includes('sci') ||
    name.includes('sci') ||
    name.includes('विज्ञान') ||
    name.includes('physics') ||
    name.includes('chem') ||
    hindiName.includes('विज्ञान')
  ) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <ellipse cx="32" cy="57" rx="18" ry="3.5" fill="#000000" fillOpacity="0.08" />
        <path
          d="M27 12H37V22L49 46C50.5 49 48.5 53 45 53H19C15.5 53 13.5 49 15 46L27 22V12Z"
          fill="url(#glassGrad)"
          stroke="#93C5FD"
          strokeWidth="1.5"
        />
        <path d="M25 10H39" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M17.5 45L22 36C25 35 39 35 42 36L46.5 45C48 48 46 51.5 43 51.5H21C18 51.5 16 48 17.5 45Z"
          fill="url(#liquidGrad)"
        />
        <circle cx="26" cy="44" r="2" fill="#FFFFFF" fillOpacity="0.7" />
        <circle cx="34" cy="46" r="3" fill="#FFFFFF" fillOpacity="0.6" />
        <circle cx="37" cy="40" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
        <path d="M28 24L18 44" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
        <defs>
          <linearGradient id="glassGrad" x1="16" y1="12" x2="48" y2="53" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EFF6FF" stopOpacity="0.6" />
            <stop offset="0.5" stopColor="#DBEAFE" stopOpacity="0.3" />
            <stop offset="1" stopColor="#BFDBFE" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="liquidGrad" x1="16" y1="36" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" />
            <stop offset="0.5" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#4C1D95" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 5. Default Universal Icon based on index or title
  return (
    <div className="w-full h-full flex items-center justify-center">
      <UniversalIcon
        icon={subject.icon}
        name={subject.name}
        className={className}
      />
    </div>
  );
};
