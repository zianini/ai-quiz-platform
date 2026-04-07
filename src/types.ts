import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "open" | "closed";

export interface RoomDoc {
  topic: string;
  difficulty: string;
  questionCount: number;
  creatorUid: string;
  professorNickname: string;
  status: RoomStatus;
  createdAt: Timestamp;
}

export interface QuestionDoc {
  order: number;
  text: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface AttemptDoc {
  nickname: string;
  uid: string;
  score: number;
  total: number;
  createdAt: Timestamp;
}

export interface UserProfileDoc {
  nickname: string;
  updatedAt: Timestamp;
}

export interface QuizQuestionPayload {
  text: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}
