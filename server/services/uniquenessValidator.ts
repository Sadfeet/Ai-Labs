class UniquenessValidator {
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly HIGH_SIMILARITY_THRESHOLD = 0.9;

  async checkUniqueness(newQuestion: string, existingQuestions: string[]): Promise<number> {
    if (existingQuestions.length === 0) {
      return 1.0; // Perfect uniqueness if no existing questions
    }

    const similarities = await Promise.all(
      existingQuestions.map(existing => this.calculateSimilarity(newQuestion, existing))
    );

    // Return the inverse of the highest similarity (lower similarity = higher uniqueness)
    const maxSimilarity = Math.max(...similarities);
    return Math.max(0, 1 - maxSimilarity);
  }

  async calculateSimilarity(question1: string, question2: string): Promise<number> {
    // Combine multiple similarity metrics for robust comparison
    const lexicalSim = this.calculateLexicalSimilarity(question1, question2);
    const structuralSim = this.calculateStructuralSimilarity(question1, question2);
    const semanticSim = await this.calculateSemanticSimilarity(question1, question2);

    // Weighted combination of similarity metrics
    return (lexicalSim * 0.3) + (structuralSim * 0.3) + (semanticSim * 0.4);
  }

  private calculateLexicalSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);

    // Jaccard similarity
    const intersection = new Set(Array.from(words1).filter(word => words2.has(word)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  private calculateStructuralSimilarity(text1: string, text2: string): number {
    // Compare sentence structure patterns
    const structure1 = this.extractStructure(text1);
    const structure2 = this.extractStructure(text2);

    // Calculate Levenshtein distance between structures
    const distance = this.levenshteinDistance(structure1, structure2);
    const maxLength = Math.max(structure1.length, structure2.length);

    return 1 - (distance / maxLength);
  }

  private async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    try {
      // Use Gemini for semantic similarity analysis
      const { analyzeSimilarity } = await import('./gemini');
      return await analyzeSimilarity(text1, text2);
    } catch (error) {
      console.error('Error calculating semantic similarity with Gemini:', error);
      
      // Fallback to concept-based similarity
      const concepts1 = this.extractConcepts(text1);
      const concepts2 = this.extractConcepts(text2);

      if (concepts1.size === 0 && concepts2.size === 0) return 1.0;
      if (concepts1.size === 0 || concepts2.size === 0) return 0.0;

      const intersection = new Set(Array.from(concepts1).filter(concept => concepts2.has(concept)));
      const union = new Set([...Array.from(concepts1), ...Array.from(concepts2)]);

      return intersection.size / union.size;
    }
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
    );
  }

  private extractStructure(text: string): string {
    // Create a simplified structural representation
    return text
      .replace(/\d+\.?\d*/g, 'NUM') // Replace numbers with NUM
      .replace(/[A-Z][a-z]+/g, 'WORD') // Replace capitalized words with WORD
      .replace(/[a-z]+/g, 'word') // Replace lowercase words with word
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractConcepts(text: string): Set<string> {
    const concepts = new Set<string>();
    
    // Scientific units
    const units = text.match(/\b(mol|gram|liter|meter|second|kelvin|pascal|joule|watt|ampere|volt|ohm|newton|celsius|fahrenheit)\b/gi);
    if (units) units.forEach(unit => concepts.add(unit.toLowerCase()));

    // Mathematical operations
    const operations = text.match(/\b(calculate|solve|find|determine|compute|derive|integrate|differentiate)\b/gi);
    if (operations) operations.forEach(op => concepts.add(op.toLowerCase()));

    // Scientific concepts
    const scienceConcepts = text.match(/\b(molarity|concentration|pressure|temperature|velocity|acceleration|force|energy|power|current|voltage|resistance|frequency|wavelength|ph|buffer|equilibrium|reaction|solution|compound|element|atom|molecule|ion)\b/gi);
    if (scienceConcepts) scienceConcepts.forEach(concept => concepts.add(concept.toLowerCase()));

    // Chemical formulas (simplified detection)
    const formulas = text.match(/\b[A-Z][a-z]?[0-9]*(?:[A-Z][a-z]?[0-9]*)*/g);
    if (formulas) formulas.forEach(formula => concepts.add(formula));

    return concepts;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  async validateQuestionSet(questions: string[]): Promise<{
    isValid: boolean;
    duplicates: Array<{question1: number, question2: number, similarity: number}>;
    avgUniqueness: number;
    recommendations: string[];
  }> {
    const duplicates: Array<{question1: number, question2: number, similarity: number}> = [];
    const similarities: number[] = [];

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const similarity = await this.calculateSimilarity(questions[i], questions[j]);
        similarities.push(1 - similarity); // Convert to uniqueness

        if (similarity > this.HIGH_SIMILARITY_THRESHOLD) {
          duplicates.push({
            question1: i,
            question2: j,
            similarity
          });
        }
      }
    }

    const avgUniqueness = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 1.0;
    const isValid = duplicates.length === 0 && avgUniqueness >= this.SIMILARITY_THRESHOLD;

    const recommendations: string[] = [];
    if (duplicates.length > 0) {
      recommendations.push(`Found ${duplicates.length} highly similar question pairs`);
      recommendations.push("Consider regenerating questions with higher variation parameters");
    }
    if (avgUniqueness < this.SIMILARITY_THRESHOLD) {
      recommendations.push("Overall uniqueness is below threshold");
      recommendations.push("Increase template variety or generation parameters");
    }

    return {
      isValid,
      duplicates,
      avgUniqueness,
      recommendations
    };
  }

  async identifyPlagiarism(studentAnswers: Array<{studentId: string, answer: string}>): Promise<Array<{
    student1: string;
    student2: string;
    similarity: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>> {
    const plagiarismChecks: Array<{
      student1: string;
      student2: string;
      similarity: number;
      riskLevel: 'low' | 'medium' | 'high';
    }> = [];

    for (let i = 0; i < studentAnswers.length; i++) {
      for (let j = i + 1; j < studentAnswers.length; j++) {
        const similarity = await this.calculateSimilarity(
          studentAnswers[i].answer,
          studentAnswers[j].answer
        );

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (similarity > 0.9) riskLevel = 'high';
        else if (similarity > 0.7) riskLevel = 'medium';

        if (riskLevel !== 'low') {
          plagiarismChecks.push({
            student1: studentAnswers[i].studentId,
            student2: studentAnswers[j].studentId,
            similarity,
            riskLevel
          });
        }
      }
    }

    return plagiarismChecks;
  }
}

export const uniquenessValidator = new UniquenessValidator();
