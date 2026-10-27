import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Clock3,
  ArrowRight,
  Sparkles,
  Target,
  ChartNoAxesColumnIncreasing,
  Search,
  Bell,
  ChevronRight,
  Zap,
  ShieldCheck,
  GraduationCap,
  LogOut,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  RotateCcw,
  LoaderCircle,
  Sun,
  Moon,
} from "lucide-react";

import Auth from "./Auth";
import AdminPanel from "./AdminPanel";
import AIStudyAssistant from "./AIStudyAssistant";
import AdminActivityDashboard from "./AdminActivityDashboard";
import LearningInsights from "./LearningInsights";
import "./App.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

async function apiRequest(token, path, options = {}) {
  const { body, headers: customHeaders, ...rest } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...customHeaders,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

function toAnswerArray(answerMap) {
  return Object.entries(answerMap).map(
    ([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    })
  );
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, totalSeconds || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const token = sessionStorage.getItem("exampro_token");
      const storedUser = sessionStorage.getItem("exampro_user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      return token && user?.id && user?.name
        ? { token, user }
        : null;
    } catch {
      sessionStorage.removeItem("exampro_token");
      sessionStorage.removeItem("exampro_user");
      return null;
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("exampro-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });

  const [roleChecked, setRoleChecked] = useState(false);
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");

  const [running, setRunning] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedQuestions, setMarkedQuestions] = useState([]);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [startingExamId, setStartingExamId] = useState("");
  const [savingState, setSavingState] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);

  // This state must be declared at component level, not inside
  // the session initializer.
  const [practiceTopic, setPracticeTopic] = useState("");

  const saveQueueRef = useRef(Promise.resolve());
  const submitLockRef = useRef(false);
  const submitHandlerRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("exampro-theme", theme);
    } catch {
      // Theme continues to work if browser storage is unavailable.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  }

  // Verify administrator access from the backend.
  useEffect(() => {
    if (!session?.token) {
      setRoleChecked(false);
      return undefined;
    }

    let cancelled = false;
    setRoleChecked(false);

    async function checkAdminRole() {
      try {
        await apiRequest(session.token, "/exams/admin/all");

        if (cancelled) return;

        const updatedUser = {
          ...session.user,
          role: "admin",
        };

        sessionStorage.setItem(
          "exampro_user",
          JSON.stringify(updatedUser)
        );

        setSession((current) =>
          current?.token === session.token
            ? { ...current, user: updatedUser }
            : current
        );
      } catch {
        // A student receives 403 and remains a student.
      } finally {
        if (!cancelled) {
          setRoleChecked(true);
        }
      }
    }

    checkAdminRole();

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  // Load exams and the current user's own exam history.
  useEffect(() => {
    if (!session?.token) return undefined;

    let cancelled = false;

    async function loadData() {
      setDataLoading(true);
      setDataError("");

      try {
        const data = await apiRequest(session.token, "/exams");

        if (!cancelled) {
          setExams(data.exams || []);
        }
      } catch (error) {
        if (!cancelled) {
          setDataError(error.message);
        }
      }

      try {
        const data = await apiRequest(
          session.token,
          "/attempts/history"
        );

        if (!cancelled) {
          setHistory(data.attempts || []);
        }
      } catch (error) {
        console.error(
          "Could not load attempt history:",
          error.message
        );

        if (!cancelled) {
          setHistory([]);
        }
      }

      if (!cancelled) {
        setDataLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  // Countdown for official examination attempts.
  useEffect(() => {
    if (!running) return undefined;

    function tick() {
      const deadline = new Date(
        running.attempt.expiresAt
      ).getTime();

      const seconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      setRemainingSeconds((previous) =>
        previous === seconds ? previous : seconds
      );

      if (seconds === 0) {
        submitHandlerRef.current?.(true);
      }
    }

    tick();

    const timer = window.setInterval(tick, 250);

    return () => window.clearInterval(timer);
  }, [running]);

  function handleAuthenticated(data) {
    sessionStorage.setItem("exampro_token", data.token);

    sessionStorage.setItem(
      "exampro_user",
      JSON.stringify(data.user)
    );

    setSession(data);
    setActive("Overview");
    setNotice("");
    setRoleChecked(false);
    setPracticeTopic("");
  }

  function handleLogout() {
    if (running) {
      setNotice(
        "Submit your current examination before logging out."
      );
      return;
    }

    sessionStorage.removeItem("exampro_token");
    sessionStorage.removeItem("exampro_user");

    setSession(null);
    setActive("Overview");
    setSearch("");
    setNotice("");
    setResult(null);
    setAnswers({});
    setPracticeTopic("");
    setRoleChecked(false);
  }

  function selectPage(label) {
    const isAdmin = session?.user?.role === "admin";

    // Prevent inappropriate navigation through stale UI state.
    if (
      isAdmin &&
      ["Explore exams", "My results", "Learning insights"].includes(label)
    ) {
      return;
    }

    if (
      !isAdmin &&
      ["Admin panel", "Student activity"].includes(label)
    ) {
      return;
    }

    if (running && label !== "Take exam") {
      setNotice(
        "Finish your current examination before leaving it."
      );
      return;
    }

    setActive(label);
    setSearch("");
    setNotice("");

    if (label !== "My results") {
      setResult(null);
    }

    if (label === "Explore exams") {
      window.setTimeout(() => {
        document
          .getElementById("exam-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  async function refreshHistory() {
    if (!session?.token) return;

    try {
      const data = await apiRequest(
        session.token,
        "/attempts/history"
      );

      setHistory(data.attempts || []);
    } catch (error) {
      console.error(
        "Could not refresh attempt history:",
        error.message
      );
    }
  }

  async function startExam(examId) {
    if (
      running ||
      startingExamId ||
      session?.user?.role === "admin"
    ) {
      return;
    }

    setStartingExamId(examId);
    setNotice("");
    setDataError("");

    try {
      const data = await apiRequest(
        session.token,
        "/attempts/start",
        {
          method: "POST",
          body: { examId },
        }
      );

      setRunning({
        attempt: data.attempt,
        exam: data.exam,
      });

      setAnswers({});
      setMarkedQuestions([]);
      setCurrentIndex(0);
      setResult(null);
      setActive("Take exam");
      setSavingState("All answers saved");

      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil(
            (new Date(data.attempt.expiresAt).getTime() -
              Date.now()) /
              1000
          )
        )
      );

      saveQueueRef.current = Promise.resolve();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setStartingExamId("");
    }
  }

  function selectAnswer(questionId, selectedOption) {
    if (!running || submitting) return;

    const nextAnswers = {
      ...answers,
      [questionId]: selectedOption,
    };

    setAnswers(nextAnswers);
    setSavingState("Saving answers…");

    const attemptId = running.attempt._id;

    const payload = {
      answers: toAnswerArray(nextAnswers),
    };

    saveQueueRef.current = saveQueueRef.current
      .catch(() => {})
      .then(() =>
        apiRequest(
          session.token,
          `/attempts/${attemptId}/answers`,
          {
            method: "PUT",
            body: payload,
          }
        )
      )
      .then(() => {
        setSavingState("All answers saved");
      })
      .catch((error) => {
        setSavingState(`Save failed: ${error.message}`);
        throw error;
      });
  }

  function toggleMarked(questionId) {
    setMarkedQuestions((previous) =>
      previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
    );
  }

  async function handleSubmitExam(autoSubmit = false) {
    if (!running || submitLockRef.current) return;

    submitLockRef.current = true;
    setSubmitting(true);

    const activeAttempt = running;
    const finalAnswers = toAnswerArray(answers);

    setNotice(
      autoSubmit
        ? "Time is up. ExamPro is submitting your examination."
        : ""
    );

    try {
      // Wait for pending answer saves before submitting.
      await saveQueueRef.current.catch(() => {});

      const data = await apiRequest(
        session.token,
        `/attempts/${activeAttempt.attempt._id}/submit`,
        {
          method: "POST",
          body: { answers: finalAnswers },
        }
      );

      let completedResult = data.result;

      if (!completedResult) {
        const details = await apiRequest(
          session.token,
          `/attempts/${activeAttempt.attempt._id}`
        );

        completedResult = details.result;
      }

      if (!completedResult) {
        throw new Error(
          "Submission was received, but the result could not be loaded."
        );
      }

      setResult(completedResult);
      setRunning(null);
      setMarkedQuestions([]);

      setActive(
        session.user.role === "admin"
          ? "Student activity"
          : "My results"
      );

      setNotice(
        autoSubmit
          ? "Time expired. Your saved answers have been evaluated."
          : "Your examination has been submitted and evaluated."
      );

      await refreshHistory();
    } catch (error) {
      setNotice(
        `Could not complete submission: ${error.message}`
      );
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }

  submitHandlerRef.current = handleSubmitExam;

  async function openResult(attemptId) {
    setResultLoading(true);
    setNotice("");

    try {
      const data = await apiRequest(
        session.token,
        `/attempts/${attemptId}`
      );

      if (!data.result) {
        setNotice(
          "This attempt has not been finalized yet."
        );
        return;
      }

      setResult(data.result);
      setActive("My results");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setResultLoading(false);
    }
  }

  if (!session) {
    return (
      <Auth
        onAuthenticated={handleAuthenticated}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const isAdmin = session.user.role === "admin";

  // Admins manage exams and see aggregate activity.
  // Students take exams and view their own progress.
  const navItems = [
    { label: "Overview", icon: LayoutDashboard },

    ...(!isAdmin
      ? [{ label: "Explore exams", icon: BookOpen }]
      : []),

    ...(isAdmin
      ? [
          {
            label: "Student activity",
            icon: ChartNoAxesColumnIncreasing,
          },
        ]
      : [
          { label: "My results", icon: Trophy },
          {
            label: "Learning insights",
            icon: ChartNoAxesColumnIncreasing,
          },
        ]),

    { label: "AI study assistant", icon: BrainCircuit },

    ...(isAdmin
      ? [{ label: "Admin panel", icon: ShieldCheck }]
      : []),
  ];

  const filteredExams = exams.filter((exam) =>
    `${exam.title} ${exam.subject || ""} ${exam.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const completedAttempts = history.filter(
    (attempt) =>
      attempt.status === "submitted" ||
      attempt.status === "expired"
  );

  const averageScore = completedAttempts.length
    ? (
        completedAttempts.reduce(
          (sum, attempt) => sum + (attempt.percentage || 0),
          0
        ) / completedAttempts.length
      ).toFixed(1)
    : "—";

  const hoursStudied = (
    completedAttempts.reduce(
      (sum, attempt) => sum + (attempt.timeTakenSeconds || 0),
      0
    ) / 3600
  ).toFixed(1);

  const stats = isAdmin
    ? [
        {
          label: "Exams created",
          value: String(exams.length),
          change: "Available in exam management",
          icon: BookOpen,
        },
        {
          label: "Published exams",
          value: String(
            exams.filter((exam) => exam.isPublished).length
          ),
          change: "Visible to students",
          icon: Trophy,
        },
        {
          label: "Student activity",
          value: "View dashboard",
          change: "Participation and performance",
          icon: ChartNoAxesColumnIncreasing,
        },
      ]
    : [
        {
          label: "Exams completed",
          value: String(completedAttempts.length),
          change: completedAttempts.length
            ? "Completed attempts"
            : "Take your first exam",
          icon: BookOpen,
        },
        {
          label: "Average score",
          value:
            averageScore === "—"
              ? "—"
              : `${averageScore}%`,
          change: "Across completed exams",
          icon: Trophy,
        },
        {
          label: "Exam time",
          value: `${hoursStudied}h`,
          change: "Total completed time",
          icon: Clock3,
        },
      ];

  const questionList = running?.exam?.questions || [];
  const currentQuestion = questionList[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const unansweredCount = Math.max(
    0,
    questionList.length - answeredCount
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          type="button"
          onClick={() => selectPage("Overview")}
        >
          <span className="brand-icon">
            <BrainCircuit size={25} />
          </span>

          <span>
            Exam<span className="brand-accent">Pro</span>
            <small>SMARTER EXAM PREPARATION</small>
          </span>
        </button>

        <div className="side-label">WORKSPACE</div>

        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => selectPage(label)}
              className={`nav-item ${
                active === label ? "active" : ""
              }`}
            >
              <Icon size={19} />
              <span>{label}</span>

              {label === "AI study assistant" && (
                <span className="ai-badge">AI</span>
              )}
            </button>
          ))}

          {running && !isAdmin && (
            <button
              type="button"
              className={`nav-item ${
                active === "Take exam" ? "active" : ""
              }`}
              onClick={() => setActive("Take exam")}
            >
              <Clock3 size={19} />
              <span>Current exam</span>
            </button>
          )}
        </nav>

        <div className="sidebar-promo">
          <div className="promo-icon">
            {isAdmin ? (
              <ChartNoAxesColumnIncreasing size={21} />
            ) : (
              <Sparkles size={21} />
            )}
          </div>

          <h3>
            {isAdmin
              ? "Monitor student activity."
              : "Improve your next score."}
          </h3>

          <p>
            {isAdmin
              ? "Review aggregate participation and exam performance."
              : "Find weak topics, useful lessons, and practice recommendations."}
          </p>

          <button
            type="button"
            onClick={() =>
              selectPage(
                isAdmin ? "Student activity" : "Learning insights"
              )
            }
          >
            {isAdmin ? "View activity" : "View insights"}
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="profile">
          <div className="avatar">
            {initials(session.user.name)}
          </div>

          <div className="profile-info">
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>

          <ShieldCheck size={17} className="verified" />
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={15} />
            <strong>{running ? "Take exam" : active}</strong>
          </div>

          <div className="top-actions">
            <span className="status-pill">
              <span />
              {running ? "Exam in progress" : "Signed in"}
            </span>

            <button
              className="icon-button theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setNotice("You're all caught up!")}
            >
              <Bell size={19} />
            </button>

            <div className="top-avatar">
              {initials(session.user.name)}
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Log out"
              title="Log out"
              disabled={Boolean(running)}
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {notice && (
          <motion.div
            className="notice"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* ADMIN EXAM MANAGEMENT */}
        {active === "Admin panel" && !running ? (
          isAdmin ? (
            <AdminPanel token={session.token} />
          ) : (
            <div className="empty-state">
              <ShieldCheck size={34} />
              <h3>Administrator access required</h3>
              <p>This account does not have admin permissions.</p>

              <button
                className="primary-button"
                type="button"
                onClick={() => selectPage("Overview")}
              >
                Return to overview <ArrowRight size={16} />
              </button>
            </div>
          )
        ) : running && !isAdmin ? (
          /* OFFICIAL EXAM TAKING */
          <section className="live-exam-section">
            <div className="live-exam-heading">
              <div>
                <div className="eyebrow">
                  <ShieldCheck size={14} />
                  EXAMINATION IN PROGRESS
                </div>

                <h1>{running.exam.title}</h1>

                <p>
                  {running.exam.subject} · {questionList.length} questions ·{" "}
                  {running.exam.totalMarks} marks
                </p>
              </div>

              <div
                className={`timer-pill ${
                  remainingSeconds <= 60 ? "urgent" : ""
                }`}
              >
                <Clock3 size={19} />

                <div>
                  <small>TIME REMAINING</small>
                  <strong>{formatTime(remainingSeconds)}</strong>
                </div>
              </div>
            </div>

            <div className="exam-progress-track">
              <div
                style={{
                  width: `${
                    questionList.length
                      ? (answeredCount / questionList.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="live-exam-layout">
              <div className="live-question-card">
                <div className="live-question-meta">
                  <span>
                    QUESTION {currentIndex + 1} OF {questionList.length}
                  </span>

                  <span>
                    {currentQuestion?.marks ?? 1}{" "}
                    {(currentQuestion?.marks ?? 1) === 1
                      ? "mark"
                      : "marks"}
                  </span>
                </div>

                <h2>
                  {currentQuestion?.questionText ||
                    "Question unavailable"}
                </h2>

                <p className="choose-answer-hint">
                  Select one answer below.
                </p>

                <div className="live-answer-list">
                  {currentQuestion?.options?.map(
                    (option, index) => {
                      const selected =
                        answers[currentQuestion._id] === index;

                      return (
                        <button
                          type="button"
                          key={`${currentQuestion._id}-${index}`}
                          className={`live-answer-option ${
                            selected ? "selected" : ""
                          }`}
                          onClick={() =>
                            selectAnswer(currentQuestion._id, index)
                          }
                          disabled={submitting}
                        >
                          <span className="option-letter">
                            {String.fromCharCode(65 + index)}
                          </span>

                          <span className="option-text">
                            {option}
                          </span>

                          {selected && (
                            <CheckCircle2
                              size={19}
                              className="option-check"
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                <div className="answer-save-status">
                  <ShieldCheck size={15} />
                  {savingState || "Choose your answer"}
                </div>

                <div className="live-exam-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={currentIndex === 0 || submitting}
                    onClick={() =>
                      setCurrentIndex((index) => index - 1)
                    }
                  >
                    <ChevronLeft size={17} />
                    Previous
                  </button>

                  <button
                    type="button"
                    className={`review-button ${
                      markedQuestions.includes(currentQuestion?._id)
                        ? "marked"
                        : ""
                    }`}
                    disabled={submitting || !currentQuestion}
                    onClick={() =>
                      currentQuestion &&
                      toggleMarked(currentQuestion._id)
                    }
                  >
                    <Flag size={16} />
                    {markedQuestions.includes(currentQuestion?._id)
                      ? "Unmark review"
                      : "Mark for review"}
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      currentIndex === questionList.length - 1 ||
                      submitting
                    }
                    onClick={() =>
                      setCurrentIndex((index) => index + 1)
                    }
                  >
                    Next <ChevronRight size={17} />
                  </button>
                </div>
              </div>

              <aside className="question-navigation-card">
                <h3>Question navigator</h3>
                <p>Jump to a question or check your progress.</p>

                <div className="question-number-grid">
                  {questionList.map((question, index) => {
                    const answered =
                      answers[question._id] !== undefined;

                    const marked = markedQuestions.includes(
                      question._id
                    );

                    return (
                      <button
                        type="button"
                        key={question._id}
                        title={`Question ${index + 1}${
                          answered ? ", answered" : ", unanswered"
                        }${marked ? ", marked for review" : ""}`}
                        className={[
                          "question-number",
                          index === currentIndex ? "current" : "",
                          answered ? "answered" : "",
                          marked ? "review-marked" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        disabled={submitting}
                        onClick={() => setCurrentIndex(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="navigator-legend">
                  <span>
                    <i className="legend-current" />
                    Current
                  </span>

                  <span>
                    <i className="legend-answered" />
                    Answered
                  </span>

                  <span>
                    <i className="legend-review" />
                    Review
                  </span>
                </div>

                <div className="exam-count-summary">
                  <div>
                    <span>Answered</span>
                    <strong>{answeredCount}</strong>
                  </div>

                  <div>
                    <span>Unanswered</span>
                    <strong>{unansweredCount}</strong>
                  </div>

                  <div>
                    <span>For review</span>
                    <strong>{markedQuestions.length}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="submit-exam-button"
                  disabled={submitting}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Submit this exam now?\n\nAnswered: ${answeredCount}\nUnanswered: ${unansweredCount}\nMarked for review: ${markedQuestions.length}`
                    );

                    if (confirmed) {
                      handleSubmitExam(false);
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <LoaderCircle size={17} />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit examination <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p className="submit-hint">
                  Your answers are evaluated automatically after submission.
                </p>
              </aside>
            </div>
          </section>
        ) : (
          <>
            {/* OVERVIEW */}
            {active === "Overview" && (
              <section className="welcome-row">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                >
                  <div className="eyebrow">
                    <Sparkles size={14} />
                    YOUR LEARNING SPACE
                  </div>

                  <h1>
                    {isAdmin ? (
                      <>
                        Manage every exam.
                        <br />
                        Monitor <span>student progress.</span>
                      </>
                    ) : (
                      <>
                        Make every exam
                        <br />
                        your <span>best one yet.</span>
                      </>
                    )}
                  </h1>

                  <p className="welcome-subtitle">
                    {isAdmin
                      ? "Welcome back, administrator. Manage examinations and review student participation."
                      : `Welcome back, ${
                          session.user.name.trim().split(/\s+/)[0]
                        }. Ready to turn preparation into progress?`}
                  </p>

                  {isAdmin ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => selectPage("Admin panel")}
                    >
                      Manage exams <ArrowRight size={17} />
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => selectPage("Explore exams")}
                    >
                      Explore exams <ArrowRight size={17} />
                    </button>
                  )}
                </motion.div>

                <motion.div
                  className="hero-art"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                >
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="hero-glow" />

                  <div className="hero-core">
                    {isAdmin ? (
                      <ChartNoAxesColumnIncreasing
                        size={69}
                        strokeWidth={1.25}
                      />
                    ) : (
                      <GraduationCap
                        size={69}
                        strokeWidth={1.25}
                      />
                    )}
                  </div>

                  <div className="float-chip chip-top">
                    <BrainCircuit size={17} />
                    {isAdmin ? "Exam management" : "AI powered"}
                  </div>

                  <div className="float-chip chip-bottom">
                    <Target size={17} />
                    {isAdmin
                      ? "Student activity"
                      : "Your goals, in focus"}
                  </div>
                </motion.div>
              </section>
            )}

            {active === "Overview" && (
              <section className="stats-grid">
                {stats.map(
                  ({ label, value, change, icon: Icon }, index) => (
                    <motion.div
                      className="stat-card"
                      key={label}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.1 + 0.2,
                      }}
                    >
                      <div className="stat-top">
                        <span>{label}</span>
                        <span className="stat-icon">
                          <Icon size={19} />
                        </span>
                      </div>

                      <div className="stat-value">{value}</div>
                      <div className="stat-change">{change}</div>
                    </motion.div>
                  )
                )}
              </section>
            )}

            {/* AI STUDY ASSISTANT */}
            {active === "AI study assistant" ? (
              <AIStudyAssistant
                key={practiceTopic || "default"}
                token={session.token}
                initialTopic={practiceTopic || undefined}
              />
            ) : isAdmin && active === "Student activity" ? (
              /* ADMIN ANALYTICS */
              <AdminActivityDashboard token={session.token} />
            ) : !isAdmin && active === "Learning insights" ? (
              /* STUDENT WEAK TOPICS, YOUTUBE LINKS AND SCORE TREND */
              <LearningInsights
                token={session.token}
                onPractice={(topic) => {
                  setPracticeTopic(topic);
                  setActive("AI study assistant");
                  setNotice(`Practice topic selected: ${topic}`);
                }}
              />
            ) : !isAdmin && active === "My results" ? (
              /* STUDENT'S OWN EXAM RESULTS */
              <section className="exam-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">YOUR PERFORMANCE</div>
                    <h2>Exam results</h2>
                  </div>
                </div>

                <div className="results-area">
                  {result && (
                    <motion.div
                      className="result-summary-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="result-summary-heading">
                        <div>
                          <span className="eyebrow">
                            EXAM COMPLETED
                          </span>

                          <h3>{result.exam?.title}</h3>

                          <p>
                            {result.exam?.subject} · {result.status}
                          </p>
                        </div>

                        <div className="result-percentage">
                          {result.percentage}%
                          <small>Overall score</small>
                        </div>
                      </div>

                      <div className="result-stat-grid">
                        <div>
                          <span>Score</span>
                          <strong>
                            {result.score} / {result.totalMarks}
                          </strong>
                        </div>

                        <div>
                          <span>Correct</span>
                          <strong className="result-correct">
                            {result.correctCount}
                          </strong>
                        </div>

                        <div>
                          <span>Incorrect</span>
                          <strong className="result-wrong">
                            {result.wrongCount}
                          </strong>
                        </div>

                        <div>
                          <span>Unanswered</span>
                          <strong>{result.unansweredCount}</strong>
                        </div>
                      </div>

                      <h3 className="review-heading">
                        Answer review
                      </h3>

                      <div className="answer-review-list">
                        {result.review?.map((item, index) => (
                          <article
                            key={item.questionId}
                            className="answer-review-card"
                          >
                            <div className="review-question-heading">
                              {item.isCorrect ? (
                                <CheckCircle2
                                  size={19}
                                  className="result-correct"
                                />
                              ) : (
                                <XCircle
                                  size={19}
                                  className="result-wrong"
                                />
                              )}

                              <strong>
                                Q{index + 1}. {item.questionText}
                              </strong>
                            </div>

                            <div className="review-options">
                              {item.options.map(
                                (option, optionIndex) => {
                                  const isCorrect =
                                    optionIndex === item.correctOption;

                                  const isSelected =
                                    optionIndex === item.selectedOption;

                                  return (
                                    <div
                                      key={optionIndex}
                                      className={[
                                        "review-option",
                                        isCorrect
                                          ? "correct-option"
                                          : "",
                                        isSelected && !isCorrect
                                          ? "wrong-option"
                                          : "",
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    >
                                      <span>
                                        {String.fromCharCode(
                                          65 + optionIndex
                                        )}
                                        .
                                      </span>

                                      <span>{option}</span>

                                      {isCorrect && (
                                        <CheckCircle2 size={15} />
                                      )}

                                      {isSelected && !isCorrect && (
                                        <XCircle size={15} />
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>

                            {item.explanation && (
                              <p className="review-explanation">
                                <strong>Explanation:</strong>{" "}
                                {item.explanation}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setResult(null)}
                      >
                        <RotateCcw size={16} />
                        Hide detailed review
                      </button>
                    </motion.div>
                  )}

                  <div className="history-section">
                    <h3>Your attempt history</h3>

                    {resultLoading && <p>Loading result…</p>}

                    {dataLoading ? (
                      <div className="exam-loading">
                        <LoaderCircle size={22} />
                        Loading your examination history…
                      </div>
                    ) : history.length === 0 ? (
                      <div className="empty-state">
                        <ChartNoAxesColumnIncreasing size={35} />
                        <h3>No results yet</h3>
                        <p>
                          Complete an examination to see your
                          performance here.
                        </p>
                      </div>
                    ) : (
                      <div className="history-list">
                        {history.map((attempt) => {
                          const completed =
                            attempt.status === "submitted" ||
                            attempt.status === "expired";

                          return (
                            <article
                              className="history-card"
                              key={attempt._id}
                            >
                              <div className="history-card-icon">
                                <Trophy size={20} />
                              </div>

                              <div className="history-card-info">
                                <strong>
                                  {attempt.exam?.title || "Examination"}
                                </strong>

                                <span>
                                  {attempt.exam?.subject || "Exam"} ·{" "}
                                  {attempt.status === "inProgress"
                                    ? "In progress"
                                    : attempt.status === "expired"
                                      ? "Time expired"
                                      : "Submitted"}
                                </span>

                                {attempt.startedAt && (
                                  <small>
                                    {new Date(
                                      attempt.startedAt
                                    ).toLocaleString()}
                                  </small>
                                )}
                              </div>

                              <div className="history-card-score">
                                {completed ? (
                                  <>
                                    <strong>
                                      {attempt.percentage}%
                                    </strong>
                                    <small>
                                      {attempt.score}/
                                      {attempt.totalMarks}
                                    </small>
                                  </>
                                ) : (
                                  <small>Not submitted</small>
                                )}
                              </div>

                              {completed && (
                                <button
                                  type="button"
                                  className="history-open-button"
                                  disabled={resultLoading}
                                  onClick={() =>
                                    openResult(attempt._id)
                                  }
                                >
                                  Review <ArrowRight size={15} />
                                </button>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ) : !isAdmin &&
              (active === "Explore exams" || active === "Overview") ? (
              /* STUDENT EXAM CATALOGUE */
              <section
                className="exam-section"
                id="exam-section"
              >
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">
                      KEEP MOVING FORWARD
                    </div>

                    <h2>
                      {active === "Explore exams"
                        ? "Explore all exams"
                        : "Available examinations"}
                    </h2>
                  </div>

                  <label className="search-box">
                    <Search size={17} />

                    <input
                      type="search"
                      placeholder="Search exams..."
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                    />
                  </label>
                </div>

                {dataError && (
                  <div className="exam-load-error">
                    <XCircle size={18} />
                    <span>{dataError}</span>

                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {dataLoading && (
                  <div className="exam-loading">
                    <LoaderCircle size={23} />
                    Loading published examinations…
                  </div>
                )}

                {!dataLoading &&
                  !dataError &&
                  filteredExams.length === 0 && (
                    <div className="empty-state">
                      <BookOpen size={34} />

                      <h3>
                        {search
                          ? "No matching exams"
                          : "No published exams yet"}
                      </h3>

                      <p>
                        {search
                          ? "Try another search term."
                          : "Published exams created by your administrator will appear here."}
                      </p>
                    </div>
                  )}

                <div className="exam-grid">
                  {filteredExams.map((exam, index) => {
                    const colors = ["violet", "blue", "orange"];
                    const icons = [BrainCircuit, Target, Zap];
                    const color = colors[index % colors.length];
                    const ExamIcon = icons[index % icons.length];

                    return (
                      <motion.article
                        className="exam-card"
                        key={exam._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: Math.min(index * 0.06, 0.3),
                        }}
                        whileHover={{ y: -4 }}
                      >
                        <div className={`exam-icon ${color}`}>
                          <ExamIcon size={24} />
                        </div>

                        <span className="exam-category">
                          {exam.subject}
                        </span>

                        <h3>{exam.title}</h3>

                        <p className="exam-desc">
                          {exam.description ||
                            "Test your knowledge and measure your progress."}
                        </p>

                        <div className="exam-meta">
                          <span>
                            <BookOpen size={15} />
                            {exam.questionCount} questions
                          </span>

                          <span>
                            <Clock3 size={15} />
                            {exam.durationMinutes} min
                          </span>
                        </div>

                        <div className="exam-footer">
                          <span className={`level ${color}`}>
                            {exam.totalMarks} marks
                          </span>

                          <button
                            type="button"
                            disabled={Boolean(startingExamId)}
                            onClick={() => startExam(exam._id)}
                          >
                            {startingExamId === exam._id
                              ? "Starting…"
                              : "Start exam"}

                            {startingExamId === exam._id ? (
                              <LoaderCircle size={15} />
                            ) : (
                              <ArrowRight size={15} />
                            )}
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}

        <footer className="footer">
          <span>
            © 2026 ExamPro · Online Examination System
          </span>

          <span>
            Taseen Yasir Pritam · UID 24BAI70036
          </span>
        </footer>
      </main>
    </div>
  );
}