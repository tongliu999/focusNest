
import { getAI, getGenerativeModel } from "firebase/ai";
import { app } from "./firebase"; // Import the initialized app
import { LearningJourney } from '../types';
import { Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import jsPDF from 'jspdf';

// Initialize Firebase with your config
const vertexAI = getAI(app);

const learningJourneySchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A creative, engaging, and descriptive title for the entire learning journey. The title should be 3-5 words and accurately reflect the core topic of the provided text. For example, if the text is about photosynthesis, a good title would be 'The Magic of Sunlight' or 'Decoding Plant Power'."
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
                        enum: ["Learn", "Quiz", "Test", "Matching Game", "Assignment"],
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
                        description: "An array of questions. This property should ONLY exist for 'Quiz', 'Test' or 'Assignment' modules. A Quiz should have 1-2 questions. A Test should have 3-4 questions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswerIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question"]
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

// FIX: Removed the onUpdate parameter and switched to non-streaming generateContent
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

    const model = getGenerativeModel(
        vertexAI,
        {
            model: "gemini-2.5-flash", // Updated model name for clarity
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: learningJourneySchema,
            }
        }
    );

    // FIX: Switched to the non-streaming generateContent method
    const result = await model.generateContent(prompt);
    
    const jsonText = result.response.text();
    return JSON.parse(jsonText) as LearningJourney;
};

export const generateRefresher = async (topic: string, failedQuestion: string): Promise<string> => {
    const prompt = `A user is struggling with a quiz question on the topic of "${topic}". The question they got wrong was: "${failedQuestion}". 
    
    Please provide a very simple, encouraging, and easy-to-understand explanation or hint to help them understand the core concept without giving away the direct answer. Use an analogy or a real-world example if possible. Keep it under 50 words.`;
    
    const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    return result.response.text();
};

export const generateAssignmentJourney = async (text: string): Promise<LearningJourney> => {
    const prompt = `You are an expert instructional designer. Your task is to transform the provided "Assignment" into a structured learning journey.

The output must be a JSON object that strictly follows the provided schema, with a few key differences:
- The journey should consist of a series of "Learn" and "Assignment" modules.
- For each question in the assignment, create one "Learn" module and one "Assignment" module.
- The "Learn" module should teach the user the concepts needed to answer the question.
- The "Assignment" module should contain the question from the assignment.
- The "Assignment" module should have a "questions" property with a single question object.
- The question object in the "Assignment" module should not have "options", "correctAnswerIndex", or "explanation".

**Assignment:**
---
${text}
---

Now, generate the complete learning journey JSON object.`;

    const model = getGenerativeModel(
        vertexAI,
        {
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: learningJourneySchema,
            }
        }
    );

    const result = await model.generateContent(prompt);
    
    const jsonText = result.response.text();
    return JSON.parse(jsonText) as LearningJourney;
};

export const checkAnswer = async (question: string, answer: string): Promise<{ correct: boolean, feedback: string }> => {
    const prompt = `A user has answered the following question: "${question}" with the following answer: "${answer}". 
    
    Please determine if the answer is correct. If it is, respond with "Correct!". If it is not, please provide a short, helpful feedback on how to improve the answer.`;
    
    const model = getGenerativeModel(vertexAI, { model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    const feedback = result.response.text();
    const correct = feedback.toLowerCase().includes('correct');

    return { correct, feedback };
};

export const generatePdf = (answers: { [key: string]: string }) => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.text('Assignment Answers', 10, y);
    y += 10;
    doc.setFontSize(12);
    Object.entries(answers).forEach(([question, answer]) => {
        doc.text(`Q: ${question}`, 10, y);
        y += 7;
        doc.text(`A: ${answer}`, 15, y);
        y += 10;
    });
    doc.save('assignment.pdf');
};

export const getTextFromImage = async (file: File): Promise<string> => {
    const model = getGenerativeModel(vertexAI, {
        model: "gemini-2.5-flash",
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        ],
    });

    const toBase64 = (file: File) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const base64Image = await toBase64(file);

    const result = await model.generateContent([
        "Please extract the text from this image. If there is no text, please say so.",
        {
            inlineData: {
                mimeType: file.type,
                data: base64Image as string,
            },
        },
    ]);
    return result.response.text();
};

export const getTextFromPdf = async (file: File): Promise<string> => {
    const model = getGenerativeModel(vertexAI, {
        model: "gemini-2.5-flash",
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        ],
    });

    const toBase64 = (file: File) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const base64Pdf = await toBase64(file);

    const result = await model.generateContent([
        "Please extract the text from this PDF. If there is no text, please say so.",
        {
            inlineData: {
                mimeType: file.type,
                data: base64Pdf as string,
            },
        },
    ]);
    return result.response.text();
}
