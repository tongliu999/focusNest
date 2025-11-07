// ai.ts
import { getAI, getGenerativeModel } from "firebase/ai";
import { app } from "./firebase";
import { LearningJourney } from "../types";
import {
  Type,
  HarmCategory,
  HarmBlockThreshold,
  Part,
  GenerateContentResult,
} from "@google/genai";
import jsPDF from "jspdf";

/**
 * ------------------------------------------------------------
 *  Model setup (reuse instances, generous caps, lenient safety)
 *  We keep large caps but CONTROL SIZE via per-field word limits
 *  and CHUNKED generation (plan → per-module).
 * ------------------------------------------------------------
 */
const ai = getAI(app);

const BASE_JSON_CONFIG = {
  responseMimeType: "application/json",
  maxOutputTokens: 8192,
  temperature: 0.45,
} as const;

const BASE_TEXT_CONFIG = {
  maxOutputTokens: 512,
  temperature: 0.5,
} as const;

const BASE_SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
] as const;

const flashText = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
  generationConfig: { ...BASE_TEXT_CONFIG },
  safetySettings: [...BASE_SAFETY],
});

/**
 * ------------------------------------------------------------
 *  Schemas
 * ------------------------------------------------------------
 */
const learningJourneySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ["Learn", "Quiz", "Test", "Matching Game", "Assignment"],
          },
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ["question"],
            },
          },
          instructions: { type: Type.STRING },
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
              },
              required: ["term", "definition"],
            },
          },
        },
        required: ["title", "type"],
      },
    },
  },
  required: ["title", "modules"],
} as const;

// Plan schema: tiny first call (title + list of module stubs)
const journeyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["Learn", "Quiz", "Matching Game", "Test", "Assignment"],
          },
          title: { type: Type.STRING },
          // optional hint for what to include
          focus: { type: Type.STRING },
        },
        required: ["type", "title"],
      },
    },
  },
  required: ["title", "plan"],
} as const;

// Per-module strict schemas (small outputs)
const learnModuleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Learn"] },
    summary: { type: Type.STRING },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    imagePrompt: { type: Type.STRING },
  },
  required: ["title", "type", "summary", "keyPoints", "imagePrompt"],
} as const;

const quizOrTestQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswerIndex: { type: Type.INTEGER },
    explanation: { type: Type.STRING },
  },
  required: ["question", "options", "correctAnswerIndex", "explanation"],
} as const;

const quizModuleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Quiz"] },
    questions: { type: Type.ARRAY, items: quizOrTestQuestionSchema as any },
  },
  required: ["title", "type", "questions"],
} as const;

const testModuleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Test"] },
    questions: { type: Type.ARRAY, items: quizOrTestQuestionSchema as any },
  },
  required: ["title", "type", "questions"],
} as const;

const matchingModuleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["Matching Game"] },
    instructions: { type: Type.STRING },
    pairs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ["term", "definition"],
      },
    },
  },
  required: ["title", "type", "instructions", "pairs"],
} as const;

/**
 * ------------------------------------------------------------
 *  Robust response readers & JSON parsing
 * ------------------------------------------------------------
 */
const responseToText = (res: GenerateContentResult): string => {
  try {
    const cand = (res as any)?.response?.candidates?.[0];
    const parts = cand?.content?.parts;
    if (Array.isArray(parts) && parts.length) {
      const txt = parts
        .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
        .filter(Boolean)
        .join("\n");
      if (txt.trim()) return txt;
    }
    const t = (res as any)?.response?.text?.();
    if (typeof t === "string" && t.trim()) return t;
  } catch {}
  return "";
};

const stripFences = (s: string) =>
  s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

const extractJsonSlice = (s: string): string | null => {
  s = stripFences(s);
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const starts = [firstBrace, firstBracket].filter((x) => x >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  let depth = 0,
    inStr = false,
    esc = false,
    opener = s[start],
    closer = opener === "{" ? "}" : "]";
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === opener) depth++;
      else if (ch === closer) {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
  }
  const lastCloser = s.lastIndexOf(closer);
  if (lastCloser > start) return s.slice(start, lastCloser + 1);
  return null;
};

const tryParseJson = <T = any>(raw: string): T => {
  const slice = extractJsonSlice(raw);
  if (!slice) throw new Error("No JSON object found in model response");
  const trimmed = slice.trim();
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed);
    return ({ title: "", modules: arr } as unknown) as T;
  }
  return JSON.parse(trimmed) as T;
};

const generateJson = async <T = any>(
  modelArgs: Parameters<typeof getGenerativeModel>[1],
  prompt: string,
  fallbackMinimal: T
): Promise<T> => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    safetySettings: [...BASE_SAFETY],
    ...modelArgs,
  });

  // attempt 1
  let res = await model.generateContent(prompt);
  let txt = responseToText(res);
  if (txt && /[{[]/.test(txt)) {
    try {
      return tryParseJson<T>(txt);
    } catch {}
  }

  // attempt 2 (strict JSON)
  const retry = `${prompt}

IMPORTANT: Return ONLY valid JSON. Start with '{' and end with '}'. No prose, no code fences.`;
  res = await model.generateContent(retry);
  txt = responseToText(res);
  if (txt && /[{[]/.test(txt)) {
    try {
      return tryParseJson<T>(txt);
    } catch {}
  }

  // fallback to minimal
  return fallbackMinimal;
};

/**
 * ------------------------------------------------------------
 *  Word-limit guardrails (post-process)
 * ------------------------------------------------------------
 */
const trimWords = (s: string, maxWords: number) => {
  const words = s.trim().split(/\s+/);
  if (words.length <= maxWords) return s.trim();
  return words.slice(0, maxWords).join(" ") + "…";
};

const normalizeJourney = (j: LearningJourney): LearningJourney => {
  const out: LearningJourney = { title: (j.title || "").trim(), modules: [] };
  for (const m of j.modules || []) {
    const base = { title: (m.title || "").trim(), type: m.type } as any;
    if (m.type === "Learn") {
      base.summary = m.summary ? trimWords(m.summary, 60) : "";
      base.keyPoints = Array.isArray(m.keyPoints)
        ? m.keyPoints.slice(0, 4).map((kp: string) => trimWords(kp, 12))
        : [];
      base.imagePrompt = m.imagePrompt ? trimWords(m.imagePrompt, 25) : "";
    } else if (m.type === "Quiz" || m.type === "Test") {
      const maxQ = m.type === "Quiz" ? 2 : 4;
      base.questions = (m.questions || [])
        .slice(0, maxQ)
        .map((q: any) => ({
          question: (q.question || "").trim(),
          options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
          correctAnswerIndex:
            typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
          explanation: q.explanation ? trimWords(q.explanation, 25) : "",
        }));
    } else if (m.type === "Matching Game") {
      base.instructions = m.instructions ? trimWords(m.instructions, 25) : "";
      base.pairs = Array.isArray(m.pairs)
        ? m.pairs.slice(0, 4).map((p: any) => ({
            term: (p.term || "").trim(),
            definition: trimWords(p.definition || "", 20),
          }))
        : [];
    } else if (m.type === "Assignment") {
      base.questions = (m.questions || []).slice(0, 1).map((q: any) => ({
        question: (q.question || "").trim(),
      }));
    }
    out.modules.push(base);
  }
  return out;
};

/**
 * ------------------------------------------------------------
 *  CHUNKED generateLearningJourney:
 *  1) Plan (tiny)
 *  2) Generate each module with a tight schema (small)
 *  3) Assemble + normalize (enforce word limits)
 * ------------------------------------------------------------
 */
// DROP-IN REPLACEMENT
export const generateLearningJourney = async (
    text: string,
    opts: {
      maxModules?: number;                // default 8
      includeTest?: boolean;              // default true
      allowMatching?: boolean;            // default true
      minLearnBeforeInteractive?: number; // default 2
      titleHint?: string;                 // optional branding/title steer
      concurrency?: number;               // default 4 (parallel calls)
    } = {}
  ): Promise<LearningJourney> => {
    const {
      maxModules = 8,
      includeTest = true,
      allowMatching = true,
      minLearnBeforeInteractive = 2,
      titleHint = "",
      concurrency = 4,
    } = opts;
  
    // 1) PLAN (tiny)
    const plan = await generateJson<{ title: string; plan: { type: string; title: string; focus?: string }[] }>(
      {
        generationConfig: {
          ...BASE_JSON_CONFIG,
          responseSchema: journeyPlanSchema as any,
          temperature: 0.35,
        },
      },
      `
  Create a compact learning journey PLAN for the provided study material.
  
  RULES:
  - Start with ${minLearnBeforeInteractive} "Learn" modules.
  - Then alternate small groups of "Learn" with an interactive module (${allowMatching ? `"Quiz" or "Matching Game"` : `"Quiz"`}).
  - ${includeTest ? "End with one \"Test\" module (3–4 questions)." : "Do NOT include a final \"Test\" module."}
  - 6–10 modules total, but cap at ${maxModules}.
  - Title hint (optional): ${titleHint || "n/a"}
  - Output ONLY JSON: { "title", "plan": [ { "type", "title", "focus?" } ] }.
  
  Study Material:
  ---
  ${text}
  ---
  `.trim(),
      { title: "", plan: [] }
    );
  
    // Normalize/guard the plan
    let planList = (plan.plan || []).slice(0, maxModules);
    if (!allowMatching) {
      planList = planList.map(p => p.type === "Matching Game" ? { ...p, type: "Quiz" } : p);
    }
    if (!includeTest) {
      planList = planList.filter(p => p.type !== "Test");
      if (planList.length && planList[planList.length - 1].type === "Learn") {
        planList.push({ type: "Quiz", title: "Wrap-up Quiz" } as any);
        planList = planList.slice(0, maxModules);
      }
    }
    if (!planList.length) {
      planList.push(
        { type: "Learn", title: "Core Concepts" } as any,
        { type: "Quiz", title: "Quick Check" } as any,
        ...(includeTest ? [{ type: "Test", title: "Final Test" } as any] : [])
      );
    }
  
    // 2) PER-MODULE generation — PARALLEL with concurrency cap
    const modules = await mapWithLimit(planList, concurrency, async (stub) => {
      if (stub.type === "Learn") {
        return await generateJson<any>(
          {
            generationConfig: {
              ...BASE_JSON_CONFIG,
              responseSchema: learnModuleSchema as any,
              temperature: 0.45,
            },
          },
          `
  Return ONLY JSON for one "Learn" module:
  { "title", "type":"Learn", "summary", "keyPoints": 2–4 strings, "imagePrompt" }.
  
  WORD LIMITS:
  - summary ≤ 60 words
  - each keyPoints item ≤ 12 words
  - imagePrompt ≤ 25 words
  
  Title: ${stub.title}
  Focus (optional): ${stub.focus || ""}
  
  Ground strictly in this content:
  ---
  ${text}
  ---
  `.trim(),
          { title: stub.title, type: "Learn", summary: "", keyPoints: [], imagePrompt: "" }
        );
      }
  
      if (stub.type === "Quiz") {
        return await generateJson<any>(
          {
            generationConfig: {
              ...BASE_JSON_CONFIG,
              responseSchema: quizModuleSchema as any,
              temperature: 0.45,
            },
          },
          `
  Return ONLY JSON for one "Quiz" module:
  { "title", "type":"Quiz", "questions": [ 1–2 MCQs ] }.
  
  Each MCQ MUST have:
  - exactly 4 "options"
  - "correctAnswerIndex"
  - "explanation" ≤ 25 words
  
  Title: ${stub.title}
  Focus (optional): ${stub.focus || ""}
  
  Base questions ONLY on:
  ---
  ${text}
  ---
  `.trim(),
          { title: stub.title, type: "Quiz", questions: [] }
        );
      }
  
      if (stub.type === "Matching Game" && allowMatching) {
        return await generateJson<any>(
          {
            generationConfig: {
              ...BASE_JSON_CONFIG,
              responseSchema: matchingModuleSchema as any,
              temperature: 0.45,
            },
          },
          `
  Return ONLY JSON for one "Matching Game" module:
  { "title", "type":"Matching Game", "instructions", "pairs": 3–4 items }.
  
  - instructions ≤ 25 words
  - Each pair: { "term", "definition" (≤ 20 words) }
  
  Title: ${stub.title}
  Focus (optional): ${stub.focus || ""}
  
  Draw terms/defs ONLY from:
  ---
  ${text}
  ---
  `.trim(),
          { title: stub.title, type: "Matching Game", instructions: "", pairs: [] }
        );
      }
  
      if (stub.type === "Test" && includeTest) {
        return await generateJson<any>(
          {
            generationConfig: {
              ...BASE_JSON_CONFIG,
              responseSchema: testModuleSchema as any,
              temperature: 0.45,
            },
          },
          `
  Return ONLY JSON for one "Test" module:
  { "title", "type":"Test", "questions": [ 3–4 MCQs ] }.
  
  Each MCQ MUST have:
  - exactly 4 "options"
  - "correctAnswerIndex"
  - "explanation" ≤ 25 words
  
  Title: ${stub.title}
  Focus (optional): ${stub.focus || ""}
  
  Assess breadth of:
  ---
  ${text}
  ---
  `.trim(),
          { title: stub.title, type: "Test", questions: [] }
        );
      }
  
      // Fallback for unexpected types
      return {
        title: stub.title,
        type: "Assignment",
        questions: [{ question: (stub.focus || "Answer the prompt clearly.").trim() }],
      };
    });
  
    // 3) Assemble + enforce word limits
    return normalizeJourney({
      title: plan.title || titleHint || "Learning Journey",
      modules,
    } as LearningJourney);
  };
  
  

/**
 * ------------------------------------------------------------
 *  Assignment → Topicized Journey (Learn + Quiz per topic, parallel)
 * ------------------------------------------------------------
 */
const mapWithLimit = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>
): Promise<R[]> => {
  const out: R[] = [];
  let i = 0;
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  };
  const workers = Array(Math.min(limit, items.length)).fill(0).map(run);
  await Promise.all(workers);
  return out;
};

const assignmentTopicsSchema = {
  type: Type.OBJECT,
  properties: {
    topics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["topic", "questions"],
      },
    },
  },
  required: ["topics"],
} as const;

const topicModulesSchema = {
  type: Type.OBJECT,
  properties: {
    modules: {
      type: Type.ARRAY,
      items: (learningJourneySchema as any).properties.modules.items,
    },
  },
  required: ["modules"],
} as const;

export const generateAssignmentJourneyByTopics = async (
  text: string
): Promise<LearningJourney> => {
  // Step 1: Extract topics
  const topicsRes = await generateJson<{ topics: { topic: string; questions: string[] }[] }>(
    {
      generationConfig: {
        ...BASE_JSON_CONFIG,
        responseSchema: assignmentTopicsSchema as any,
        temperature: 0.35,
      },
    },
    `
Extract 3–12 concise topics from the "Assignment" and attach the original questions to the most relevant topic.
- If questions are implicit, derive clear questions from instructions.
- Return strict JSON: { "topics": [ { "topic": string, "questions": string[] } ] }.
- Only JSON; no prose.

Assignment:
---
${text}
---
`.trim(),
    { topics: [] }
  );

  // Step 2: Per-topic Learn + Quiz
  const perTopic = await mapWithLimit(topicsRes.topics, 6, async (t, idx) => {
    const minimal = { modules: [] as any[] };
    return await generateJson<{ modules: any[] }>(
      {
        generationConfig: {
          ...BASE_JSON_CONFIG,
          responseSchema: topicModulesSchema as any,
          temperature: 0.5,
        },
      },
      `
You are creating exactly TWO modules for Topic #${idx + 1}: "${t.topic}".
Return strict JSON: { "modules": [ ... ] } with:

WORD LIMITS:
- Learn.summary ≤ 60 words; keyPoints (2–4 items, each ≤ 12 words); imagePrompt ≤ 25 words.
- Quiz.explanation ≤ 25 words.

MODULES:
1) "Learn":
   - { title, type:"Learn", summary, keyPoints, imagePrompt }
2) "Quiz":
   - { title, type:"Quiz", questions: [...] }
   - 1–2 MCQs derived from the provided questions.
   - Each MCQ has exactly 4 options, a correctAnswerIndex, and a short explanation.

Provided questions (JSON array):
${JSON.stringify(t.questions)}
`.trim(),
      minimal
    );
  });

  // Step 3: Reduce to full journey (assemble + normalize directly)
  const allModules = perTopic.flatMap((x) => x.modules || []);
  const journey = normalizeJourney({
    title: "Topic-Based Journey",
    modules: allModules,
  } as LearningJourney);
  return journey;
};

/**
 * ------------------------------------------------------------
 *  Alternate single-pass Assignment Journey (Learn + Assignment)
 * ------------------------------------------------------------
 */
export const generateAssignmentJourney = async (
    text: string,
    opts: {
      maxModules?: number;                 // cap total modules (default 12)
      minLearnBeforeAssignment?: number;   // # Learn modules before first Assignment (default 1)
      titleHint?: string;                  // optional title steer
      concurrency?: number;                // parallel calls to the model (default 6)
    } = {}
  ): Promise<LearningJourney> => {
    const {
      maxModules = 12,
      minLearnBeforeAssignment = 1,
      titleHint = "",
      concurrency = 6,
    } = opts;
  
    // 1) PLAN (tiny, schema-bound)
    // Ask the model to extract questions and lay out an alternating Learn/Assignment sequence.
    const plan = await generateJson<{ title: string; plan: { type: string; title: string; focus?: string }[] }>(
      {
        generationConfig: {
          ...BASE_JSON_CONFIG,
          responseSchema: journeyPlanSchema as any,
          temperature: 0.35,
        },
      },
      `
  Create a compact PLAN for an assignment-driven learning journey.
  
  GOAL:
  - For EACH distinct question/instruction in the assignment, produce:
    1) a "Learn" module stub (title + focus on what must be taught),
    2) followed by an "Assignment" module stub (title + focus containing the EXACT question text).
  
  RULES:
  - Start with ${minLearnBeforeAssignment} "Learn" module(s) if needed to cover core prerequisites.
  - Alternate "Learn" → "Assignment" for each question thereafter.
  - 4–12 modules total, but cap at ${maxModules}.
  - Output ONLY JSON matching:
    {
      "title": string,
      "plan": [ { "type": "Learn"|"Assignment", "title": string, "focus"?: string } ]
    }
  
  Assignment (use only this content):
  ---
  ${text}
  ---
  `.trim(),
      { title: "", plan: [] }
    );
  
    // Normalize/guard the plan
    let planList = (plan.plan || []).slice(0, maxModules);
  
    if (!planList.length) {
      // Minimal fallback: one Learn + one Assignment
      planList = [
        { type: "Learn", title: "Core Concepts", focus: "" } as any,
        { type: "Assignment", title: "Question 1", focus: "Answer the prompt clearly." } as any,
      ];
    }
  
    // Ensure we strictly alternate L→A after the initial prereq learns (best-effort tidy)
    const sanitized: {type: string; title: string; focus?: string}[] = [];
    let preLearn = Math.max(0, minLearnBeforeAssignment);
    for (const stub of planList) {
      if (preLearn > 0 && stub.type === "Learn") {
        sanitized.push(stub);
        preLearn--;
        continue;
      }
      if (!sanitized.length || sanitized[sanitized.length - 1].type === "Assignment") {
        sanitized.push(stub.type === "Assignment" ? { ...stub, type: "Learn" } : stub);
      } else {
        sanitized.push(stub.type === "Learn" ? { ...stub, type: "Assignment" } : stub);
      }
    }
    planList = sanitized.slice(0, maxModules);
  
    // 2) PER-MODULE generation — PARALLEL with concurrency cap
    // Only "Learn" modules need a model call; "Assignment" modules are constructed directly.
    const modules = await mapWithLimit(planList, concurrency, async (stub) => {
      if (stub.type === "Learn") {
        return await generateJson<any>(
          {
            generationConfig: {
              ...BASE_JSON_CONFIG,
              responseSchema: learnModuleSchema as any,
              temperature: 0.45,
            },
          },
          `
  Return ONLY JSON for one "Learn" module:
  { "title", "type":"Learn", "summary", "keyPoints": 2–4 strings, "imagePrompt" }.
  
  WORD LIMITS:
  - summary ≤ 60 words
  - each keyPoints item ≤ 12 words
  - imagePrompt ≤ 25 words
  
  Title: ${stub.title}
  Focus (teach these for the upcoming assignment question):
  ${stub.focus || ""}
  
  Ground strictly in the assignment content below:
  ---
  ${text}
  ---
  `.trim(),
          { title: stub.title, type: "Learn", summary: "", keyPoints: [], imagePrompt: "" }
        );
      }
  
      // Assignment modules: no MCQ fields — only a single question object.
      if (stub.type === "Assignment") {
        return {
          title: stub.title,
          type: "Assignment",
          questions: [
            {
              question: (stub.focus || "Answer the prompt in your own words.").trim(),
            },
          ],
        };
      }
  
      // Fallback (unexpected types): coerce to Assignment
      return {
        title: stub.title,
        type: "Assignment",
        questions: [
          { question: (stub.focus || "Answer the prompt clearly.").trim() },
        ],
      };
    });
  
    // 3) Assemble + enforce word limits (summary/keyPoints/imagePrompt/…)
    return normalizeJourney({
      title: plan.title || titleHint || "Assignment Journey",
      modules,
    } as LearningJourney);
  };

/**
 * ------------------------------------------------------------
 *  Other AI Functions
 * ------------------------------------------------------------
 */
export const getTextFromImage = async (
  imagePart: Part,
  _mimeType: string
): Promise<string> => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: { ...BASE_TEXT_CONFIG },
    safetySettings: [...BASE_SAFETY],
  });
  const result = await model.generateContent([
    "Extract the text from this image. If none, say so.",
    imagePart,
  ]);
  return responseToText(result);
};

export const getTextFromPdf = async (file: File): Promise<string> => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: { ...BASE_TEXT_CONFIG, maxOutputTokens: 2048 },
    safetySettings: [...BASE_SAFETY],
  });

  const base64Pdf = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

  const result = await model.generateContent([
    "Extract the text from this PDF. If none, say so.",
    { inlineData: { mimeType: file.type, data: base64Pdf } },
  ]);
  return responseToText(result);
};

export const checkAnswer = async (
  question: string,
  answer: string
): Promise<{ correct: boolean; feedback: string }> => {
  const model = getGenerativeModel(ai, {
    model: "gemini-2.5-flash",
    generationConfig: { ...BASE_JSON_CONFIG },
    safetySettings: [...BASE_SAFETY],
  });

  const prompt = `
Respond ONLY as compact JSON:
{ "correct": boolean, "feedback": string (<= 30 words) }

Question: "${question}"
UserAnswer: "${answer}"
`.trim();

  const res = await model.generateContent(prompt);
  try {
    return tryParseJson<{ correct: boolean; feedback: string }>(responseToText(res));
  } catch {
    return {
      correct: false,
      feedback: "Could not verify. Re-check the key concept and try again.",
    };
  }
};

export const generateRefresher = async (
  topic: string,
  failedQuestion: string
): Promise<string> => {
  const prompt = `A user is struggling with a quiz question on "${topic}".
The question they got wrong was: "${failedQuestion}".
Provide a very simple, encouraging explanation or hint (<= 50 words).
Use an analogy if possible. Do not reveal the direct answer.`;
  const result = await flashText.generateContent(prompt);
  return responseToText(result);
};

export const generatePdf = (answers: { [key: string]: string }) => {
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(18);
  doc.text("Assignment Answers", 10, y);
  y += 10;
  doc.setFontSize(12);
  Object.entries(answers).forEach(([question, answer]) => {
    const qLines = doc.splitTextToSize(`Q: ${question}`, 180);
    const aLines = doc.splitTextToSize(`A: ${answer}`, 175);
    qLines.forEach((line: string) => {
      doc.text(line, 10, y);
      y += 7;
    });
    aLines.forEach((line: string) => {
      doc.text(line, 15, y);
      y += 7;
    });
    y += 4;
    if (y > 280) {
      doc.addPage();
      y = 15;
    }
  });
  doc.save("assignment.pdf");
};
