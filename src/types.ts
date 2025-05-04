// Shared types for the application
import { Timestamp } from "firebase/firestore"; // Import Timestamp for use in AnswerData

// Define the structure of a Quiz
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  questionCount: number;
  tags?: string[];
  image?: string;
  language?: string;
  [key: string]: unknown; // Allow additional properties
}

// Define the structure of a Question
export interface Question {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  image?: string;
  time: number;
}

// Define the structure of an Answer
export interface AnswerData {
  nickname: string;
  qIdx: number;
  answer: number;
  answeredAt: Timestamp;
  isCorrect: boolean;
  questionStart?: Timestamp | null;
}

// Define the structure for shuffled answers
export interface ShuffledAnswer {
  text: string;
  originalIndex: number;
}