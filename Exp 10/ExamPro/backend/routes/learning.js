const express = require("express");
const Attempt = require("../models/Attempt");
const { protect } = require("../middleware/auth");

const router = express.Router();

const COMPLETED_STATUSES = ["submitted", "expired"];

// GET /api/learning/insights
// Returns only the signed-in student's own learning insights.
router.get("/insights", protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({
      user: req.user._id,
      status: { $in: COMPLETED_STATUSES },
    })
      .sort({ submittedAt: -1 })
      .limit(100)
      .populate("exam", "title subject questions");

    const topicMap = new Map();

    for (const attempt of attempts) {
      const exam = attempt.exam;

      if (!exam || !Array.isArray(exam.questions)) {
        continue;
      }

      const answerMap = new Map(
        attempt.answers.map((answer) => [
          answer.questionId.toString(),
          answer.selectedOption,
        ])
      );

      for (const question of exam.questions) {
        // If a question has no meaningful topic, fall back to its subject.
        const rawTopic =
          typeof question.topic === "string"
            ? question.topic.trim()
            : "";

        const topic =
          !rawTopic || rawTopic.toLowerCase() === "general"
            ? exam.subject || "General"
            : rawTopic;

        const subject = exam.subject || "General";
        const key = `${subject}::${topic}`;

        if (!topicMap.has(key)) {
          topicMap.set(key, {
            subject,
            topic,
            questionsSeen: 0,
            answered: 0,
            correct: 0,
            incorrect: 0,
            unanswered: 0,
          });
        }

        const stat = topicMap.get(key);
        stat.questionsSeen++;

        const questionId = question._id.toString();

        if (!answerMap.has(questionId)) {
          stat.unanswered++;
          continue;
        }

        stat.answered++;

        if (
          answerMap.get(questionId) === question.correctOption
        ) {
          stat.correct++;
        } else {
          stat.incorrect++;
        }
      }
    }

    const topicPerformance = Array.from(topicMap.values())
      .map((stat) => ({
        ...stat,

        // Includes unanswered questions in overall topic mastery.
        accuracy: stat.questionsSeen
          ? Math.round(
              (stat.correct / stat.questionsSeen) * 100
            )
          : 0,

        answerAccuracy: stat.answered
          ? Math.round(
              (stat.correct / stat.answered) * 100
            )
          : null,

        completionRate: stat.questionsSeen
          ? Math.round(
              (stat.answered / stat.questionsSeen) * 100
            )
          : 0,

        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${stat.topic} ${stat.subject} tutorial`
        )}`,
      }))
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) {
          return a.accuracy - b.accuracy;
        }

        return b.questionsSeen - a.questionsSeen;
      });

    const weakTopics = topicPerformance.filter(
      (stat) => stat.accuracy < 70
    );

    const recommendations = (
      weakTopics.length
        ? weakTopics
        : topicPerformance.slice(0, 3)
    ).slice(0, 8);

    // The 12 most recent completed exams, shown chronologically.
    const scoreTrend = attempts
      .slice(0, 12)
      .reverse()
      .filter((attempt) => attempt.exam)
      .map((attempt) => ({
        attemptId: attempt._id,
        examTitle: attempt.exam.title,
        subject: attempt.exam.subject,
        date: attempt.submittedAt || attempt.updatedAt,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
      }));

    const totalCompletedAttempts = await Attempt.countDocuments({
      user: req.user._id,
      status: { $in: COMPLETED_STATUSES },
    });

    const completedPercentages = attempts.map(
      (attempt) => attempt.percentage || 0
    );

    const averageScore = completedPercentages.length
      ? Number(
          (
            completedPercentages.reduce(
              (sum, value) => sum + value,
              0
            ) / completedPercentages.length
          ).toFixed(1)
        )
      : null;

    return res.json({
      success: true,

      insights: {
        completedAttempts: totalCompletedAttempts,
        attemptsAnalyzed: attempts.length,
        averageScore,
        topicPerformance,
        weakTopics,
        recommendations,
        scoreTrend,
      },
    });
  } catch (error) {
    console.error(
      "Learning insights error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to calculate learning insights.",
    });
  }
});

module.exports = router;