import { storage } from "../storage";
import { generateQuestionVariants, assessQuestionDifficulty, GeneratedQuestionVariant } from "./gemini";
import { uniquenessValidator } from "./uniquenessValidator";
import { difficultyAnalyzer } from "./difficultyAnalyzer";
import type { InsertGeneratedQuestion, QuestionTemplate } from "@shared/schema";

export interface QuestionGenerationOptions {
  templateId: string;
  numVariants: number;
  targetDifficulty?: number;
  ensureUniqueness?: boolean;
}

export interface QuestionGenerationResult {
  generatedQuestions: string[];
  statistics: {
    requested: number;
    generated: number;
    avgDifficulty: number;
    avgUniqueness: number;
    rejectedDuplicates: number;
  };
}

class QuestionGenerator {
  async generateQuestions(options: QuestionGenerationOptions): Promise<QuestionGenerationResult> {
    const template = await storage.getQuestionTemplates().then(templates => 
      templates.find(t => t.id === options.templateId)
    );

    if (!template) {
      throw new Error(`Question template with ID ${options.templateId} not found`);
    }

    // Generate variants using Gemini
    const variants = await generateQuestionVariants({
      template: template.template,
      subject: template.subject,
      difficultyLevel: template.difficultyLevel,
      numVariants: options.numVariants
    });

    const generatedQuestionIds: string[] = [];
    let rejectedDuplicates = 0;
    let totalDifficulty = 0;
    let totalUniqueness = 0;

    for (const variant of variants) {
      try {
        // Assess difficulty if not provided or if we want to override
        let difficultyScore = variant.estimatedDifficulty;
        if (options.targetDifficulty) {
          difficultyScore = await difficultyAnalyzer.analyzeDifficulty(
            variant.questionText, 
            template.subject,
            options.targetDifficulty
          );
        }

        // Check uniqueness if required
        let uniquenessScore = 1.0;
        if (options.ensureUniqueness !== false) {
          const existingQuestions = await storage.getGeneratedQuestionsByTemplate(options.templateId);
          uniquenessScore = await uniquenessValidator.checkUniqueness(
            variant.questionText,
            existingQuestions.map(q => q.questionText)
          );

          // Reject if too similar to existing questions
          if (uniquenessScore < 0.7) {
            rejectedDuplicates++;
            continue;
          }
        }

        // Create the generated question
        const generatedQuestion: InsertGeneratedQuestion = {
          templateId: options.templateId,
          questionText: variant.questionText,
          answer: variant.answer,
          explanation: variant.explanation,
          difficultyScore,
          uniquenessScore,
          metadata: {
            variables: variant.variables,
            generationMethod: "gemini",
            originalTemplate: template.template
          }
        };

        const saved = await storage.createGeneratedQuestion(generatedQuestion);
        generatedQuestionIds.push(saved.id);

        totalDifficulty += difficultyScore;
        totalUniqueness += uniquenessScore;

        // Store similarity check with existing questions if needed
        if (options.ensureUniqueness !== false) {
          const existingQuestions = await storage.getGeneratedQuestionsByTemplate(options.templateId);
          for (const existingQ of existingQuestions) {
            if (existingQ.id !== saved.id) {
              const similarity = await uniquenessValidator.calculateSimilarity(
                variant.questionText,
                existingQ.questionText
              );
              
              if (similarity < 0.95) { // Only store if not too similar
                await storage.createSimilarityCheck({
                  question1Id: saved.id,
                  question2Id: existingQ.id,
                  similarityScore: similarity
                });
              }
            }
          }
        }

      } catch (error) {
        console.error(`Error processing variant: ${error}`);
        continue;
      }
    }

    const generated = generatedQuestionIds.length;
    
    return {
      generatedQuestions: generatedQuestionIds,
      statistics: {
        requested: options.numVariants,
        generated,
        avgDifficulty: generated > 0 ? totalDifficulty / generated : 0,
        avgUniqueness: generated > 0 ? totalUniqueness / generated : 0,
        rejectedDuplicates
      }
    };
  }

  async generateQuestionsForAssignment(
    assignmentId: string, 
    studentIds: string[], 
    questionsPerStudent: number = 3
  ): Promise<Map<string, string[]>> {
    const assignment = await storage.getAssignments().then(assignments =>
      assignments.find(a => a.id === assignmentId)
    );

    if (!assignment) {
      throw new Error(`Assignment with ID ${assignmentId} not found`);
    }

    // Get suitable question templates for the subject
    const templates = await storage.getQuestionTemplatesBySubject(assignment.subject);
    
    if (templates.length === 0) {
      throw new Error(`No question templates found for subject: ${assignment.subject}`);
    }

    const studentQuestions = new Map<string, string[]>();

    for (const studentId of studentIds) {
      const studentQuestionIds: string[] = [];

      // Generate unique questions for each student
      for (let i = 0; i < questionsPerStudent; i++) {
        const template = templates[i % templates.length]; // Rotate through available templates
        
        const result = await this.generateQuestions({
          templateId: template.id,
          numVariants: 1,
          ensureUniqueness: true
        });

        if (result.generatedQuestions.length > 0) {
          const questionId = result.generatedQuestions[0];
          studentQuestionIds.push(questionId);

          // Create student assignment record
          await storage.createStudentAssignment({
            assignmentId,
            studentId,
            questionId,
            status: "assigned"
          });
        }
      }

      studentQuestions.set(studentId, studentQuestionIds);
    }

    return studentQuestions;
  }

  async getQuestionStatistics(templateId?: string): Promise<{
    totalQuestions: number;
    avgDifficulty: number;
    avgUniqueness: number;
    difficultyDistribution: Record<string, number>;
  }> {
    const questions = templateId 
      ? await storage.getGeneratedQuestionsByTemplate(templateId)
      : await storage.getGeneratedQuestions();

    if (questions.length === 0) {
      return {
        totalQuestions: 0,
        avgDifficulty: 0,
        avgUniqueness: 0,
        difficultyDistribution: {}
      };
    }

    const totalDifficulty = questions.reduce((sum, q) => sum + (q.difficultyScore || 0), 0);
    const totalUniqueness = questions.reduce((sum, q) => sum + (q.uniquenessScore || 0), 0);

    // Calculate difficulty distribution
    const difficultyDistribution: Record<string, number> = {
      'Easy (1-3)': 0,
      'Medium (4-6)': 0,
      'Hard (7-10)': 0
    };

    questions.forEach(q => {
      const difficulty = q.difficultyScore || 0;
      if (difficulty <= 3) difficultyDistribution['Easy (1-3)']++;
      else if (difficulty <= 6) difficultyDistribution['Medium (4-6)']++;
      else difficultyDistribution['Hard (7-10)']++;
    });

    return {
      totalQuestions: questions.length,
      avgDifficulty: totalDifficulty / questions.length,
      avgUniqueness: totalUniqueness / questions.length,
      difficultyDistribution
    };
  }
}

export const questionGenerator = new QuestionGenerator();
