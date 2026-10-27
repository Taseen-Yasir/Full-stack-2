
const express = require("express");
const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Exam = require("../models/Exam");
const { protect } = require("../middleware/auth");

const router = express.Router();

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function calculateTotalMarks(exam) {
  return exam.questions.reduce(
    (total, question) => total + (question.marks ?? 1),
    0
  );
}

// Return exam content without correct answers or explanations.
function publicExam(exam) {
  return {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    durationMinutes: exam.durationMinutes,
    totalMarks: calculateTotalMarks(exam),
    questionCount: exam.questions.length,
    questions: exam.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      options: question.options,
      marks: question.marks ?? 1,
      topic: question.topic,
    })),
  };
}

function attemptSummary(attempt) {
  return {
    _id: attempt._id,
    exam: attempt.exam,
    status: attempt.status,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    submittedAt: attempt.submittedAt,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    unansweredCount: attempt.unansweredCount,
    timeTakenSeconds: attempt.timeTakenSeconds,
  };
}

// Validate answers against the exam on the server.
function validateAnswers(rawAnswers, exam) {
  if (!Array.isArray(rawAnswers)) {
    return {
      error: "Answers must be provided as an array.",
    };
  }

  const questionMap = new Map(
    exam.questions.map((question) => [
      question._id.toString(),
      question,
    ])
  );

  const seen = new Set();
  const answers = [];

  for (const answer of rawAnswers) {
    if (
      !answer ||
      typeof answer.questionId !== "string" ||
      !isValidId(answer.questionId)
    ) {
      return {
        error: "An answer contains an invalid question ID.",
      };
    }

    const questionId = answer.questionId;

    if (seen.has(questionId)) {
      return {
        error: "A question cannot have duplicate answers.",
      };
    }

    seen.add(questionId);

    const question = questionMap.get(questionId);

    if (!question) {
      return {
        error: "An answer refers to a question outside this exam.",
      };
    }

    if (
      !Number.isInteger(answer.selectedOption) ||
      answer.selectedOption < 0 ||
      answer.selectedOption >= question.options.length
    ) {
      return {
        error: "An answer contains an invalid option.",
      };
    }

    answers.push({
      questionId: question._id,
      selectedOption: answer.selectedOption,
    });
  }

  return { answers };
}

// Grade using the stored answer key, never a client-provided score.
async function finalizeAttempt(attempt, exam, status) {
  if (attempt.status !== "inProgress") {
    return attempt;
  }

  const answerMap = new Map(
    attempt.answers.map((answer) => [
      answer.questionId.toString(),
      answer.selectedOption,
    ])
  );

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const totalMarks = calculateTotalMarks(exam);

  for (const question of exam.questions) {
    const questionId = question._id.toString();

    if (!answerMap.has(questionId)) {
      unansweredCount++;
      continue;
    }

    const selectedOption = answerMap.get(questionId);

    if (selectedOption === question.correctOption) {
      score += question.marks ?? 1;
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  const submittedAt = new Date();

  const elapsedSeconds = Math.floor(
    (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000
  );

  const maximumSeconds = exam.durationMinutes * 60;

  attempt.score = Number(score.toFixed(2));
  attempt.totalMarks = Number(totalMarks.toFixed(2));
  attempt.percentage =
    totalMarks > 0
      ? Number(((score / totalMarks) * 100).toFixed(2))
      : 0;

  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unansweredCount = unansweredCount;
  attempt.timeTakenSeconds = Math.min(
    maximumSeconds,
    Math.max(0, elapsedSeconds)
  );

  attempt.status = status;
  attempt.submittedAt = submittedAt;

  await attempt.save();

  return attempt;
}

// Automatically finalize an expired attempt when an API request
// checks it. The frontend timer will also submit at zero.
async function finalizeIfExpired(attempt, exam) {
  if (
    attempt.status === "inProgress" &&
    Date.now() >= attempt.expiresAt.getTime()
  ) {
    await finalizeAttempt(attempt, exam, "expired");
  }

  return attempt;
}

// Convert a completed attempt into a detailed results response.
function buildResult(attempt, exam) {
  const answerMap = new Map(
    attempt.answers.map((answer) => [
      answer.questionId.toString(),
      answer.selectedOption,
    ])
  );

  const review = exam.questions.map((question) => {
    const questionId = question._id.toString();
    const hasAnswer = answerMap.has(questionId);
    const selectedOption = hasAnswer
      ? answerMap.get(questionId)
      : null;

    const isCorrect =
      hasAnswer &&
      selectedOption === question.correctOption;

    return {
      questionId: question._id,
      questionText: question.questionText,
      options: question.options,
      selectedOption,
      selectedAnswer:
        selectedOption === null
          ? null
          : question.options[selectedOption],
      correctOption: question.correctOption,
      correctAnswer:
        question.options[question.correctOption],
      isCorrect,
      marks: question.marks ?? 1,
      awardedMarks: isCorrect ? question.marks ?? 1 : 0,
      explanation: question.explanation || "",
      topic: question.topic || "General",
    };
  });

  return {
    ...attemptSummary(attempt),
    exam: {
      _id: exam._id,
      title: exam.title,
      subject: exam.subject,
    },
    review,
  };
}

// START A TIMED ATTEMPT
router.post("/start", protect, async (req, res) => {
  try {
    const { examId } = req.body || {};

    if (
      typeof examId !== "string" ||
      !isValidId(examId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid exam ID.",
      });
    }

    const exam = await Exam.findOne({
      _id: examId,
      isPublished: true,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Published exam not found.",
      });
    }

    const now = new Date();

    const attempt = await Attempt.create({
      user: req.user._id,
      exam: exam._id,
      answers: [],
      status: "inProgress",
      startedAt: now,
      expiresAt: new Date(
        now.getTime() + exam.durationMinutes * 60 * 1000
      ),
      totalMarks: calculateTotalMarks(exam),
    });

    res.status(201).json({
      success: true,
      message: "Examination started.",
      attempt: attemptSummary(attempt),
      exam: publicExam(exam),
    });
  } catch (error) {
    console.error("Start attempt error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to start the examination.",
    });
  }
});

// SAVE OR UPDATE ANSWERS
router.put("/:id/answers", protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const attempt = await Attempt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const exam = await Exam.findById(attempt.exam);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "The associated exam was not found.",
      });
    }

    await finalizeIfExpired(attempt, exam);

    if (attempt.status !== "inProgress") {
      return res.status(409).json({
        success: false,
        message: "The exam is no longer accepting answers.",
        attempt: attemptSummary(attempt),
      });
    }

    const result = validateAnswers(
      req.body?.answers,
      exam
    );

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    attempt.answers = result.answers;
    await attempt.save();

    res.json({
      success: true,
      message: "Answers saved successfully.",
      savedAnswerCount: attempt.answers.length,
      savedAt: new Date(),
    });
  } catch (error) {
    console.error("Save answers error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to save answers.",
    });
  }
});

// SUBMIT AND AUTOMATICALLY EVALUATE
router.post("/:id/submit", protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const attempt = await Attempt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    if (attempt.status !== "inProgress") {
      return res.status(409).json({
        success: false,
        message: "This attempt has already been finalized.",
        attempt: attemptSummary(attempt),
      });
    }

    const exam = await Exam.findById(attempt.exam);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "The associated exam was not found.",
      });
    }

    // Late requests cannot add new answers after the deadline.
    if (Date.now() >= attempt.expiresAt.getTime()) {
      await finalizeAttempt(attempt, exam, "expired");

      return res.json({
        success: true,
        message: "Time expired. Your saved answers were evaluated.",
        attempt: attemptSummary(attempt),
      });
    }

    // Accept the last set of answers sent with the submission.
    if (req.body && Object.prototype.hasOwnProperty.call(
      req.body,
      "answers"
    )) {
      const result = validateAnswers(req.body.answers, exam);

      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      attempt.answers = result.answers;
    }

    await finalizeAttempt(attempt, exam, "submitted");

    res.json({
      success: true,
      message: "Exam submitted and evaluated successfully.",
      result: buildResult(attempt, exam),
    });
  } catch (error) {
    console.error("Submit attempt error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to submit the examination.",
    });
  }
});

// STUDENT'S OWN ATTEMPT HISTORY
router.get("/history", protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({
      user: req.user._id,
    })
      .populate("exam", "title subject durationMinutes")
      .sort({ createdAt: -1 });

    const history = attempts.map((attempt) => ({
      ...attemptSummary(attempt),
      exam: attempt.exam
        ? {
            _id: attempt.exam._id,
            title: attempt.exam.title,
            subject: attempt.exam.subject,
            durationMinutes: attempt.exam.durationMinutes,
          }
        : null,
    }));

    res.json({
      success: true,
      count: history.length,
      attempts: history,
    });
  } catch (error) {
    console.error("Attempt history error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve attempt history.",
    });
  }
});

// VIEW ATTEMPT OR COMPLETED RESULTS
router.get("/:id", protect, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    const attempt = await Attempt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found.",
      });
    }

    const exam = await Exam.findById(attempt.exam);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "The associated exam was not found.",
      });
    }

    await finalizeIfExpired(attempt, exam);

    if (attempt.status === "inProgress") {
      return res.json({
        success: true,
        message: "Examination is in progress.",
        attempt: attemptSummary(attempt),
        exam: publicExam(exam),
      });
    }

    res.json({
      success: true,
      result: buildResult(attempt, exam),
    });
  } catch (error) {
    console.error("Get attempt error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve the attempt.",
    });
  }
});

module.exports = router;
