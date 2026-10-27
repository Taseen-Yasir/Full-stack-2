import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import "./AdminActivityDashboard.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  index = 0,
}) {
  return (
    <motion.article
      className="activity-stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="activity-stat-top">
        <span>{label}</span>

        <span className="activity-stat-icon">
          <Icon size={19} />
        </span>
      </div>

      <strong className="activity-stat-value">{value}</strong>
      <span className="activity-stat-detail">{detail}</span>
    </motion.article>
  );
}

export default function AdminActivityDashboard({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [lowScoreData, setLowScoreData] = useState(null);

  const [threshold, setThreshold] = useState("50");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadActivity = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [activityResponse, lowScoreResponse] =
          await Promise.all([
            fetch(`${API_BASE}/admin/activity`, { headers }),
            fetch(
              `${API_BASE}/admin/low-score?threshold=${encodeURIComponent(threshold)}`,
              { headers }
            ),
          ]);

        const activityData = await activityResponse
          .json()
          .catch(() => ({}));

        const lowScoreResult = await lowScoreResponse
          .json()
          .catch(() => ({}));

        if (!activityResponse.ok) {
          throw new Error(
            activityData.message ||
              "Could not load activity statistics."
          );
        }

        if (!lowScoreResponse.ok) {
          throw new Error(
            lowScoreResult.message ||
              "Could not load low-score monitoring."
          );
        }

        setAnalytics(activityData.analytics);
        setLowScoreData(lowScoreResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, threshold]
  );

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  if (loading) {
    return (
      <section className="admin-activity-page">
        <div className="activity-loading">
          <LoaderCircle
            size={28}
            className="activity-spinner"
          />
          <h2>Loading student activity</h2>
          <p>
            Preparing aggregate examination statistics...
          </p>
        </div>
      </section>
    );
  }

  if (error && !analytics) {
    return (
      <section className="admin-activity-page">
        <div className="activity-error">
          <CircleAlert size={25} />
          <h2>Unable to load student activity</h2>
          <p>{error}</p>

          <button
            type="button"
            className="activity-primary-button"
            onClick={() => loadActivity()}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </section>
    );
  }

  const students = analytics?.students || { total: 0 };

  const exams = analytics?.exams || {
    total: 0,
    published: 0,
    drafts: 0,
  };

  const attempts = analytics?.attempts || {
    total: 0,
    completed: 0,
    submitted: 0,
    expired: 0,
    inProgress: 0,
    completionRate: 0,
  };

  const examActivity = analytics?.examActivity || [];
  const lowScoreStudents = lowScoreData?.students || [];

  const primaryStats = [
    {
      label: "Registered students",
      value: students.total,
      detail: "Student accounts only",
      icon: Users,
    },
    {
      label: "Published exams",
      value: exams.published,
      detail: `${exams.total} exams created`,
      icon: BookOpen,
    },
    {
      label: "Total exam attempts",
      value: attempts.total,
      detail: "Across all accounts",
      icon: Activity,
    },
    {
      label: "Average score",
      value:
        analytics?.averageScore == null
          ? "—"
          : `${analytics.averageScore}%`,
      detail: "Finalized attempts only",
      icon: ChartNoAxesColumnIncreasing,
    },
  ];

  const statusStats = [
    {
      label: "Completed attempts",
      value: attempts.completed,
      icon: CheckCircle2,
    },
    {
      label: "In progress",
      value: attempts.inProgress,
      icon: Clock3,
    },
    {
      label: "Expired attempts",
      value: attempts.expired,
      icon: CircleAlert,
    },
    {
      label: "Completion rate",
      value: `${attempts.completionRate}%`,
      icon: ChartNoAxesColumnIncreasing,
    },
  ];

  return (
    <section className="admin-activity-page">
      <header className="activity-page-header">
        <div>
          <div className="activity-eyebrow">
            <ShieldCheck size={15} />
            ADMINISTRATION
          </div>

          <h1>Student activity</h1>

          <p>
            Monitor examination participation, performance,
            and topics that may need further revision.
          </p>
        </div>

        <button
          type="button"
          className="activity-secondary-button"
          onClick={() => loadActivity(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "activity-spinner" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="activity-inline-error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
        </div>
      )}

      <div className="activity-stats-grid">
        {primaryStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            index={index}
          />
        ))}
      </div>

      <section className="activity-section">
        <div className="activity-section-heading">
          <div>
            <h2>Attempt overview</h2>
            <p>
              Completion and expiry status across the platform.
            </p>
          </div>
        </div>

        <div className="activity-status-grid">
          {statusStats.map(({ label, value, icon: Icon }) => (
            <article
              className="activity-status-card"
              key={label}
            >
              <div className="activity-status-icon">
                <Icon size={18} />
              </div>

              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className="activity-time-note">
          <Clock3 size={18} />

          <div>
            <strong>Average examination time</strong>
            <p>
              {analytics?.averageTimeSeconds == null
                ? "Not available yet"
                : `${Math.floor(
                    analytics.averageTimeSeconds / 60
                  )} min ${
                    analytics.averageTimeSeconds % 60
                  } sec`}
            </p>
          </div>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-section-heading">
          <div>
            <h2>Low-score monitoring</h2>
            <p>
              Pseudonymous learner references with recent results
              below your chosen threshold.
            </p>
          </div>

          <label className="activity-threshold-control">
            Flag threshold

            <select
              value={threshold}
              onChange={(event) =>
                setThreshold(event.target.value)
              }
            >
              <option value="40">Below 40%</option>
              <option value="50">Below 50%</option>
              <option value="60">Below 60%</option>
              <option value="70">Below 70%</option>
            </select>
          </label>
        </div>

        <div className="activity-risk-summary">
          <div>
            <span>Flagged learner references</span>
            <strong>{lowScoreData?.totalFlagged ?? 0}</strong>
          </div>

          <div>
            <span>Threshold</span>
            <strong>{lowScoreData?.threshold ?? threshold}%</strong>
          </div>
        </div>

        {lowScoreStudents.length === 0 ? (
          <div className="activity-empty-state">
            <CheckCircle2 size={30} />
            <h3>No low-score flags at this threshold</h3>
            <p>
              No student has a latest score or recent average below
              the selected threshold in the scanned records.
            </p>
          </div>
        ) : (
          <div className="activity-risk-list">
            {lowScoreStudents.map((student) => (
              <article
                className="activity-risk-card"
                key={student.learnerCode}
              >
                <div className="activity-risk-header">
                  <div>
                    <span className="activity-risk-kicker">
                      LEARNER REFERENCE
                    </span>

                    <h3>{student.learnerCode}</h3>

                    <p>{student.triggerReason}</p>
                  </div>

                  <div className="activity-risk-score">
                    <strong>{student.recentAverage}%</strong>
                    <span>Recent average</span>
                  </div>
                </div>

                <div className="activity-risk-metrics">
                  <div>
                    <span>Latest score</span>
                    <strong>{student.latestScore}%</strong>
                  </div>

                  <div>
                    <span>Recent attempts reviewed</span>
                    <strong>{student.recentAttemptCount}</strong>
                  </div>
                </div>

                {student.weakTopics?.length > 0 && (
                  <div className="activity-risk-topics">
                    <strong>Topics to review</strong>

                    <div>
                      {student.weakTopics.map((topic) => (
                        <span
                          key={`${student.learnerCode}-${topic.subject}-${topic.topic}`}
                        >
                          {topic.topic} · {topic.accuracy}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="activity-risk-exams">
                  <strong>Recent completed exams</strong>

                  {student.recentResults.map((item, index) => (
                    <div
                      key={`${student.learnerCode}-${index}`}
                    >
                      <span>
                        {item.examTitle} · {item.subject}
                      </span>

                      <strong>{item.percentage}%</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="activity-section">
        <div className="activity-section-heading">
          <div>
            <h2>Activity by examination</h2>
            <p>
              Participation, completion and average result for each exam.
            </p>
          </div>
        </div>

        {examActivity.length === 0 ? (
          <div className="activity-empty-state">
            <BookOpen size={30} />
            <h3>No examination activity yet</h3>
            <p>
              Aggregate results will appear as students attempt
              published examinations.
            </p>
          </div>
        ) : (
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Attempts</th>
                  <th>Completed</th>
                  <th>In progress</th>
                  <th>Average score</th>
                  <th>Latest activity</th>
                </tr>
              </thead>

              <tbody>
                {examActivity.map((item) => (
                  <tr key={String(item.examId)}>
                    <td>
                      <strong>{item.examTitle}</strong>
                      <span>{item.subject}</span>
                    </td>

                    <td>{item.totalAttempts}</td>
                    <td>{item.completedAttempts}</td>
                    <td>{item.inProgressAttempts}</td>

                    <td>
                      {item.averageScore == null
                        ? "—"
                        : `${item.averageScore}%`}
                    </td>

                    <td>{formatDate(item.latestActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="activity-privacy-note">
        <ShieldCheck size={18} />

        <p>
          This dashboard uses pseudonymous learner references.
          It does not display student names, email addresses,
          or direct account identifiers. Only authorized admins
          can access this dashboard and its API.
        </p>
      </div>
    </section>
  );
}