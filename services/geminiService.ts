
import { GoogleGenAI, Type } from "@google/genai";
import { TopicExample, CodingTopic, SupportedLanguage, SolutionFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTopicExample = async (topic: CodingTopic, language: SupportedLanguage): Promise<TopicExample> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a realistic ${language} code challenge for the data structure: "${topic.name}".
    
    The output must be a JSON object with:
    - naiveCode: A sub-optimal, "naive", or inefficient implementation of this structure.
    - optimizedCode: The "clean code" and performance-optimized version.
    - explanation: Why the naive version is bad (e.g., O(n) vs O(1), memory leaks, etc).
    - complexityAnalysis: A breakdown of Time and Space complexity for both versions.
    
    Make the examples idiomatic to ${language}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          naiveCode: { type: Type.STRING },
          optimizedCode: { type: Type.STRING },
          explanation: { type: Type.STRING },
          complexityAnalysis: { type: Type.STRING }
        },
        required: ["naiveCode", "optimizedCode", "explanation", "complexityAnalysis"]
      },
      temperature: 0.7,
    },
  });

  const data = JSON.parse(response.text);
  return {
    topicId: topic.id,
    language,
    ...data
  };
};

export const evaluateUserSolution = async (
  naiveCode: string, 
  userCode: string, 
  topicName: string, 
  language: string
): Promise<SolutionFeedback> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate a student's implementation of a ${topicName} in ${language}.
    
    Context:
    - Naive version provided to student: 
    ${naiveCode}
    
    - Student's Refactored version:
    ${userCode}
    
    Assessment criteria:
    1. Correctness: Does it actually work like a ${topicName}?
    2. Efficiency: Is it better than the naive version?
    3. Best Practices: Does it use ${language} idioms correctly?
    
    Provide a score (0-100), comments, and potential improvements.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          comments: { type: Type.STRING },
          improvements: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN }
        },
        required: ["score", "comments", "improvements", "isCorrect"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeCodeForSmells = async (code: string) => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a world-class Software Architect. Analyze the provided code for algorithmic inefficiencies, memory leaks, and architectural flaws.
        
        Provide:
        1. A health score (0-100).
        2. A complete, optimized version.
        3. A detailed list of detected issues with Big O impact.
        
        Code:
        \`\`\`
        ${code}
        \`\`\``,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    refactoredCode: { type: Type.STRING },
                    issues: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                issue: { type: Type.STRING },
                                severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                                reason: { type: Type.STRING },
                                suggestion: { type: Type.STRING },
                                complexityImpact: { type: Type.STRING },
                                patternsViolated: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["issue", "severity", "reason", "suggestion", "complexityImpact", "patternsViolated"]
                        }
                    }
                },
                required: ["score", "refactoredCode", "issues"]
            }
        }
    });

    return JSON.parse(response.text);
};
