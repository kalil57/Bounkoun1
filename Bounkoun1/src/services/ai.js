import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard lazy initialization of Gemini API client
let aiInstance = null;

export function getGeminiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Falling back to mock services.");
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Suggest 3-4 professional academic thesis topics based on general interests and academic level.
 * @param {string} interest - Raw student interest text
 * @param {string} academicLevel - Bachelor, Master, or PhD
 * @returns {Promise<string[]>}
 */
export async function suggestTopics(interest, academicLevel) {
  const ai = getGeminiClient();
  const cleanInterest = interest || "Modern Decentralized Technology";
  const level = academicLevel || "Bachelor";

  if (!ai) {
    // Elegant fallback if no API key is specified
    return [
      `An Empirical Study of ${cleanInterest} in Modern Sectors`,
      `The Impact of ${cleanInterest} on Sustainable Growth`,
      `Design and Optimization of ${cleanInterest} Frameworks for ${level} Dissertations`
    ];
  }

  try {
    const prompt = `As an expert academic advisor, generate exactly 4 compelling, rigorous, and highly feasible thesis topics for a student at the "${level}" level. 
The topics must directly expand on the following area of interest: "${cleanInterest}".
Ensure each topic title is polished, specific, and matches the rigor expected of a ${level} level paper.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite university research director guiding students to design feasible, innovative thesis topics.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "List of 4 proposed academic thesis topic titles."
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini.");
  } catch (error) {
    console.error("Error in Gemini suggestTopics:", error);
    return [
      `Comparative Analysis of ${cleanInterest} Paradigms`,
      `Socio-Technical Challenges of ${cleanInterest}`,
      `Optimizing ${cleanInterest} Lifecycle Frameworks`
    ];
  }
}

/**
 * Generate 3-4 candidate research questions corresponding to the selected topic and academic level.
 * @param {string} topic - The chosen thesis topic
 * @param {string} academicLevel - Bachelor, Master, or PhD
 * @returns {Promise<string[]>}
 */
export async function suggestQuestions(topic, academicLevel) {
  const ai = getGeminiClient();
  const cleanTopic = topic || "the chosen academic research topic";
  const level = academicLevel || "Bachelor";

  if (!ai) {
    return [
      `How does ${cleanTopic} impact performance?`,
      `What are the primary operational challenges when deploying ${cleanTopic}?`,
      `To what extent does ${cleanTopic} satisfy key criteria?`
    ];
  }

  try {
    const prompt = `As a university advisor, formulate exactly 4 high-quality, precise, and scientifically sound research questions for the following thesis topic: "${cleanTopic}".
The questions must align perfectly with the academic rigor expectations of the "${level}" degree level. 
Master and PhD level questions should involve evaluation of variables, relationships, or multi-dimensional constructs, while Bachelor questions should be highly descriptive and feasible.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert scientific methodologist advising thesis students on formulating research questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          },
          description: "List of exactly 4 candidate research questions."
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini.");
  } catch (error) {
    console.error("Error in Gemini suggestQuestions:", error);
    return [
      `To what extent does ${cleanTopic} impact operational outputs?`,
      `What are the primary hurdles during integration of ${cleanTopic}?`,
      `How does ${cleanTopic} influence organizational metrics?`
    ];
  }
}

/**
 * Evaluate and validate a drafted research question against academic standards of clarity, scope, and rigor.
 * @param {string} question - The draft research question
 * @param {string} academicLevel - Bachelor, Master, or PhD
 * @returns {Promise<{ is_valid: boolean, feedback: string }>}
 */
export async function validateQuestion(question, academicLevel) {
  const ai = getGeminiClient();
  const level = academicLevel || "Bachelor";

  if (!ai) {
    if (!question || question.length < 15) {
      return {
        is_valid: false,
        feedback: "The question is too short. Please formulate a complete research question."
      };
    }
    return {
      is_valid: true,
      feedback: "Valid question. Ready for thesis formulation."
    };
  }

  try {
    const prompt = `Review the following drafted research question: "${question}"
Evaluate its scientific validity and rigor for a "${level}" degree thesis.
Is it specific, focused, scientifically testable, and end with a question mark?
Provide constructive feedback to help the student improve or refine it, and decide whether it is valid or if it needs revisions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a dissertation review committee member assessing student research questions for academic rigor.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_valid: {
              type: Type.BOOLEAN,
              description: "True if the question is of high academic quality and ready as is."
            },
            feedback: {
              type: Type.STRING,
              description: "Comprehensive advice, critique, and positive suggestions for refinement."
            }
          },
          required: ["is_valid", "feedback"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini validation.");
  } catch (error) {
    console.error("Error in Gemini validateQuestion:", error);
    return {
      is_valid: question.trim().endsWith("?") && question.length > 25,
      feedback: "Standard validation completed. Ensure the question evaluates clear dependent and independent variables."
    };
  }
}
