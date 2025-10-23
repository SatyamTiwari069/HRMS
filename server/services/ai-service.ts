// Reference: blueprint:javascript_gemini and OPENAI integration
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Validate API keys
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY not set! AI features will fail.');
}
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set! AI features will fail.');
}

// Initialize AI clients
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy" });

export class AIService {
  // Resume parsing with Gemini
  async parseResume(resumeText: string): Promise<{
    skills: string[];
    experience: any;
    summary: string;
  }> {
    try {
      const prompt = `
        Parse the following resume and extract information in JSON format.
        Extract: skills (array of strings), experience (object with years and description), 
        and a brief summary (string).
        
        Resume:
        ${resumeText}
        
        Return only valid JSON with keys: skills, experience, summary
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              skills: {
                type: "array",
                items: { type: "string" }
              },
              experience: {
                type: "object",
                properties: {
                  years: { type: "number" },
                  description: { type: "string" }
                }
              },
              summary: { type: "string" }
            },
            required: ["skills", "experience", "summary"]
          }
        },
        contents: prompt,
      });

      const data = JSON.parse(response.text || "{}");
      return data;
    } catch (error) {
      console.error("Resume parsing error:", error);
      return {
        skills: [],
        experience: { years: 0, description: "" },
        summary: "Failed to parse resume"
      };
    }
  }

  // Score candidate match with job requirements
  async scoreCandidate(resumeData: any, jobRequirements: string[]): Promise<number> {
    try {
      const prompt = `
        Given a candidate's skills and experience, calculate a match score (0-100) 
        against the job requirements.
        
        Candidate Skills: ${JSON.stringify(resumeData.skills)}
        Job Requirements: ${JSON.stringify(jobRequirements)}
        
        Return only a number between 0-100.
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const scoreText = response.text?.trim() || "0";
      const score = parseInt(scoreText.match(/\d+/)?.[0] || "0");
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error("Candidate scoring error:", error);
      return 0;
    }
  }

  // Generate AI performance review summary using Gemini
  async generatePerformanceSummary(review: any): Promise<string> {
    try {
      const prompt = `
        Generate a professional performance review summary based on the following scores and feedback:
        
        Technical Score: ${review.technicalScore}/5
        Communication Score: ${review.communicationScore}/5
        Leadership Score: ${review.leadershipScore}/5
        Teamwork Score: ${review.teamworkScore}/5
        Feedback: ${review.feedback || 'No additional feedback provided'}
        
        Write a concise, professional summary (2-3 sentences) highlighting strengths and areas for improvement.
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Performance summary unavailable";
    } catch (error) {
      console.error("Performance summary error:", error);
      return "Failed to generate performance summary";
    }
  }

  // HR Chatbot with function calling using OpenAI
  async chatbotResponse(message: string, userContext: any): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI HR Assistant for an enterprise HRMS system. You help employees with:
            - Leave balance queries
            - Payslip information
            - Company policies
            - Performance reviews
            - General HR questions
            
            Be professional, helpful, and concise. Use the user's context when available.
            User Role: ${userContext.role}
            `
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Chatbot error:", error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  // Document OCR and analysis with Gemini
  async analyzeDocument(documentText: string): Promise<{
    extractedData: any;
    summary: string;
  }> {
    try {
      const prompt = `
        Analyze this document and extract structured information.
        Identify document type and extract relevant fields.
        
        Document:
        ${documentText}
        
        Return JSON with: documentType (string), extractedData (object with key-value pairs), summary (string)
      `;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              documentType: { type: "string" },
              extractedData: { type: "object" },
              summary: { type: "string" }
            }
          }
        },
        contents: prompt,
      });

      const data = JSON.parse(response.text || "{}");
      return {
        extractedData: data.extractedData || {},
        summary: data.summary || "Document analyzed"
      };
    } catch (error) {
      console.error("Document analysis error:", error);
      return {
        extractedData: {},
        summary: "Failed to analyze document"
      };
    }
  }
}

export const aiService = new AIService();
