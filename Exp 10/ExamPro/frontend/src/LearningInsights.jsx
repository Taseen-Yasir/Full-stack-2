import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Lightbulb,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  Target,
  TrendingUp
} from "lucide-react";
import "./LearningInsights.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

function ScoreTrendChart({ attempts }) {
  const width = 760;
  const height = 255;
  const left = 45;
  const right = 730;
  const top = 32;
  const bottom = 190;

  const pointX = (index) =>
    attempts.length <= 1
      ? (left + right) / 2
      : left + (index * (right - left)) / (attempts.length - 1);

  const pointY = (percentage) => {
    const value = Math.max(0, Math.min(100, Number(percentage) || 0));
    return bottom - (value / 100) * (bottom - top);
  };

  const points = attempts.map((attempt, index) => ({
    ...attempt,
    x: pointX(index),
    y: pointY(attempt.percentage),
  }));

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="learning-chart-wrap">
      <svg
        className="learning-score-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Score trend across completed examinations"
      >
        {[0, 25, 50, 75, 100].map((value) => {
          const y = pointY(value);

          return (
            <g key={value}>
              <line
                x1={left}
                y1={y}
                x2={right}
                y2={y}
                className="learning-chart-grid"
              />

              <text
                x="7"
                y={y + 4}
                className="learning-chart-axis-label"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {points.length > 1 && (
          <polyline
            points={linePoints}
            className="learning-chart-line"
          />
        )}

        {points.map((point, index) => {
          const date = point.date
            ? new Date(point.date)
            : null;

          const dateLabel =
            date && !Number.isNaN(date.getTime())
              ? date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : `Attempt ${index + 1}`;

          return (
            <g key={point.attemptId || `${point.examTitle}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="learning-chart-point"
              >
                <title>
                  {point.examTitle}: {point.percentage}%
                </title>
              </circle>

              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                className="learning-chart-score-label"
              >
                {Math.round(point.percentage)}%
              </text>

              <text
                x={point.x}
                y="222"
                textAnchor="middle"
                className="learning-chart-date-label"
              >
                {dateLabel}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="learning-chart-caption">
        Each point represents one completed examination. The graph
        updates as you complete more exams.
      </p>
    </div>
  );
}

export default function LearningInsights({
  token,
  onPractice,
}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadInsights = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          `${API_BASE}/learning/insights`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load learning insights."
          );
        }

        setInsights(data.insights);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <section className="learning-insights-page">
        <div className="learning-state-card">
          <LoaderCircle
            size={28}
            className="learning-spinner"
          />
          <h2>Analyzing your progress</h2>
          <p>
            Reviewing completed examinations and question topics...
          </p>
        </div>
      </section>
    );
  }

  if (error && !insights) {
    return (
      <section className="learning-insights-page">
        <div className="learning-state-card">
          <CircleAlert size={29} />
          <h2>Unable to load learning insights</h2>
          <p>{error}</p>

          <button
            className="learning-primary-button"
            type="button"
            onClick={() => loadInsights()}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </section>
    );
  }

  const weakTopics = insights?.weakTopics || [];
  const recommendations = insights?.recommendations || [];
  const topicPerformance = insights?.topicPerformance || [];
  const scoreTrend = insights?.scoreTrend || [];

  return (
    <section className="learning-insights-page">
      <header className="learning-page-header">
        <div>
          <div className="learning-eyebrow">
            <BrainCircuit size={15} />
            PERSONALIZED LEARNING
          </div>

          <h1>Learning insights</h1>

          <p>
            Find what needs revision, discover lessons, and track
            your improvement across completed examinations.
          </p>
        </div>

        <button
          type="button"
          className="learning-secondary-button"
          onClick={() => loadInsights(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "learning-spinner" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="learning-inline-error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="learning-summary-grid">
        <article className="learning-summary-card">
          <div>
            <span>Completed exams analyzed</span>
            <BookOpen size={19} />
          </div>
          <strong>{insights?.attemptsAnalyzed ?? 0}</strong>
          <small>
            Up to 100 recent completed attempts are analyzed.
          </small>
        </article>

        <article className="learning-summary-card">
          <div>
            <span>Average score</span>
            <TrendingUp size={19} />
          </div>
          <strong>
            {insights?.averageScore == null
              ? "—"
              : `${insights.averageScore}%`}
          </strong>
          <small>Based on the completed exams analyzed.</small>
        </article>

        <article className="learning-summary-card">
          <div>
            <span>Topics to revise</span>
            <Target size={19} />
          </div>
          <strong>{weakTopics.length}</strong>
          <small>
            Topics with overall accuracy below 70%.
          </small>
        </article>
      </div>

      <section className="learning-section">
        <div className="learning-section-heading">
          <div>
            <div className="learning-section-kicker">
              STUDY RECOMMENDATIONS
            </div>

            <h2>
              {weakTopics.length
                ? "Focus on these topics next"
                : "Keep strengthening your knowledge"}
            </h2>

            <p>
              Recommendations are calculated from the topics assigned
              to your completed exam questions.
            </p>
          </div>
        </div>

        {topicPerformance.length === 0 ? (
          <div className="learning-state-card compact">
            <BookOpen size={29} />
            <h3>No topic data yet</h3>
            <p>
              Complete an examination with topic-labelled questions
              to unlock topic analysis and personalized resources.
            </p>
          </div>
        ) : (
          <div className="learning-topic-grid">
            {recommendations.map((topic, index) => (
              <motion.article
                className="learning-topic-card"
                key={`${topic.subject}-${topic.topic}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="learning-topic-card-top">
                  <span className="learning-topic-icon">
                    {topic.accuracy < 70 ? (
                      <Lightbulb size={20} />
                    ) : (
                      <CheckCircle2 size={20} />
                    )}
                  </span>

                  <span
                    className={`learning-accuracy-badge ${
                      topic.accuracy < 70
                        ? "needs-work"
                        : "steady"
                    }`}
                  >
                    {topic.accuracy}% accuracy
                  </span>
                </div>

                <span className="learning-subject">
                  {topic.subject}
                </span>

                <h3>{topic.topic}</h3>

                <div
                  className="learning-mastery-track"
                  role="img"
                  aria-label={`${topic.accuracy}% topic accuracy`}
                >
                  <div
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>

                <div className="learning-topic-stats">
                  <span>{topic.questionsSeen} question appearances</span>
                  <span>{topic.correct} correct</span>
                  <span>{topic.unanswered} unanswered</span>
                </div>

                <p className="learning-topic-advice">
                  {topic.accuracy < 50
                    ? "Review the fundamentals before attempting harder questions."
                    : topic.accuracy < 70
                      ? "Revisit the main concepts and practise similar questions."
                      : "Continue practising to maintain your progress."}
                </p>

                <div className="learning-topic-actions">
                  <a
                    className="learning-secondary-button"
                    href={topic.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayCircle size={18} />
                    Find YouTube lessons
                    <ExternalLink size={14} />
                  </a>

                  <button
                    type="button"
                    className="learning-primary-button"
                    onClick={() =>
                      onPractice?.(`${topic.subject}: ${topic.topic}`)
                    }
                  >
                    <PlayCircle size={16} />
                    Practise topic
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {topicPerformance.length > 0 &&
          weakTopics.length === 0 && (
            <p className="learning-success-note">
              <CheckCircle2 size={17} />
              No topics are currently below the 70% review threshold
              in the analyzed attempts. Keep practising to validate
              your progress.
            </p>
          )}
      </section>

      <section className="learning-section">
        <div className="learning-section-heading">
          <div>
            <div className="learning-section-kicker">
              PERFORMANCE OVER TIME
            </div>

            <h2>Score improvement</h2>

            <p>
              Compare results across your 12 most recent completed
              examinations.
            </p>
          </div>
        </div>

        {scoreTrend.length === 0 ? (
          <div className="learning-state-card compact">
            <ChartNoAxesColumnIncreasing size={29} />
            <h3>Your graph will appear here</h3>
            <p>
              Complete an examination to start tracking your score
              history.
            </p>
          </div>
        ) : (
          <div className="learning-chart-card">
            <ScoreTrendChart attempts={scoreTrend} />

            <div className="learning-trend-list">
              {scoreTrend.slice().reverse().map((attempt) => (
                <div
                  className="learning-trend-row"
                  key={attempt.attemptId}
                >
                  <div>
                    <strong>{attempt.examTitle}</strong>
                    <span>
                      {attempt.subject || "Exam"} ·{" "}
                      {attempt.date
                        ? new Date(attempt.date).toLocaleDateString()
                        : "Date unavailable"}
                    </span>
                  </div>

                  <div className="learning-trend-score">
                    <strong>{attempt.percentage}%</strong>
                    <small>
                      {attempt.score}/{attempt.totalMarks}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="learning-privacy-note">
        <ShieldCheckIcon />
        <p>
          These insights are generated from your own completed exam
          history. The page does not show other students' results.
        </p>
      </div>
    </section>
  );
}

function ShieldCheckIcon() {
  return <CheckCircle2 size={18} />;
}