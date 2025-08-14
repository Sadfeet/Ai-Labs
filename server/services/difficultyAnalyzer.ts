import { assessQuestionDifficulty } from "./gemini";

export interface DifficultyMetrics {
  conceptualComplexity: number;
  computationalSteps: number;
  prerequisiteKnowledge: number;
  timeRequired: number;
  overallDifficulty: number;
}

class DifficultyAnalyzer {
  async analyzeDifficulty(
    questionText: string, 
    subject: string, 
    targetDifficulty?: number
  ): Promise<number> {
    try {
      // Use Gemini for initial assessment
      const aiAssessment = await assessQuestionDifficulty(questionText, subject);
      
      // Apply rule-based adjustments
      const ruleBasedScore = this.applyRuleBasedScoring(questionText, subject);
      
      // Combine AI and rule-based scores
      let finalScore = (aiAssessment * 0.7) + (ruleBasedScore * 0.3);
      
      // Adjust towards target difficulty if specified
      if (targetDifficulty) {
        const adjustment = (targetDifficulty - finalScore) * 0.2;
        finalScore = Math.max(1, Math.min(10, finalScore + adjustment));
      }
      
      return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
      
    } catch (error) {
      console.error("Error in difficulty analysis:", error);
      return targetDifficulty || 5.0; // Default to medium difficulty
    }
  }

  private applyRuleBasedScoring(questionText: string, subject: string): number {
    let score = 5.0; // Base score
    
    // Text-based complexity indicators
    const complexity = this.analyzeTextComplexity(questionText);
    score += complexity.lengthFactor;
    score += complexity.vocabularyFactor;
    score += complexity.structureFactor;
    
    // Subject-specific adjustments
    score += this.getSubjectAdjustment(questionText, subject);
    
    // Mathematical complexity
    score += this.analyzeMathematicalComplexity(questionText);
    
    return Math.max(1, Math.min(10, score));
  }

  private analyzeTextComplexity(text: string): {
    lengthFactor: number;
    vocabularyFactor: number;
    structureFactor: number;
  } {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    
    // Length factor (longer questions tend to be more complex)
    const lengthFactor = Math.min(2, words / 50);
    
    // Vocabulary complexity
    const complexWords = (text.match(/\b\w{8,}\b/g) || []).length;
    const vocabularyFactor = Math.min(1.5, complexWords / words * 10);
    
    // Sentence structure complexity
    const avgWordsPerSentence = words / sentences;
    const structureFactor = Math.min(1, avgWordsPerSentence / 15);
    
    return { lengthFactor, vocabularyFactor, structureFactor };
  }

  private getSubjectAdjustment(text: string, subject: string): number {
    const lowerText = text.toLowerCase();
    let adjustment = 0;
    
    switch (subject.toLowerCase()) {
      case 'chemistry lab':
      case 'chemistry':
        if (lowerText.includes('equilibrium')) adjustment += 1;
        if (lowerText.includes('stoichiometry')) adjustment += 0.5;
        if (lowerText.includes('reaction mechanism')) adjustment += 1.5;
        if (lowerText.includes('ph') || lowerText.includes('buffer')) adjustment += 0.5;
        break;
        
      case 'physics lab':
      case 'physics':
        if (lowerText.includes('quantum')) adjustment += 2;
        if (lowerText.includes('electromagnetic')) adjustment += 1;
        if (lowerText.includes('thermodynamics')) adjustment += 1;
        if (lowerText.includes('wave')) adjustment += 0.5;
        break;
        
      case 'biology lab':
      case 'biology':
        if (lowerText.includes('genetics')) adjustment += 1;
        if (lowerText.includes('molecular')) adjustment += 1.5;
        if (lowerText.includes('metabolism')) adjustment += 1;
        if (lowerText.includes('evolution')) adjustment += 0.5;
        break;
        
      case 'computer science':
        if (lowerText.includes('algorithm')) adjustment += 1;
        if (lowerText.includes('complexity')) adjustment += 1.5;
        if (lowerText.includes('recursion')) adjustment += 1;
        if (lowerText.includes('data structure')) adjustment += 0.5;
        break;
    }
    
    return adjustment;
  }

  private analyzeMathematicalComplexity(text: string): number {
    let complexity = 0;
    
    // Count mathematical operations and concepts
    const mathPatterns = [
      /\d+\.?\d*\s*[\+\-\*\/\^]\s*\d+\.?\d*/g, // Basic operations
      /\b(log|ln|sin|cos|tan|sqrt|integral|derivative)\b/gi, // Advanced functions
      /\b(matrix|vector|differential|equation)\b/gi, // Complex concepts
      /\([^)]+\)/g, // Parenthetical expressions
      /\b\d+\.?\d*\s*[×÷±√∫∑]/g // Mathematical symbols
    ];
    
    mathPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        complexity += matches.length * 0.3;
      }
    });
    
    // Check for multi-step calculations
    if (text.includes('step') || text.includes('calculate') || text.includes('solve')) {
      complexity += 0.5;
    }
    
    return Math.min(2, complexity);
  }

  async batchAnalyze(questions: Array<{text: string, subject: string}>): Promise<number[]> {
    const results: number[] = [];
    
    for (const question of questions) {
      try {
        const difficulty = await this.analyzeDifficulty(question.text, question.subject);
        results.push(difficulty);
      } catch (error) {
        console.error(`Error analyzing question difficulty: ${error}`);
        results.push(5.0); // Default difficulty
      }
    }
    
    return results;
  }

  getDifficultyDistribution(scores: number[]): Record<string, number> {
    const distribution = {
      'Easy (1-3)': 0,
      'Medium (4-6)': 0,
      'Hard (7-10)': 0
    };
    
    scores.forEach(score => {
      if (score <= 3) distribution['Easy (1-3)']++;
      else if (score <= 6) distribution['Medium (4-6)']++;
      else distribution['Hard (7-10)']++;
    });
    
    return distribution;
  }

  validateDifficultyBalance(scores: number[], targetDistribution?: Record<string, number>): {
    isBalanced: boolean;
    recommendations: string[];
    currentDistribution: Record<string, number>;
  } {
    const currentDist = this.getDifficultyDistribution(scores);
    const total = scores.length;
    
    const target = targetDistribution || {
      'Easy (1-3)': 0.25,
      'Medium (4-6)': 0.50,
      'Hard (7-10)': 0.25
    };
    
    const recommendations: string[] = [];
    let isBalanced = true;
    
    Object.entries(target).forEach(([level, expectedRatio]) => {
      const currentRatio = currentDist[level] / total;
      const difference = Math.abs(currentRatio - expectedRatio);
      
      if (difference > 0.15) { // 15% tolerance
        isBalanced = false;
        if (currentRatio < expectedRatio) {
          recommendations.push(`Need more ${level} questions`);
        } else {
          recommendations.push(`Too many ${level} questions`);
        }
      }
    });
    
    return {
      isBalanced,
      recommendations,
      currentDistribution: currentDist
    };
  }
}

export const difficultyAnalyzer = new DifficultyAnalyzer();
