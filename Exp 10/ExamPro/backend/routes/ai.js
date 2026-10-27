const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const DEFAULT_MODEL = "gemini-3.8-flash";
const MAX_QUESTIONS = 20;

// Verify that the request comes from a logged-in ExamPro user.
function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to use the AI Study Assistant.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      success: false,
      message: "Authentication is not configured correctly.",
    });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or expired. Please sign in again.",
    });
  }
}

// Create the Gemini client only on the server.
async function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const { GoogleGenAI } = await import("@google/genai");

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

// Generate a JSON response from Gemini.
async function generateJSON(prompt) {
  const ai = await getGeminiClient();

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("The AI returned an empty response.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The AI returned invalid JSON.");
  }
}

// Validate and normalize generated MCQs.
function validateQuestions(questions, count) {
  if (!Array.isArray(questions) || questions.length !== count) {
    throw new Error(
      `The AI must return exactly ${count} questions.`
    );
  }

  return questions.map((question, index) => {
    if (
      !question ||
      typeof question.questionText !== "string" ||
      !question.questionText.trim() ||
      question.questionText.length > 2000 ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some(
        (option) =>
          typeof option !== "string" ||
          !option.trim() ||
          option.length > 500
      ) ||
      !Number.isInteger(question.correctOption) ||
      question.correctOption < 0 ||
      question.correctOption > 3 ||
      typeof question.explanation !== "string" ||
      !question.explanation.trim() ||
      question.explanation.length > 3000
    ) {
      throw new Error(`The AI returned an invalid MCQ at position ${index + 1}.`);
    }

    const normalizedOptions = question.options.map((option) =>
      option.trim().toLowerCase()
    );

    if (new Set(normalizedOptions).size !== 4) {
      throw new Error(
        `Question ${index + 1} contains duplicate answer options.`
      );
    }

    return {
      questionText: question.questionText.trim(),
      options: question.options.map((option) => option.trim()),
      correctOption: question.correctOption,
      explanation: question.explanation.trim(),
    };
  });
}

// POST /api/ai/generate-questions
router.post("/generate-questions", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const difficulty =
      typeof body.difficulty === "string"
        ? body.difficulty.trim().toLowerCase()
        : "intermediate";

    const count = Number(body.count ?? 5);

    if (topic.length < 2 || topic.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Topic must contain between 2 and 120 characters.",
      });
    }

    if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be beginner, intermediate, or advanced.",
      });
    }

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > MAX_QUESTIONS
    ) {
      return res.status(400).json({
        success: false,
        message: `Choose between 1 and ${MAX_QUESTIONS} questions per practice set.`,
      });
    }

    const prompt = `
You are ExamPro's educational multiple-choice question generator.

Create exactly ${count} original MCQs about:
${JSON.stringify(topic)}

Difficulty: ${difficulty}

Return one valid JSON object with this structure:
{
  "title": "Short descriptive practice-set title",
  "topic": ${JSON.stringify(topic)},
  "difficulty": ${JSON.stringify(difficulty)},
  "questions": [
    {
      "questionText": "A clear, self-contained question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "An accurate, student-friendly explanation"
    }
  ]
}

Requirements:
- Generate exactly ${count} questions.
- Each question must have exactly four distinct, non-empty options.
- correctOption must be a zero-based integer from 0 to 3.
- Exactly one option must be correct.
- Ensure every explanation agrees with the answer key.
- Avoid duplicate or ambiguous questions.
- Avoid repeating the same concept unnecessarily.
- Match the requested difficulty.
- Use accurate educational information.
- Keep explanations clear and concise.
- Return JSON only, without Markdown fences or extra text.
`;

    const result = await generateJSON(prompt);

    if (!result || typeof result !== "object") {
      throw new Error("The AI returned an invalid practice set.");
    }

    const questions = validateQuestions(result.questions, count);

    return res.json({
      success: true,
      message: "Practice questions generated successfully.",
      practiceSet: {
        title:
          typeof result.title === "string" && result.title.trim()
            ? result.title.trim()
            : `${topic} Practice`,
        topic,
        difficulty,
        questions,
      },
    });
  } catch (error) {
    console.error(
      "ExamPro AI question generation failed:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        "The AI could not generate questions right now. Check your API configuration and try again.",
    });
  }
});

// POST /api/ai/explain-answer
router.post("/explain-answer", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};

    const {
      topic,
      question,
      options,
      correctAnswer,
      selectedAnswer,
    } = body;

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 1500 ||
      typeof correctAnswer !== "string" ||
      correctAnswer.length > 500 ||
      typeof selectedAnswer !== "string" ||
      selectedAnswer.length > 500 ||
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 6 ||
      options.some(
        (option) =>
          typeof option !== "string" || option.length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid question, options, and answers.",
      });
    }

    const prompt = `
You are ExamPro's AI tutor.

Topic: ${JSON.stringify(
      typeof topic === "string" ? topic.slice(0, 120) : "General"
    )}

Question: ${JSON.stringify(question)}

Options:
${options
  .map((option, index) => `${index + 1}. ${option}`)
  .join("\n")}

Correct answer supplied by the application:
${JSON.stringify(correctAnswer)}

Student's selected answer:
${JSON.stringify(selectedAnswer)}

Explain why the supplied correct answer is right using clear,
student-friendly language.

If the student's answer is incorrect, politely explain the misconception.
Use a short example if useful.
Do not change or contradict the supplied answer key.
Aim for 100-180 words.
`;

    const ai = await getGeminiClient();

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    if (
      typeof response.text !== "string" ||
      !response.text.trim()
    ) {
      throw new Error("The AI returned an empty explanation.");
    }

    return res.json({
      success: true,
      explanation: response.text.trim(),
    });
  } catch (error) {
    console.error(
      "ExamPro AI explanation failed:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        "The AI could not explain this answer right now. Please try again.",
    });
  }
});

module.exports = router;