const express = require("express");
const crypto = require("crypto");

const User = require("../models/User");
const Exam = require("../models/Exam");
const Attempt = require("../models/Attempt");

const {
  protect,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

const COMPLETED_STATUSES = ["submitted", "expired"];

// Keep fallback topics useful where question.topic is "General".
function getQuestionTopic(question, exam) {
  const topic =
    typeof question.topic === "string"
      ? question.topic.trim()
      : "";

  return !topic || topic.toLowerCase() === "general"
    ? exam.subject || "General"
    : topic;
}

function getLearnerCode(userId) {
  // Stable pseudonymous identifier; never expose name or email.
  const secret = process.env.JWT_SECRET || "exampro";

  const digest = crypto
    .createHmac("sha256", secret)
    .update(String(userId))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();

  return `Learner-${digest}`;
}

function analyzeRecentTopics(recentAttempts) {
  const topicMap = new Map();

  for (const attempt of recentAttempts) {
    const exam = attempt.exam;

    if (!exam || !Array.isArray(exam.questions)) {
      continue;
    }

    const answers = new Map(
      attempt.answers.map((answer) => [
        answer.questionId.toString(),
        answer.selectedOption,
      ])
    );

    for (const question of exam.questions) {
      const topic = getQuestionTopic(question, exam);
      const key = `${exam.subject || "General"}::${topic}`;

      if (!topicMap.has(key)) {
        topicMap.set(key, {
          topic,
          subject: exam.subject || "General",
          seen: 0,
          correct: 0,
        });
      }

      const stat = topicMap.get(key);
      stat.seen++;

      if (
        answers.has(question._id.toString()) &&
        answers.get(question._id.toString()) ===
          question.correctOption
      ) {
        stat.correct++;
      }
    }
  }

  return Array.from(topicMap.values())
    .map((stat) => ({
      topic: stat.topic,
      subject: stat.subject,
      accuracy: stat.seen
        ? Math.round((stat.correct / stat.seen) * 100)
        : 0,
    }))
    .filter((stat) => stat.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
}

// GET /api/admin/activity
// Aggregate dashboard: no individual student records are returned.
router.get("/activity", protect, requireAdmin, async (req, res) => {
  try {
    const [
      studentCount,
      totalExams,
      publishedExams,
      totalAttempts,
      submittedAttempts,
      expiredAttempts,
      inProgressAttempts,
      scoreStats,
      examActivity,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),

      Exam.countDocuments(),

      Exam.countDocuments({ isPublished: true }),

      Attempt.countDocuments(),

      Attempt.countDocuments({ status: "submitted" }),

      Attempt.countDocuments({ status: "expired" }),

      Attempt.countDocuments({ status: "inProgress" }),

      Attempt.aggregate([
        {
          $match: {
            status: { $in: COMPLETED_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: "$percentage" },
            averageTimeSeconds: {
              $avg: "$timeTakenSeconds",
            },
          },
        },
      ]),

      Attempt.aggregate([
        {
          $group: {
            _id: "$exam",
            totalAttempts: { $sum: 1 },

            submittedAttempts: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "submitted"] },
                  1,
                  0,
                ],
              },
            },

            expiredAttempts: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "expired"] },
                  1,
                  0,
                ],
              },
            },

            inProgressAttempts: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "inProgress"] },
                  1,
                  0,
                ],
              },
            },

            completedAttempts: {
              $sum: {
                $cond: [
                  { $in: ["$status", COMPLETED_STATUSES] },
                  1,
                  0,
                ],
              },
            },

            completedScoreTotal: {
              $sum: {
                $cond: [
                  { $in: ["$status", COMPLETED_STATUSES] },
                  { $ifNull: ["$percentage", 0] },
                  0,
                ],
              },
            },

            latestActivityAt: { $max: "$updatedAt" },
          },
        },

        {
          $lookup: {
            from: Exam.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "exam",
          },
        },

        {
          $unwind: {
            path: "$exam",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 0,
            examId: "$_id",
            examTitle: {
              $ifNull: ["$exam.title", "Deleted exam"],
            },
            subject: {
              $ifNull: ["$exam.subject", "—"],
            },
            totalAttempts: 1,
            submittedAttempts: 1,
            expiredAttempts: 1,
            inProgressAttempts: 1,
            completedAttempts: 1,
            latestActivityAt: 1,

            averageScore: {
              $cond: [
                { $gt: ["$completedAttempts", 0] },
                {
                  $round: [
                    {
                      $divide: [
                        "$completedScoreTotal",
                        "$completedAttempts",
                      ],
                    },
                    1,
                  ],
                },
                null,
              ],
            },
          },
        },

        {
          $sort: {
            totalAttempts: -1,
            latestActivityAt: -1,
          },
        },

        { $limit: 25 },
      ]),
    ]);

    const completedCount =
      submittedAttempts + expiredAttempts;

    const averageScore =
      scoreStats.length && scoreStats[0].averageScore != null
        ? Number(scoreStats[0].averageScore.toFixed(1))
        : null;

    const averageTimeSeconds =
      scoreStats.length &&
      scoreStats[0].averageTimeSeconds != null
        ? Math.round(scoreStats[0].averageTimeSeconds)
        : null;

    return res.json({
      success: true,

      analytics: {
        students: { total: studentCount },

        exams: {
          total: totalExams,
          published: publishedExams,
          drafts: totalExams - publishedExams,
        },

        attempts: {
          total: totalAttempts,
          completed: completedCount,
          submitted: submittedAttempts,
          expired: expiredAttempts,
          inProgress: inProgressAttempts,

          completionRate:
            totalAttempts > 0
              ? Number(
                  (
                    (completedCount / totalAttempts) *
                    100
                  ).toFixed(1)
                )
              : 0,
        },

        averageScore,
        averageTimeSeconds,
        examActivity,
      },
    });
  } catch (error) {
    console.error(
      "Admin activity analytics error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve student activity.",
    });
  }
});

// GET /api/admin/low-score?threshold=50
// Admin-only view of pseudonymous low-score records.
router.get("/low-score", protect, requireAdmin, async (req, res) => {
  try {
    const requestedThreshold = Number(req.query.threshold ?? 50);

    const threshold = Number.isFinite(requestedThreshold)
      ? Math.min(80, Math.max(30, Math.round(requestedThreshold)))
      : 50;

    // Exclude administrator attempts while preserving student privacy.
    const attempts = await Attempt.find({
      status: { $in: COMPLETED_STATUSES },
      submittedAt: { $ne: null },
    })
      .sort({ submittedAt: -1 })
      .populate({
        path: "user",
        match: { role: "student" },
        select: "_id",
      })
      .populate({
        path: "exam",
        select: "title subject questions",
      })
      .limit(5000);

    const byStudent = new Map();

    for (const attempt of attempts) {
      if (!attempt.user?._id) continue;

      const userId = attempt.user._id.toString();

      if (!byStudent.has(userId)) {
        byStudent.set(userId, []);
      }

      byStudent.get(userId).push(attempt);
    }

    const flagged = [];

    for (const [userId, studentAttempts] of byStudent.entries()) {
      // Attempts were sorted newest first.
      const recent = studentAttempts.slice(0, 3);

      const latest = recent[0];

      const recentAverage = Number(
        (
          recent.reduce(
            (sum, item) => sum + (item.percentage || 0),
            0
          ) / recent.length
        ).toFixed(1)
      );

      const latestScore = Number(latest.percentage || 0);

      const latestBelowThreshold = latestScore < threshold;
      const averageBelowThreshold = recentAverage < threshold;

      if (!latestBelowThreshold && !averageBelowThreshold) {
        continue;
      }

      const recentResults = recent.map((attempt) => ({
        examTitle: attempt.exam?.title || "Deleted exam",
        subject: attempt.exam?.subject || "—",
        percentage: attempt.percentage || 0,
        submittedAt: attempt.submittedAt,
      }));

      flagged.push({
        learnerCode: getLearnerCode(userId),
        recentAttemptCount: recent.length,
        recentAverage,
        latestScore,

        triggerReason:
          latestBelowThreshold && averageBelowThreshold
            ? "Latest score and recent average below threshold"
            : latestBelowThreshold
              ? "Latest score below threshold"
              : "Recent average below threshold",

        recentResults,
        weakTopics: analyzeRecentTopics(recent),
      });
    }

    flagged.sort((a, b) => {
      if (a.recentAverage !== b.recentAverage) {
        return a.recentAverage - b.recentAverage;
      }

      return a.latestScore - b.latestScore;
    });

    return res.json({
      success: true,
      threshold,
      totalFlagged: flagged.length,
      scannedAttempts: attempts.length,
      students: flagged.slice(0, 100),
      note:
        "Student names, email addresses and direct identifiers are not included.",
    });
  } catch (error) {
    console.error(
      "Admin low-score monitoring error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve low-score monitoring data.",
    });
  }
});

module.exports = router;