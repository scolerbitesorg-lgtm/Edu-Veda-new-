/**
 * Unified AI Service Gateway
 * All AI features in the app route through `aiClient.request()`.
 */

import { aiClient, type AIRequestParams, type AIResponse } from './aiClient';
export { aiClient, type AIRequestParams, type AIResponse };

export interface VedaAiResponse {
  configured: boolean;
  reply: string;
  provider?: string;
  model?: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

/**
 * 1. AI Tutor / Veda AI Chat
 */
export async function askVedaAi(
  message: string,
  history: ChatHistoryItem[] = []
): Promise<VedaAiResponse> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return {
      configured: true,
      reply: 'Please ask a study question or topic you would like explained.',
      provider: 'built-in',
    };
  }

  const res = await aiClient.request<{ reply: string }>({
    feature: 'ai-tutor',
    prompt: cleanMessage,
    history,
  });

  if (res.success && res.data?.reply) {
    return {
      configured: true,
      reply: res.data.reply,
      provider: res.provider,
      model: res.model,
    };
  }

  return {
    configured: false,
    reply: res.success ? '' : res.message,
    provider: 'fallback',
  };
}

/**
 * 2. MCQ Explanation Generator
 */
export async function getMCQExplanation(params: {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
  topic?: string;
}): Promise<string> {
  const correctText = params.options[params.correctAnswer] || '';
  const selectedText =
    params.selectedAnswer !== undefined ? params.options[params.selectedAnswer] : undefined;

  const prompt = `Explain the following objective examination MCQ clearly:
Topic: ${params.topic || 'General'}
Question: ${params.question}
Options:
${params.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}
Correct Answer: ${String.fromCharCode(65 + params.correctAnswer)}) ${correctText}
${selectedText ? `Student Selected: ${selectedText}` : ''}

Provide a concise, high-yield explanation highlighting the key concept, why the correct option is right, and why other options are incorrect.`;

  const res = await aiClient.request<{ reply: string }>({
    feature: 'mcq-explanation',
    prompt,
    options: params,
  });

  if (res.success && res.data?.reply) {
    return res.data.reply;
  }
  return 'Detailed concept explanation: Review the fundamental principles of this topic to master this objective question.';
}

/**
 * 3. Topic Notes Summary Generator
 */
export async function generateNotesSummary(params: {
  topicTitle: string;
  content: string;
}): Promise<string> {
  const prompt = `Generate a high-yield, quick revision summary for the study unit: "${params.topicTitle}".
Content:
${params.content.slice(0, 3000)}

Format as:
1. Core Concept Overview
2. Key Formulas / Facts / Dates
3. Most Probable Exam Points`;

  const res = await aiClient.request<{ reply: string }>({
    feature: 'notes-generator',
    prompt,
    options: { topicTitle: params.topicTitle },
  });

  if (res.success && res.data?.reply) {
    return res.data.reply;
  }
  return 'Key Revision Points: Review the highlighted definitions and core concepts in your study material.';
}

/**
 * 4. Doubt Solver
 */
export async function solveDoubt(params: {
  doubt: string;
  subject?: string;
}): Promise<string> {
  const prompt = `Student Doubt (${params.subject || 'General Study'}):
${params.doubt}

Please provide a clear, empathetic step-by-step solution with diagrams/formulas where applicable.`;

  const res = await aiClient.request<{ reply: string }>({
    feature: 'doubt-solver',
    prompt,
    options: { subject: params.subject },
  });

  if (res.success && res.data?.reply) {
    return res.data.reply;
  }
  return 'Doubt Solution: Break down the problem step-by-step and verify each formula.';
}

/**
 * 5. MCQ Practice Generator
 */
export async function generatePracticeMCQs(params: {
  topic: string;
  count?: number;
  difficulty?: string;
}): Promise<string> {
  const count = params.count || 5;
  const prompt = `Generate ${count} high-quality multiple choice questions (MCQs) for the topic: "${params.topic}". Difficulty: ${params.difficulty || 'Medium'}. Include 4 options (A, B, C, D) and correct answer with short explanation.`;

  const res = await aiClient.request<{ reply: string }>({
    feature: 'mcq-generator',
    prompt,
    options: params,
  });

  if (res.success && res.data?.reply) {
    return res.data.reply;
  }
  return '';
}

/**
 * 6. Mock Test Question Generator
 */
export async function generateMockQuestions(params: {
  examName: string;
  subjects: string[];
  totalQuestions?: number;
}): Promise<string> {
  const prompt = `Generate mock test syllabus questions for ${params.examName}. Subjects: ${params.subjects.join(', ')}.`;

  const res = await aiClient.request<{ reply: string }>({
    feature: 'mock-generator',
    prompt,
    options: params,
  });

  if (res.success && res.data?.reply) {
    return res.data.reply;
  }
  return '';
}
