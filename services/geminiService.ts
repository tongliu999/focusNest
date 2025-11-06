import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel } from "firebase/ai";
import { firebaseConfig } from "../firebaseConfig"; // Import the configuration

import { LearningJourney } from '../types';
import { Type } from "@google/genai";

// Initialize Firebase with your config
const app = initializeApp(firebaseConfig);
const vertexAI = getAI(app);

const learningJourneySchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A concise, engaging title for the entire learning journey based on the provided text."
        },
        modules: {
            type: Type.ARRAY,
            description: "An array of learning modules.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "A short, descriptive title for this specific module."
                    },
                    type: {
                        type: Type.STRING,
                        enum: ["Learn", "Quiz", "Test", "Matching Game"],
                        description: "The type of module."
                    },
                    summary: {
                        type: Type.STRING,
                        description: "A concise summary of the topic. This property should ONLY exist for 'Learn' modules."
                    },
                    keyPoints: {
                        type: Type.ARRAY,
                        description: "An array of 2-4 key takeaways. This property should ONLY exist for 'Learn' modules.",
                        items: { type: Type.STRING }
                    },
                    imagePrompt: {
                        type: Type.STRING,
                        description: "A descriptive prompt for an image generation model to create a helpful diagram or illustration. This property should ONLY exist for 'Learn' modules."
                    },
                    questions: {
                        type: Type.ARRAY,
                        description: "An array of questions. This property should ONLY exist for 'Quiz' or 'Test' modules. A Quiz should have 1-2 questions. A Test should have 3-4 questions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswerIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "options", "correctAnswerIndex", "explanation"]
                        }
                    },
                    instructions: {
                        type: Type.STRING,
                        description: "A short instruction for the matching game. This property should ONLY exist for 'Matching Game' modules."
                    },
                    pairs: {
                        type: Type.ARRAY,
                        description: "An array of term-definition pairs for a 'Matching Game' module. Should contain 3-4 pairs. This property should ONLY exist for 'Matching Game' modules.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                term: { type: Type.STRING },
                                definition: { type: Type.STRING }
                            },
                            required: ["term", "definition"]
                        }
                    }
                },
                required: ["title", "type"]
            }
        }
    },
    required: ["title", "modules"]
};

export const generateLearningJourney = async (text: string): Promise<LearningJourney> => {
    const prompt = `You are an expert instructional designer creating a learning journey for a user with ADHD. Your goal is to transform the provided "Study Material" into an engaging, structured, and visually-appealing learning path.

The output must be a JSON object that strictly follows the provided schema.

**Key Principles for the Learning Journey:**
- **Structure:** Start with foundational "Learn" modules. Group 2-3 "Learn" modules together before introducing an interactive module like a "Quiz" or "Matching Game". End the entire journey with a comprehensive "Test" module.
- **ADHD-Friendly:** Modules should be bite-sized and focused on a single concept.
- **Interactivity:**
    - "Quiz" modules should test specific facts with 1-2 questions.
    - "Matching Game" modules should reinforce terminology with 3-4 pairs.
    - "Test" modules are for final assessment with 3-4 questions.
    - All quiz/test questions MUST have exactly 4 multiple-choice options.
- **Visuals:** For EVERY "Learn" module, you MUST create a descriptive \`imagePrompt\`. This prompt will be used to generate a helpful visual aid. Example: "An infographic showing the water cycle with arrows for evaporation, condensation, and precipitation."
- **App Context:** After every "Quiz", "Matching Game", or "Test", the app automatically inserts a "Brain Break" game. Keep this in mind when sequencing modules.
- **Schema Adherence:** ONLY include properties relevant to the module's \`type\`. For example, a "Quiz" module should not have a \`summary\` or \`keyPoints\`.

**Study Material:**
---
${text}
---

Now, generate the complete learning journey JSON object.`;

    const model = getGenerativeModel(vertexAI, {
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: learningJourneySchema,
        }
    });

    const result = await model.generateContent(prompt);
    
    const jsonResponse = JSON.parse(result.response.text());
    return jsonResponse as LearningJourney;
};

export const generateRefresher = async (topic: string, failedQuestion: string): Promise<string> => {
    const prompt = `A user is struggling with a quiz question on the topic of "${topic}". The question they got wrong was: "${failedQuestion}". 
    
    Please provide a very simple, encouraging, and easy-to-understand explanation or hint to help them understand the core concept without giving away the direct answer. Use an analogy or a real-world example if possible. Keep it under 50 words.`;
    
    const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    
    return result.response.text();
};
