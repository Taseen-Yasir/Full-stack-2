
const express = require("express");
const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");
const { protect, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function hasField(object, field) {
  return Object.prototype.hasOwnProperty.call(object, field);
}

function validateExamData(data) {
  if (
    typeof data.title !== "string" ||
    !data.title.trim() ||
    data.title.trim().length > 150
  ) {
    return "Enter an exam title of up to 150 characters.";
  }

  if (
    typeof data.subject !== "string" ||
    !data.subject.trim()
  ) {
    return "A subject is required.";
  }

  if (
    typeof data.durationMinutes !== "number" ||
    !Number.isInteger(data.durationMinutes) ||
    data.durationMinutes < 1 ||
    data.durationMinutes > 300
  ) {
    return "Duration must be between 1 and 300 minutes.";
  }

  if (typeof data.description !== "string") {
    return "Description must be text.";
  }

  if (typeof data.isPublished !== "boolean") {
    return "Publication status must be true or false.";
  }

  if (
    !Array.isArray(data.questions) ||
    data.questions.length === 0
  ) {
    return "An exam must have at least one question.";
  }

  for (let i = 0; i < data.questions.length; i++) {
    const question = data.questions[i];

    if (
      typeof question.questionText !== "string" ||
      !question.questionText.trim()
    ) {
      return `Question ${i + 1}: enter the question text.`;
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.some(
        (option) =>
          typeof option !== "string" || !option.trim()
      )
    ) {
      return `Question ${i + 1}: provide at least two non-empty options.`;
    }

    if (
      !Number.isInteger(question.correctOption) ||
      question.correctOption < 0 ||
      question.correctOption >= question.options.length
    ) {
      return `Question ${i + 1}: the correct option must reference an existing option.`;
    }

    if (
      question.marks !== undefined &&
      (!Number.isFinite(question.marks) ||
        question.marks < 0.5)
    ) {
      return `Question ${i + 1}: marks must be at least 0.5.`;
    }

    if (
      question.explanation !== undefined &&
      typeof question.explanation !== "string"
    ) {
      return `Question ${i + 1}: explanation must be text.`;
    }

    if (
      question.topic !== undefined &&
      typeof question.topic !== "string"
    ) {
      return `Question ${i + 1}: topic must be text.`;
    }
  }

  return null;
}

// Return exam information without exposing answers.
function studentExamSummary(exam) {
  return {
    _id: exam._id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    durationMinutes: exam.durationMinutes,
    questionCount: exam.questions.length,
    totalMarks: exam.questions.reduce(
      (total, question) =>
        total + (question.marks ?? 1),
      0
    ),
    createdAt: exam.createdAt,
  };
}

function studentExamDetails(exam) {
  return {
    ...studentExamSummary(exam),
    questions: exam.questions.map((question) => ({
      _id: question._id,
      questionText: question.questionText,
      options: question.options,
      marks: question.marks,
      topic: question.topic,
    })),
  };
}

// ADMIN: View every exam, including unpublished exams.
router.get(
  "/admin/all",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const exams = await Exam.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: exams.length,
        exams,
      });
    } catch (error) {
      console.error("Admin exam list error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to retrieve exams.",
      });
    }
  }
);

// ADMIN: View one exam, including its answer key.
router.get(
  "/admin/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam ID.",
        });
      }

      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      res.json({ success: true, exam });
    } catch (error) {
      console.error("Admin exam detail error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to retrieve the exam.",
      });
    }
  }
);

// ADMIN: Create an exam.
router.post(
  "/",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const body = req.body || {};

      const data = {
        title: body.title,
        description: body.description ?? "",
        subject: body.subject,
        durationMinutes: body.durationMinutes,
        questions: body.questions,
        isPublished: body.isPublished ?? false,
      };

      const validationError = validateExamData(data);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const exam = await Exam.create({
        ...data,
        title: data.title.trim(),
        subject: data.subject.trim(),
        description: data.description.trim(),
        createdBy: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: "Exam created successfully.",
        exam,
      });
    } catch (error) {
      console.error("Create exam error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to create the exam.",
      });
    }
  }
);

// ADMIN: Update an exam before any student has attempted it.
router.put(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam ID.",
        });
      }

      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      const body = req.body || {};

const attemptsExist = await Attempt.exists({
  exam: exam._id,
});

// Exams with attempts may only have their publication
// status changed. Their actual content stays protected.
const publishOnlyUpdate =
  Object.keys(body).length === 1 &&
  Object.hasOwn(body, "isPublished") &&
  typeof body.isPublished === "boolean";

if (attemptsExist && !publishOnlyUpdate) {
  return res.status(409).json({
    success: false,
    message:
      "This exam already has student attempts. Its content cannot be edited, but it can be published or unpublished.",
  });
}

      const candidate = {
        title: hasField(body, "title")
          ? body.title
          : exam.title,
        description: hasField(body, "description")
          ? body.description
          : exam.description,
        subject: hasField(body, "subject")
          ? body.subject
          : exam.subject,
        durationMinutes: hasField(body, "durationMinutes")
          ? body.durationMinutes
          : exam.durationMinutes,
        questions: hasField(body, "questions")
          ? body.questions
          : exam.questions,
        isPublished: hasField(body, "isPublished")
          ? body.isPublished
          : exam.isPublished,
      };

      const validationError = validateExamData(candidate);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      candidate.title = candidate.title.trim();
      candidate.subject = candidate.subject.trim();
      candidate.description = candidate.description.trim();

      Object.assign(exam, candidate);
      await exam.save();

      res.json({
        success: true,
        message: "Exam updated successfully.",
        exam,
      });
    } catch (error) {
      console.error("Update exam error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to update the exam.",
      });
    }
  }
);

// ADMIN: Delete an exam that has no attempts.
router.delete(
  "/:id",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam ID.",
        });
      }

      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Exam not found.",
        });
      }

      const attemptsExist = await Attempt.exists({
        exam: exam._id,
      });

      if (attemptsExist) {
        return res.status(409).json({
          success: false,
          message:
            "This exam has student attempts and cannot be deleted.",
        });
      }

      await exam.deleteOne();

      res.json({
        success: true,
        message: "Exam deleted successfully.",
      });
    } catch (error) {
      console.error("Delete exam error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to delete the exam.",
      });
    }
  }
);

// STUDENT: List only published exams.
router.get("/", protect, async (req, res) => {
  try {
    const exams = await Exam.find({ isPublished: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: exams.length,
      exams: exams.map(studentExamSummary),
    });
  } catch (error) {
    console.error("Published exam list error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve published exams.",
    });
  }
});

// STUDENT: Get published exam questions without the answer key.
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findOne({
      _id: req.params.id,
      isPublished: true,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Published exam not found.",
      });
    }

    res.json({
      success: true,
      exam: studentExamDetails(exam),
    });
  } catch (error) {
    console.error("Student exam detail error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve exam questions.",
    });
  }
});

module.exports = router;
