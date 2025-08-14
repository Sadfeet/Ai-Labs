import { 
  users, questionTemplates, generatedQuestions, assignments, 
  studentAssignments, similarityChecks, analytics,
  type User, type InsertUser,
  type QuestionTemplate, type InsertQuestionTemplate,
  type GeneratedQuestion, type InsertGeneratedQuestion,
  type Assignment, type InsertAssignment,
  type StudentAssignment, type InsertStudentAssignment,
  type SimilarityCheck, type InsertSimilarityCheck,
  type Analytics, type InsertAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question Template operations
  getQuestionTemplates(): Promise<QuestionTemplate[]>;
  getQuestionTemplatesBySubject(subject: string): Promise<QuestionTemplate[]>;
  createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  updateQuestionTemplate(id: string, template: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined>;
  
  // Generated Question operations
  getGeneratedQuestions(): Promise<GeneratedQuestion[]>;
  getGeneratedQuestionsByTemplate(templateId: string): Promise<GeneratedQuestion[]>;
  createGeneratedQuestion(question: InsertGeneratedQuestion): Promise<GeneratedQuestion>;
  
  // Assignment operations
  getAssignments(): Promise<Assignment[]>;
  getAssignmentsByInstructor(instructorId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  
  // Student Assignment operations
  getStudentAssignments(studentId: string): Promise<StudentAssignment[]>;
  getStudentAssignmentsByAssignment(assignmentId: string): Promise<StudentAssignment[]>;
  createStudentAssignment(studentAssignment: InsertStudentAssignment): Promise<StudentAssignment>;
  updateStudentAssignment(id: string, studentAssignment: Partial<InsertStudentAssignment>): Promise<StudentAssignment | undefined>;
  
  // Similarity Check operations
  createSimilarityCheck(similarityCheck: InsertSimilarityCheck): Promise<SimilarityCheck>;
  getSimilarityChecks(questionId: string): Promise<SimilarityCheck[]>;
  
  // Analytics operations
  getAnalytics(): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsBySubject(subject: string): Promise<Analytics[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalQuestions: number;
    activeStudents: number;
    avgDifficulty: number;
    uniquenessRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getQuestionTemplates(): Promise<QuestionTemplate[]> {
    return await db.select().from(questionTemplates).where(eq(questionTemplates.isActive, true)).orderBy(desc(questionTemplates.createdAt));
  }

  async getQuestionTemplatesBySubject(subject: string): Promise<QuestionTemplate[]> {
    return await db.select().from(questionTemplates)
      .where(and(eq(questionTemplates.subject, subject), eq(questionTemplates.isActive, true)))
      .orderBy(desc(questionTemplates.createdAt));
  }

  async createQuestionTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const [createdTemplate] = await db
      .insert(questionTemplates)
      .values(template)
      .returning();
    return createdTemplate;
  }

  async updateQuestionTemplate(id: string, template: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined> {
    const [updated] = await db
      .update(questionTemplates)
      .set(template)
      .where(eq(questionTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async getGeneratedQuestions(): Promise<GeneratedQuestion[]> {
    return await db.select().from(generatedQuestions).orderBy(desc(generatedQuestions.createdAt));
  }

  async getGeneratedQuestionsByTemplate(templateId: string): Promise<GeneratedQuestion[]> {
    return await db.select().from(generatedQuestions)
      .where(eq(generatedQuestions.templateId, templateId))
      .orderBy(desc(generatedQuestions.createdAt));
  }

  async createGeneratedQuestion(question: InsertGeneratedQuestion): Promise<GeneratedQuestion> {
    const [createdQuestion] = await db
      .insert(generatedQuestions)
      .values(question)
      .returning();
    return createdQuestion;
  }

  async getAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.isActive, true)).orderBy(desc(assignments.createdAt));
  }

  async getAssignmentsByInstructor(instructorId: string): Promise<Assignment[]> {
    return await db.select().from(assignments)
      .where(and(eq(assignments.createdBy, instructorId), eq(assignments.isActive, true)))
      .orderBy(desc(assignments.createdAt));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [createdAssignment] = await db
      .insert(assignments)
      .values(assignment)
      .returning();
    return createdAssignment;
  }

  async updateAssignment(id: string, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updated] = await db
      .update(assignments)
      .set(assignment)
      .where(eq(assignments.id, id))
      .returning();
    return updated || undefined;
  }

  async getStudentAssignments(studentId: string): Promise<StudentAssignment[]> {
    return await db.select().from(studentAssignments)
      .where(eq(studentAssignments.studentId, studentId))
      .orderBy(desc(studentAssignments.id));
  }

  async getStudentAssignmentsByAssignment(assignmentId: string): Promise<StudentAssignment[]> {
    return await db.select().from(studentAssignments)
      .where(eq(studentAssignments.assignmentId, assignmentId))
      .orderBy(desc(studentAssignments.id));
  }

  async createStudentAssignment(studentAssignment: InsertStudentAssignment): Promise<StudentAssignment> {
    const [created] = await db
      .insert(studentAssignments)
      .values(studentAssignment)
      .returning();
    return created;
  }

  async updateStudentAssignment(id: string, studentAssignment: Partial<InsertStudentAssignment>): Promise<StudentAssignment | undefined> {
    const [updated] = await db
      .update(studentAssignments)
      .set(studentAssignment)
      .where(eq(studentAssignments.id, id))
      .returning();
    return updated || undefined;
  }

  async createSimilarityCheck(similarityCheck: InsertSimilarityCheck): Promise<SimilarityCheck> {
    const [created] = await db
      .insert(similarityChecks)
      .values(similarityCheck)
      .returning();
    return created;
  }

  async getSimilarityChecks(questionId: string): Promise<SimilarityCheck[]> {
    return await db.select().from(similarityChecks)
      .where(sql`${similarityChecks.question1Id} = ${questionId} OR ${similarityChecks.question2Id} = ${questionId}`)
      .orderBy(desc(similarityChecks.checkedAt));
  }

  async getAnalytics(): Promise<Analytics[]> {
    return await db.select().from(analytics).orderBy(desc(analytics.date));
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [created] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return created;
  }

  async getAnalyticsBySubject(subject: string): Promise<Analytics[]> {
    return await db.select().from(analytics)
      .where(eq(analytics.subject, subject))
      .orderBy(desc(analytics.date));
  }

  async getDashboardStats(): Promise<{
    totalQuestions: number;
    activeStudents: number;
    avgDifficulty: number;
    uniquenessRate: number;
  }> {
    const [questionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generatedQuestions);

    const [studentCount] = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(eq(users.role, "student"));

    const [difficultyAvg] = await db
      .select({ avg: sql<number>`avg(${generatedQuestions.difficultyScore})` })
      .from(generatedQuestions)
      .where(sql`${generatedQuestions.difficultyScore} IS NOT NULL`);

    const [uniquenessAvg] = await db
      .select({ avg: sql<number>`avg(${generatedQuestions.uniquenessScore})` })
      .from(generatedQuestions)
      .where(sql`${generatedQuestions.uniquenessScore} IS NOT NULL`);

    return {
      totalQuestions: questionCount?.count || 0,
      activeStudents: studentCount?.count || 0,
      avgDifficulty: difficultyAvg?.avg || 0,
      uniquenessRate: (uniquenessAvg?.avg || 0) * 100,
    };
  }
}

export const storage = new DatabaseStorage();
