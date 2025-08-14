import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { questionGenerator } from "./services/questionGenerator";
import { difficultyAnalyzer } from "./services/difficultyAnalyzer";
import { uniquenessValidator } from "./services/uniquenessValidator";
import { generateQuestionTemplate } from "./services/gemini";
import { 
  insertUserSchema, 
  insertQuestionTemplateSchema, 
  insertAssignmentSchema,
  insertStudentAssignmentSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard statistics", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Question Templates
  app.get("/api/question-templates", async (req, res) => {
    try {
      const { subject } = req.query;
      const templates = subject 
        ? await storage.getQuestionTemplatesBySubject(subject as string)
        : await storage.getQuestionTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question templates", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/question-templates", async (req, res) => {
    try {
      const templateData = insertQuestionTemplateSchema.parse(req.body);
      const template = await storage.createQuestionTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create question template", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  app.post("/api/question-templates/generate", async (req, res) => {
    try {
      const { subject, topic, difficultyLevel } = req.body;
      
      if (!subject || !topic || !difficultyLevel) {
        return res.status(400).json({ message: "Subject, topic, and difficulty level are required" });
      }

      const template = await generateQuestionTemplate(subject, topic, difficultyLevel);
      res.json({ template });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate question template", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Question Generation
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const { templateId, numVariants, targetDifficulty, ensureUniqueness } = req.body;
      
      if (!templateId || !numVariants) {
        return res.status(400).json({ message: "Template ID and number of variants are required" });
      }

      const result = await questionGenerator.generateQuestions({
        templateId,
        numVariants: parseInt(numVariants),
        targetDifficulty: targetDifficulty ? parseFloat(targetDifficulty) : undefined,
        ensureUniqueness: ensureUniqueness !== false
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate questions", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/questions", async (req, res) => {
    try {
      const { templateId } = req.query;
      const questions = templateId 
        ? await storage.getGeneratedQuestionsByTemplate(templateId as string)
        : await storage.getGeneratedQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/questions/statistics", async (req, res) => {
    try {
      const { templateId } = req.query;
      const stats = await questionGenerator.getQuestionStatistics(templateId as string);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question statistics", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Assignments
  app.get("/api/assignments", async (req, res) => {
    try {
      const { instructorId } = req.query;
      const assignments = instructorId
        ? await storage.getAssignmentsByInstructor(instructorId as string)
        : await storage.getAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const assignmentData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create assignment", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  app.post("/api/assignments/:id/generate-questions", async (req, res) => {
    try {
      const { id: assignmentId } = req.params;
      const { studentIds, questionsPerStudent = 3 } = req.body;

      if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({ message: "Student IDs array is required" });
      }

      const result = await questionGenerator.generateQuestionsForAssignment(
        assignmentId,
        studentIds,
        parseInt(questionsPerStudent)
      );

      res.json({ 
        message: "Questions generated successfully",
        studentQuestions: Object.fromEntries(result)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate assignment questions", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Student Assignments
  app.get("/api/student-assignments", async (req, res) => {
    try {
      const { studentId, assignmentId } = req.query;
      
      let assignments;
      if (studentId) {
        assignments = await storage.getStudentAssignments(studentId as string);
      } else if (assignmentId) {
        assignments = await storage.getStudentAssignmentsByAssignment(assignmentId as string);
      } else {
        return res.status(400).json({ message: "Either studentId or assignmentId is required" });
      }
      
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student assignments", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/student-assignments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Validate specific fields if they exist
      if (updates.status && !['assigned', 'in_progress', 'submitted', 'graded'].includes(updates.status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedAssignment = await storage.updateStudentAssignment(id, updates);
      
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Student assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update student assignment", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Difficulty Analysis
  app.post("/api/analyze/difficulty", async (req, res) => {
    try {
      const { questionText, subject, targetDifficulty } = req.body;
      
      if (!questionText || !subject) {
        return res.status(400).json({ message: "Question text and subject are required" });
      }

      const difficulty = await difficultyAnalyzer.analyzeDifficulty(
        questionText, 
        subject, 
        targetDifficulty ? parseFloat(targetDifficulty) : undefined
      );
      
      res.json({ difficultyScore: difficulty });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze difficulty", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Uniqueness Validation
  app.post("/api/validate/uniqueness", async (req, res) => {
    try {
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Questions array is required" });
      }

      const validation = await uniquenessValidator.validateQuestionSet(questions);
      res.json(validation);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate uniqueness", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/validate/similarity", async (req, res) => {
    try {
      const { question1, question2 } = req.body;
      
      if (!question1 || !question2) {
        return res.status(400).json({ message: "Both questions are required" });
      }

      const similarity = await uniquenessValidator.calculateSimilarity(question1, question2);
      res.json({ similarityScore: similarity });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate similarity", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Plagiarism Detection
  app.post("/api/detect/plagiarism", async (req, res) => {
    try {
      const { studentAnswers } = req.body;
      
      if (!studentAnswers || !Array.isArray(studentAnswers)) {
        return res.status(400).json({ message: "Student answers array is required" });
      }

      const plagiarismChecks = await uniquenessValidator.identifyPlagiarism(studentAnswers);
      res.json({ plagiarismChecks });
    } catch (error) {
      res.status(500).json({ message: "Failed to detect plagiarism", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { subject } = req.query;
      const analytics = subject 
        ? await storage.getAnalyticsBySubject(subject as string)
        : await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/analytics", async (req, res) => {
    try {
      const analyticsData = insertAnalyticsSchema.parse(req.body);
      const analytics = await storage.createAnalytics(analyticsData);
      res.status(201).json(analytics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid analytics data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create analytics", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      // This endpoint might need authentication/authorization in a real app
      res.status(501).json({ message: "User management endpoints not implemented yet" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
