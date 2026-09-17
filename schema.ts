import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------- Shared types ---------- */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/* ---------- Columns helpers ---------- */

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/* ---------- Identity & auth ---------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarHue: integer("avatar_hue").notNull().default(160),
  createdAt,
  updatedAt,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // 32-byte random token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt,
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    theme: text("theme").notNull().default("system"),
    emailNotifications: boolean("email_notifications").notNull().default(true),
    productUpdates: boolean("product_updates").notNull().default(true),
    weeklyGoalMinutes: integer("weekly_goal_minutes").notNull().default(120),
    defaultDifficulty: text("default_difficulty").notNull().default("intermediate"),
    updatedAt,
  },
  (t) => [index("user_prefs_user_idx").on(t.userId)],
);

/* ---------- AI Tutor ---------- */

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    createdAt,
    updatedAt,
  },
  (t) => [index("conversations_user_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
    content: text("content").notNull(),
    createdAt,
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)],
);

/* ---------- Summaries ---------- */

export const summaries = pgTable(
  "summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sourceText: text("source_text").notNull(),
    summary: text("summary").notNull(),
    keyPoints: text("key_points").array().notNull().default([]),
    concepts: text("concepts").array().notNull().default([]),
    keywords: text("keywords").array().notNull().default([]),
    length: text("length").notNull().default("medium"),
    difficulty: text("difficulty").notNull().default("intermediate"),
    style: text("style").notNull().default("paragraph"),
    provider: text("provider").notNull().default("local"),
    createdAt,
  },
  (t) => [index("summaries_user_idx").on(t.userId)],
);

/* ---------- Notes & study materials ---------- */

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    subject: text("subject").notNull().default("General"),
    tags: text("tags").array().notNull().default([]),
    createdAt,
    updatedAt,
  },
  (t) => [index("notes_user_idx").on(t.userId)],
);

export const studyMaterials = pgTable(
  "study_materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subject: text("subject").notNull().default("General"),
    description: text("description").notNull().default(""),
    content: text("content").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    createdAt,
    updatedAt,
  },
  (t) => [index("study_materials_user_idx").on(t.userId)],
);

/* ---------- Quizzes ---------- */

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    sourceMaterial: text("source_material").notNull().default(""),
    questionCount: integer("question_count").notNull(),
    difficulty: text("difficulty").notNull().default("intermediate"),
    questionType: text("question_type").notNull().default("multiple-choice"),
    questions: jsonb("questions").$type<QuizQuestion[]>().notNull(),
    provider: text("provider").notNull().default("local"),
    createdAt,
  },
  (t) => [index("quizzes_user_idx").on(t.userId)],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    options: text("options").array().notNull().default([]),
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt,
  },
  (t) => [index("quiz_questions_quiz_idx").on(t.quizId)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    percentage: integer("percentage").notNull(),
    answers: jsonb("answers").$type<number[]>().notNull(),
    timeTakenSec: integer("time_taken_sec").notNull().default(0),
    createdAt,
  },
  (t) => [index("quiz_attempts_user_idx").on(t.userId)],
);

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => quizQuestions.id, { onDelete: "cascade" }),
    questionIndex: integer("question_index").notNull(),
    selectedIndex: integer("selected_index").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt,
  },
  (t) => [index("quiz_answers_attempt_idx").on(t.attemptId)],
);

/* ---------- Activity ---------- */

export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activity: text("activity").notNull(), // tutor | summarizer | quiz | notes | materials
    topic: text("topic").notNull().default(""),
    detail: text("detail").notNull().default(""),
    durationMin: integer("duration_min"),
    createdAt,
  },
  (t) => [index("study_sessions_user_idx").on(t.userId)],
);

/* ---------- Inferred row types ---------- */

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Summary = typeof summaries.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestionRow = typeof quizQuestions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswerRow = typeof quizAnswers.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
