import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QuestionGenerationRequest {
  template: string;
  numVariants: number;
  subject: string;
  difficultyLevel: string;
  existingQuestions?: string[];
}

export interface GeneratedQuestionVariant {
  questionText: string;
  answer: string;
  explanation: string;
  variables: Record<string, any>;
  estimatedDifficulty: number;
}

export async function generateQuestionVariants(request: QuestionGenerationRequest): Promise<GeneratedQuestionVariant[]> {
  try {
    const prompt = `You are an expert educational content creator specializing in ${request.subject}. 
    
Generate ${request.numVariants} unique question variants based on this template:
"${request.template}"

Requirements:
- Difficulty level: ${request.difficultyLevel}
- Each variant must be significantly different from others
- Include realistic numerical values and parameters
- Provide complete answers and step-by-step explanations
- Ensure questions test the same learning objectives
- Make questions practical and relevant to lab work

Return a JSON array with this structure:
{
  "questions": [
    {
      "questionText": "Complete question with specific values",
      "answer": "Numerical answer with units",
      "explanation": "Step-by-step solution explanation",
      "variables": {"param1": "value1", "param2": "value2"},
      "estimatedDifficulty": 7.5
    }
  ]
}

The estimatedDifficulty should be a number from 1-10 where:
- 1-3: Basic recall and simple calculations
- 4-6: Application of concepts with moderate complexity
- 7-10: Complex problem-solving requiring multiple steps`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are an expert educational content creator. Generate unique, educationally sound question variants in valid JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionText: { type: "string" },
                  answer: { type: "string" },
                  explanation: { type: "string" },
                  variables: { type: "object" },
                  estimatedDifficulty: { type: "number" }
                },
                required: ["questionText", "answer", "explanation", "variables", "estimatedDifficulty"]
              }
            }
          },
          required: ["questions"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.questions || [];

  } catch (error) {
    console.error("Error generating question variants:", error);
    throw new Error(`Failed to generate question variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function assessQuestionDifficulty(questionText: string, subject: string): Promise<number> {
  try {
    const prompt = `Analyze the difficulty of this ${subject} question and rate it on a scale of 1-10:

"${questionText}"

Consider these factors:
- Conceptual complexity
- Number of steps required
- Mathematical operations involved
- Prerequisites knowledge needed
- Time to solve

Respond with a JSON object containing only the difficulty score:
{"difficultyScore": 7.5}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are an educational assessment expert. Provide objective difficulty ratings for academic questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            difficultyScore: { type: "number" }
          },
          required: ["difficultyScore"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.difficultyScore || 5.0;

  } catch (error) {
    console.error("Error assessing question difficulty:", error);
    return 5.0; // Default difficulty if assessment fails
  }
}

export async function generateQuestionTemplate(subject: string, topic: string, difficultyLevel: string): Promise<string> {
  try {
    const prompt = `Create a question template for ${subject} on the topic of ${topic} at ${difficultyLevel} difficulty level.

The template should:
- Use variables in {brackets} for elements that can be varied
- Be suitable for lab/practical work
- Test understanding of key concepts
- Be clear and unambiguous

Example format: "Calculate the {measurement_type} of a {substance} sample containing {amount} {units} when {condition_description}."

Respond with JSON:
{"template": "your question template here"}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: "You are an expert curriculum designer. Create educational question templates that can generate multiple unique variants.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            template: { type: "string" }
          },
          required: ["template"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.template || "Generic question template";

  } catch (error) {
    console.error("Error generating question template:", error);
    throw new Error(`Failed to generate question template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeSimilarity(question1: string, question2: string): Promise<number> {
  try {
    const prompt = `Compare these two questions and rate their similarity on a scale of 0-1 (0 = completely different, 1 = identical):

Question 1: "${question1}"
Question 2: "${question2}"

Consider:
- Conceptual similarity
- Problem structure
- Required solution approach
- Variable values and context

Respond with JSON:
{"similarityScore": 0.75}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an expert in educational content analysis. Provide accurate similarity assessments between academic questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            similarityScore: { type: "number" }
          },
          required: ["similarityScore"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "{}");
    return result.similarityScore || 0.0;

  } catch (error) {
    console.error("Error analyzing question similarity:", error);
    return 0.0; // Default to no similarity if analysis fails
  }
}