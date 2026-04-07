import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuizQuestionPayload } from "../types";

function getModelName(): string {
  const m = import.meta.env.VITE_GEMINI_MODEL?.trim();
  if (m === "gemini-2.0-flash" || m === "gemini-2.5-flash") return m;
  return "gemini-2.5-flash";
}

function getApiKey(): string {
  const k = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!k) throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");
  return k;
}

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const body = fence ? fence[1]!.trim() : trimmed;
  return JSON.parse(body);
}

function validateQuestions(
  data: unknown,
  expectedCount: number,
): QuizQuestionPayload[] {
  if (!Array.isArray(data)) throw new Error("응답이 배열이 아닙니다.");
  if (data.length !== expectedCount) {
    throw new Error(`문항 수가 ${expectedCount}개가 아닙니다.`);
  }
  const out: QuizQuestionPayload[] = [];
  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    if (!q || typeof q !== "object") throw new Error(`문항 ${i + 1} 형식 오류`);
    const obj = q as Record<string, unknown>;
    const text = obj.text;
    const choices = obj.choices;
    const correctIndex = obj.correctIndex;
    if (typeof text !== "string" || text.trim() === "") {
      throw new Error(`문항 ${i + 1}: text 필요`);
    }
    if (!Array.isArray(choices) || choices.length !== 4) {
      throw new Error(`문항 ${i + 1}: choices는 길이 4의 배열이어야 합니다.`);
    }
    const c = choices.map((x) => {
      if (typeof x !== "string" || x.trim() === "") {
        throw new Error(`문항 ${i + 1}: 선택지는 비어 있지 않은 문자열이어야 합니다.`);
      }
      return x.trim();
    }) as [string, string, string, string];
    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      throw new Error(`문항 ${i + 1}: correctIndex는 0~3 정수여야 합니다.`);
    }
    out.push({
      text: text.trim(),
      choices: c,
      correctIndex: correctIndex as 0 | 1 | 2 | 3,
    });
  }
  return out;
}

const SYSTEM_INSTRUCTION = `You output ONLY a JSON array. No markdown, no explanation.
Each element must be an object with:
- "text": string (question stem in Korean)
- "choices": array of exactly 4 distinct strings (options in Korean)
- "correctIndex": integer 0-3 (index of the correct choice)`;

export async function generateQuizQuestions(params: {
  topic: string;
  difficulty: string;
  questionCount: number;
}): Promise<QuizQuestionPayload[]> {
  const { topic, difficulty, questionCount } = params;
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const userPrompt = `주제: ${topic}
난이도: ${difficulty}
4지선다 객관식 문제를 정확히 ${questionCount}개 만들어 주세요.
JSON 배열만 반환하세요.`;

  async function runOnce(): Promise<QuizQuestionPayload[]> {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const parsed = extractJsonArray(text);
    return validateQuestions(parsed, questionCount);
  }

  try {
    return await runOnce();
  } catch {
    return await runOnce();
  }
}
