import type { MCQ } from '../types';

/**
 * Extracts and formats the exam source/date tag from an MCQ object.
 * Supports various field patterns used across Admin panels:
 * - Direct tags: examTag, askedIn, examSource, source, pyqTag, examDate, date, tag (e.g. "SSC CGL Mains 2018", "Cgl, mains 2018", "UPSC Prelims 2021")
 * - Structured fields: exam, examName, shift, tier, stage, paper, year, examYear, etc.
 */
export function getExamSourceTag(mcq?: Partial<MCQ> | any): string | null {
  if (!mcq) return null;

  // 1. Direct explicit tags
  const directFields = [
    mcq.examTag,
    mcq.exam_tag,
    mcq.askedIn,
    mcq.asked_in,
    mcq.examSource,
    mcq.exam_source,
    mcq.source,
    mcq.pyqTag,
    mcq.pyq_tag,
    mcq.examInfo,
    mcq.exam_info,
    mcq.examDate,
    mcq.exam_date,
    mcq.tag,
  ];

  for (const field of directFields) {
    if (field && typeof field === 'string' && field.trim()) {
      return field.trim();
    }
  }

  // 2. Structured combinations of exam, shift/stage/tier, and year
  const exam = (mcq.exam || mcq.examName || mcq.exam_name || mcq.testName || '').toString().trim();
  const shift = (mcq.shift || mcq.tier || mcq.stage || mcq.paper || '').toString().trim();
  const year = (mcq.year || mcq.examYear || mcq.exam_year || mcq.pyqYear || '').toString().trim();

  const parts = [exam, shift, year].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }

  return null;
}

