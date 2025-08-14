import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, instructor, admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionTemplates = pgTable("question_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  template: text("template").notNull(),
  variables: jsonb("variables"), // Variable definitions for the template
  difficultyLevel: text("difficulty_level").notNull(), // beginner, intermediate, advanced
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const generatedQuestions = pgTable("generated_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id").references(() => questionTemplates.id),
  questionText: text("question_text").notNull(),
  answer: text("answer"),
  explanation: text("explanation"),
  difficultyScore: real("difficulty_score"), // 1-10 scale
  uniquenessScore: real("uniqueness_score"), // Similarity score with other questions
  metadata: jsonb("metadata"), // Additional question data
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  dueDate: timestamp("due_date"),
  timeLimit: integer("time_limit"), // in minutes
  maxAttempts: integer("max_attempts").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentAssignments = pgTable("student_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: uuid("assignment_id").references(() => assignments.id),
  studentId: uuid("student_id").references(() => users.id),
  questionId: uuid("question_id").references(() => generatedQuestions.id),
  status: text("status").default("assigned"), // assigned, in_progress, submitted, graded
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  studentAnswer: text("student_answer"),
  workShown: text("work_shown"),
  score: real("score"),
  feedback: text("feedback"),
  timeSpent: integer("time_spent"), // in seconds
  attempts: integer("attempts").default(0),
});

export const similarityChecks = pgTable("similarity_checks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  question1Id: uuid("question1_id").references(() => generatedQuestions.id),
  question2Id: uuid("question2_id").references(() => generatedQuestions.id),
  similarityScore: real("similarity_score").notNull(),
  checkedAt: timestamp("checked_at").defaultNow(),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  questionsGenerated: integer("questions_generated").default(0),
  avgDifficulty: real("avg_difficulty"),
  avgUniquenessScore: real("avg_uniqueness_score"),
  avgStudentPerformance: real("avg_student_performance"),
  date: timestamp("date").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTemplates: many(questionTemplates),
  createdAssignments: many(assignments),
  studentAssignments: many(studentAssignments),
}));

export const questionTemplatesRelations = relations(questionTemplates, ({ one, many }) => ({
  creator: one(users, {
    fields: [questionTemplates.createdBy],
    references: [users.id],
  }),
  generatedQuestions: many(generatedQuestions),
}));

export const generatedQuestionsRelations = relations(generatedQuestions, ({ one, many }) => ({
  template: one(questionTemplates, {
    fields: [generatedQuestions.templateId],
    references: [questionTemplates.id],
  }),
  studentAssignments: many(studentAssignments),
  similarity1: many(similarityChecks, { relationName: "question1" }),
  similarity2: many(similarityChecks, { relationName: "question2" }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  creator: one(users, {
    fields: [assignments.createdBy],
    references: [users.id],
  }),
  studentAssignments: many(studentAssignments),
}));

export const studentAssignmentsRelations = relations(studentAssignments, ({ one }) => ({
  assignment: one(assignments, {
    fields: [studentAssignments.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [studentAssignments.studentId],
    references: [users.id],
  }),
  question: one(generatedQuestions, {
    fields: [studentAssignments.questionId],
    references: [generatedQuestions.id],
  }),
}));

export const similarityChecksRelations = relations(similarityChecks, ({ one }) => ({
  question1: one(generatedQuestions, {
    fields: [similarityChecks.question1Id],
    references: [generatedQuestions.id],
    relationName: "question1",
  }),
  question2: one(generatedQuestions, {
    fields: [similarityChecks.question2Id],
    references: [generatedQuestions.id],
    relationName: "question2",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionTemplateSchema = createInsertSchema(questionTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedQuestionSchema = createInsertSchema(generatedQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertStudentAssignmentSchema = createInsertSchema(studentAssignments).omit({
  id: true,
});

export const insertSimilarityCheckSchema = createInsertSchema(similarityChecks).omit({
  id: true,
  checkedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  date: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuestionTemplate = z.infer<typeof insertQuestionTemplateSchema>;
export type QuestionTemplate = typeof questionTemplates.$inferSelect;

export type InsertGeneratedQuestion = z.infer<typeof insertGeneratedQuestionSchema>;
export type GeneratedQuestion = typeof generatedQuestions.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertStudentAssignment = z.infer<typeof insertStudentAssignmentSchema>;
export type StudentAssignment = typeof studentAssignments.$inferSelect;

export type InsertSimilarityCheck = z.infer<typeof insertSimilarityCheckSchema>;
export type SimilarityCheck = typeof similarityChecks.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
