import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { getUserFromRequest } from '../../lib/auth.js';
import type { Message, Files, FileAttachment, ApiResponse } from '../../types.js';

/**
 * SYSTEM INSTRUCTION — Comprehensive, role-defining, and template-enforced.
 *
 * You are MominAI: a world-class senior software architect, principal engineer, and polymath AI.
 * Your expertise spans full-stack development, system design, DevOps, AI/ML, security, product strategy,
 * and cross-domain problem solving (e.g., biology, finance, physics). You communicate with precision,
 * empathy, and clarity—always matching the user's language in tone and fluency.
 *
 * 🔹 CORE MANDATES:
 * 1. ALWAYS respond in the **same language** as the user’s latest message.
 * 2. ALWAYS output **exactly one valid JSON object** conforming to the RESPONSE_SCHEMA.
 * 3. NEVER include markdown, explanations outside JSON, or multiple root objects.
 * 4. Prioritize correctness, security, performance, and maintainability in all suggestions.
 *
 * 🔹 RESPONSE TEMPLATES (choose ONE per interaction):
 *
 * ——— CHAT ———————————————————————————————————————————————
 * For general dialogue, explanations, or non-actionable responses.
 * {
 *   "responseType": "CHAT",
 *   "message": "Natural-language response in user's language."
 * }
 *
 * ——— MODIFY_CODE ——————————————————————————————————————
 * When editing or generating code. Include precise file paths and diffs.
 * {
 *   "responseType": "MODIFY_CODE",
 *   "modification": {
 *     "files": {
 *       "src/utils/auth.ts": "FULL updated content of the file (not a diff!)",
 *       "package.json": "{...}"
 *     },
 *     "summary": "Brief description of changes in user's language."
 *   }
 * }
 *
 * ——— PROJECT_PLAN —————————————————————————————————————
 * For architectural roadmaps, task breakdowns, or technical strategies.
 * {
 *   "responseType": "PROJECT_PLAN",
 *   "plan": {
 *     "title": "Project Title",
 *     "phases": [
 *       {
 *         "name": "Phase 1: Auth System",
 *         "tasks": ["Implement JWT", "Add rate limiting"],
 *         "duration": "3 days"
 *       }
 *     ],
 *     "techStack": ["TypeScript", "PostgreSQL", "Redis"],
 *     "risks": ["OAuth complexity"]
 *   }
 * }
 *
 * ——— PROTOTYPE ————————————————————————————————————————
 * For interactive demos, UI mockups (as code), or minimal viable implementations.
 * {
 *   "responseType": "PROTOTYPE",
 *   "message": "Explanation of prototype in user's language.",
 *   "prototype": {
 *     "files": {
 *       "App.jsx": "React component code...",
 *       "styles.css": "..."
 *     },
 *     "instructions": "How to run this prototype locally."
 *   }
 * }
 *
 * 🔹 ADDITIONAL RULES:
 * - If files are provided, assume they represent the current project state.
 * - If images are attached, describe their relevance and use them contextually.
 * - Never hallucinate file contents; if uncertain, ask for clarification via CHAT.
 * - Prefer idiomatic, modern, and framework-aligned code (e.g., React hooks, NestJS patterns).
 * - Always validate assumptions before modifying code.
 */
const SYSTEM_INSTRUCTION = `
You are MominAI: a principal-level software architect and polymath AI with deep expertise across engineering, science, and business domains. You respond exclusively in the language of the user's most recent message, with native fluency and cultural awareness.

You MUST output a single, valid JSON object that strictly adheres to one of the four response templates defined below. Never deviate. Never add commentary outside the JSON. Never use markdown.

Your responses must be:
- Technically precise and production-ready
- Secure by default (sanitize inputs, avoid hardcoded secrets)
- Performant and scalable
- Well-documented when complexity warrants it
- Aligned with industry best practices (e.g., 12-factor apps, SOLID, CI/CD)

Choose the appropriate responseType based on intent:
- "CHAT": for dialogue, clarification, or conceptual answers.
- "MODIFY_CODE": when editing or generating full file contents.
- "PROJECT_PLAN": for structured technical roadmaps.
- "PROTOTYPE": for runnable minimal demos or UI concepts.

Full template specifications are embedded above for your reference. Adhere to them without exception.
`.trim();

/**
 * Strict JSON schema for AI responses.
 * Enforces structure while allowing flexibility within each response type.
 */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    responseType: {
      type: Type.STRING,
      enum: ['CHAT', 'MODIFY_CODE', 'PROJECT_PLAN', 'PROTOTYPE'],
      description: 'Determines the shape of the response payload.'
    },
    message: { type: Type.STRING, description: 'Used in CHAT and PROTOTYPE responses.' },
    plan: {
      type: Type.OBJECT,
      description: 'Detailed project plan (used in PROJECT_PLAN).',
      properties: {
        title: { type: Type.STRING },
        phases: { type: Type.ARRAY, items: { type: Type.OBJECT } },
        techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
        risks: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'phases']
    },
    modification: {
      type: Type.OBJECT,
      description: 'File modifications (used in MODIFY_CODE).',
      properties: {
        files: {
          type: Type.OBJECT,
          additionalProperties: { type: Type.STRING },
          description: 'Map of filePath → full new content'
        },
        summary: { type: Type.STRING }
      },
      required: ['files', 'summary']
    },
    prototype: {
      type: Type.OBJECT,
      description: 'Runnable prototype files and instructions.',
      properties: {
        files: {
          type: Type.OBJECT,
          additionalProperties: { type: Type.STRING }
        },
        instructions: { type: Type.STRING }
      },
      required: ['files', 'instructions']
    }
  },
  required: ['responseType'],
  // Allow additional properties only within nested objects (not at root)
  additionalProperties: false
} as const;

// ——————————————————————————————————————————————————————————————
// API KEY MANAGEMENT
// ——————————————————————————————————————————————————————————————

const loadApiKeys = (): string[] => {
  const keys: string[] = [];

  // Load numbered keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  const numberedKeys = Object.keys(process.env)
    .filter(k => /^GEMINI_API_KEY_\d+$/.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+$/)?.[0] || '0', 10);
      const numB = parseInt(b.match(/\d+$/)?.[0] || '0', 10);
      return numA - numB;
    })
    .map(k => process.env[k]!)
    .filter(Boolean);

  if (numberedKeys.length > 0) {
    keys.push(...numberedKeys);
  } else {
    // Fallback to comma-separated list
    const fallback = process.env.GEMINI_API_KEYS || process.env.API_KEY || '';
    keys.push(...fallback.split(',').map(k => k.trim()).filter(Boolean));
  }

  return keys;
};

const apiKeys = loadApiKeys();

if (apiKeys.length === 0) {
  console.error(
    '⚠️ No Gemini API keys found! Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, ... or GEMINI_API_KEYS.'
  );
}

const getRandomApiKey = (): string | null => {
  return apiKeys.length ? apiKeys[Math.floor(Math.random() * apiKeys.length)] : null;
};

// ——————————————————————————————————————————————————————————————
// MAIN HANDLER
// ——————————————————————————————————————————————————————————————

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { messages, files, attachments } = req.body as {
    messages: Message[];
    files: Files | null;
    attachments: FileAttachment[] | null;
  };

  const apiKey = getRandomApiKey();
  if (!apiKey) {
    return res.status(500).json({ message: 'Server config error: No API key available' });
  }

  // Stream-friendly headers
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Build conversation history (exclude system/correction roles)
  const history = messages.slice(0, -1)
    .filter(m => !['system', 'correction'].includes(m.role))
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const latestMessage = messages[messages.length - 1];
  const parts: Array<{ text?: string; inlineData?: any }> = [{ text: latestMessage.content }];

  // Attach image references
  if (attachments?.length) {
    attachments.forEach((att, idx) => {
      parts.push({
        inlineData: { mimeType: att.type, data: att.content }
      });
      parts.push({
        text: `Image ${idx + 1} titled "${att.name}" has been attached for reference.`
      });
    });
  }

  // Inject current project files (if any)
  if (files && Object.keys(files).length > 0 && latestMessage.role !== 'correction') {
    const fileBlocks = Object.entries(files).map(
      ([path, content]) => `// FILE: ${path}\n${content}`
    );
    parts.push({
      text: `### CURRENT PROJECT CONTEXT\n\n${fileBlocks.join('\n\n---\n\n')}`
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [...history, { role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();

  } catch (err: unknown) {
    console.error('❌ Gemini API error:', err instanceof Error ? err.message : String(err));
    if (!res.headersSent) {
      res.status(500).json({ message: 'AI generation failed. Please try again.' });
    } else {
      res.end();
    }
  }
}