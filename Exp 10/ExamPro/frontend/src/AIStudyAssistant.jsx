import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  LoaderCircle,
  Lightbulb,
  Target,
  Trophy,
  Clock3,
  Gauge,
  Timer,
  ListChecks,
  Zap,
} from "lucide-react";
import "./AIStudyAssistant.css";

// Configure VITE_API_URL in Vercel to your deployed API URL,
// ending in /api. Local development uses localhost.
const API = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const QUESTION_COUNTS = [3, 5, 8, 10, 15, 20];

const TIME_LIMITS = [
  { value: "0", label: "No time limit" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
];

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainder
  ).padStart(2, "0")}`;
}

export default function AIStudyAssistant({
  token,
  initialTopic,
}) {
  const [topic, setTopic] = useState(
    initialTopic || "IPv4 addressing and subnetting"
  );
  const [difficulty, setDifficulty] = useState("beginner");
  const [count, setCount] = useState("5");
  const [timeLimit, setTimeLimit] = useState("0");
  const [trackSpeed, setTrackSpeed] = useState(true);

  const [practiceSet, setPracticeSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeTaken, setTimeTaken] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [error, setError] = useState("");

  const [timeLeft, setTimeLeft] = useState(null);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  const [practiceElapsed, setPracticeElapsed] = useState(0);

  const practiceStartedAt = useRef(null);
  const questionStartedAt = useRef(null);
  const deadlineAt = useRef(null);
  const timeTakenRef = useRef({});
  const finishLock = useRef(false);

  const questions = practiceSet?.questions || [];
  const question = questions[currentIndex];

  const selectedOption = question
    ? answers[currentIndex]
    : undefined;

  const answeredCount = Object.keys(answers).length;

  const unansweredCount = Math.max(
    0,
    questions.length - answeredCount
  );

  const correctCount = questions.reduce(
    (total, item, index) =>
      total + (answers[index] === item.correctOption ? 1 : 0),
    0
  );

  const incorrectCount = Math.max(
    0,
    answeredCount - correctCount
  );

  const overallScore = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const attemptedAccuracy = answeredCount
    ? Math.round((correctCount / answeredCount) * 100)
    : 0;

  const recordedTimes = Object.entries(timeTaken)
    .map(([index, seconds]) => ({
      index: Number(index),
      seconds,
    }))
    .filter((item) => Number.isFinite(item.seconds));

  const averageTime = recordedTimes.length
    ? Math.round(
        recordedTimes.reduce(
          (total, item) => total + item.seconds,
          0
        ) / recordedTimes.length
      )
    : null;

  const fastestQuestion = recordedTimes.length
    ? [...recordedTimes].sort(
        (a, b) => a.seconds - b.seconds
      )[0]
    : null;

  const slowestQuestion = recordedTimes.length
    ? [...recordedTimes].sort(
        (a, b) => b.seconds - a.seconds
      )[0]
    : null;

  const completed = submitted;

  function recordCurrentQuestionTime() {
    if (
      !trackSpeed ||
      !question ||
      !questionStartedAt.current ||
      answers[currentIndex] !== undefined
    ) {
      return;
    }

    const accumulated = timeTakenRef.current[currentIndex] || 0;

    const currentVisit = Math.max(
      0,
      Math.floor(
        (Date.now() - questionStartedAt.current) / 1000
      )
    );

    const totalSeconds = accumulated + currentVisit;

    const updated = {
      ...timeTakenRef.current,
      [currentIndex]: totalSeconds,
    };

    timeTakenRef.current = updated;
    setTimeTaken(updated);
    setQuestionElapsed(totalSeconds);
    questionStartedAt.current = null;
  }

  function finishPractice() {
    if (finishLock.current || !practiceSet || submitted) {
      return;
    }

    finishLock.current = true;
    recordCurrentQuestionTime();

    if (practiceStartedAt.current) {
      setPracticeElapsed(
        Math.floor(
          (Date.now() - practiceStartedAt.current) / 1000
        )
      );
    }

    questionStartedAt.current = null;
    setSubmitted(true);
  }

  // Keep the overall stopwatch accurate, including when the
  // browser tab is temporarily inactive.
  useEffect(() => {
    if (!practiceSet || completed) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      if (practiceStartedAt.current) {
        setPracticeElapsed(
          Math.floor(
            (Date.now() - practiceStartedAt.current) / 1000
          )
        );
      }

      if (deadlineAt.current) {
        const remaining = Math.max(
          0,
          Math.ceil(
            (deadlineAt.current - Date.now()) / 1000
          )
        );

        setTimeLeft(remaining);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [practiceSet, completed]);

  // End timed practice when the deadline has passed.
  useEffect(() => {
    if (
      practiceSet &&
      timeLeft === 0 &&
      deadlineAt.current &&
      !completed
    ) {
      finishPractice();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceSet, timeLeft, completed]);

  // Start or resume timing for the current unanswered question.
  useEffect(() => {
    if (!practiceSet || completed) {
      return undefined;
    }

    if (
      !trackSpeed ||
      answers[currentIndex] !== undefined
    ) {
      questionStartedAt.current = null;

      setQuestionElapsed(
        timeTakenRef.current[currentIndex] || 0
      );

      return undefined;
    }

    questionStartedAt.current = Date.now();

    const accumulated =
      timeTakenRef.current[currentIndex] || 0;

    setQuestionElapsed(accumulated);

    const interval = window.setInterval(() => {
      if (questionStartedAt.current) {
        setQuestionElapsed(
          accumulated +
            Math.floor(
              (Date.now() - questionStartedAt.current) / 1000
            )
        );
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [
    practiceSet,
    currentIndex,
    completed,
    trackSpeed,
    answers,
  ]);

  async function generateQuestions(event) {
    event.preventDefault();

    if (topic.trim().length < 2) {
      setError("Enter a topic with at least two characters.");
      return;
    }

    setLoading(true);
    setError("");
    setPracticeSet(null);
    setAnswers({});
    setTimeTaken({});
    timeTakenRef.current = {};

    setCurrentIndex(0);
    setSubmitted(false);
    finishLock.current = false;
    setShowReview(false);
    setAiExplanation("");
    setTimeLeft(null);
    setPracticeElapsed(0);
    setQuestionElapsed(0);

    practiceStartedAt.current = null;
    questionStartedAt.current = null;
    deadlineAt.current = null;

    try {
      const response = await fetch(
        `${API}/ai/generate-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: topic.trim(),
            difficulty,
            count: Number(count),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not generate practice questions."
        );
      }

      if (
        !Array.isArray(data.practiceSet?.questions) ||
        data.practiceSet.questions.length !== Number(count)
      ) {
        throw new Error(
          "The AI returned an unexpected number of questions. Please try again."
        );
      }

      const startTime = Date.now();
      const minutes = Number(timeLimit);

      practiceStartedAt.current = startTime;

      deadlineAt.current =
        minutes > 0
          ? startTime + minutes * 60 * 1000
          : null;

      setTimeLeft(minutes > 0 ? minutes * 60 : null);
      setPracticeElapsed(0);
      setPracticeSet(data.practiceSet);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to ExamPro. Check the backend URL and server status."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(optionIndex) {
    if (completed || selectedOption !== undefined) {
      return;
    }

    recordCurrentQuestionTime();

    setAnswers((previous) => ({
      ...previous,
      [currentIndex]: optionIndex,
    }));

    setAiExplanation("");
    setError("");
  }

  function goToQuestion(index) {
    if (
      index < 0 ||
      index >= questions.length ||
      completed
    ) {
      return;
    }

    recordCurrentQuestionTime();
    setCurrentIndex(index);
    setAiExplanation("");
    setError("");
  }

  async function explainAnswer() {
    if (!question || selectedOption === undefined) {
      return;
    }

    setExplanationLoading(true);
    setAiExplanation("");
    setError("");

    try {
      const response = await fetch(
        `${API}/ai/explain-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: practiceSet.topic,
            question: question.questionText,
            options: question.options,
            correctAnswer:
              question.options[question.correctOption],
            selectedAnswer:
              question.options[selectedOption],
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Could not generate an explanation."
        );
      }

      setAiExplanation(data.explanation);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to ExamPro. Check the backend URL and server status."
          : err.message
      );
    } finally {
      setExplanationLoading(false);
    }
  }

  function restartPractice() {
    setAnswers({});
    setTimeTaken({});
    timeTakenRef.current = {};

    setCurrentIndex(0);
    setSubmitted(false);
    finishLock.current = false;
    setShowReview(false);
    setAiExplanation("");
    setError("");

    const startTime = Date.now();
    const minutes = Number(timeLimit);

    practiceStartedAt.current = startTime;
    questionStartedAt.current = null;

    deadlineAt.current =
      minutes > 0
        ? startTime + minutes * 60 * 1000
        : null;

    setTimeLeft(minutes > 0 ? minutes * 60 : null);
    setPracticeElapsed(0);
    setQuestionElapsed(0);
  }

  function startAnotherPractice() {
    setPracticeSet(null);
    setAnswers({});
    setTimeTaken({});
    timeTakenRef.current = {};

    setCurrentIndex(0);
    setSubmitted(false);
    finishLock.current = false;
    setShowReview(false);
    setAiExplanation("");
    setError("");

    setTimeLeft(null);
    setPracticeElapsed(0);
    setQuestionElapsed(0);

    practiceStartedAt.current = null;
    questionStartedAt.current = null;
    deadlineAt.current = null;
  }

  function getStudyTips() {
    const tips = [];

    if (unansweredCount > 0) {
      tips.push(
        `You left ${unansweredCount} question${
          unansweredCount === 1 ? "" : "s"
        } unanswered. Practise eliminating clearly incorrect options and managing your time.`
      );
    }

    if (answeredCount > 0 && attemptedAccuracy < 60) {
      tips.push(
        "Review incorrect answers and their explanations. Repeat this topic at beginner difficulty before moving up."
      );
    } else if (
      answeredCount > 0 &&
      attemptedAccuracy >= 85
    ) {
      tips.push(
        "Good accuracy! Try intermediate or advanced questions to strengthen your understanding."
      );
    }

    if (
      trackSpeed &&
      averageTime !== null &&
      averageTime >= 30
    ) {
      tips.push(
        "Your average response time is relatively high. Practise identifying keywords and eliminating wrong options."
      );
    } else if (
      trackSpeed &&
      averageTime !== null &&
      averageTime <= 8 &&
      attemptedAccuracy < 75
    ) {
      tips.push(
        "You are answering quickly, but accuracy needs work. Read the entire question and all answer choices before selecting."
      );
    }

    if (
      unansweredCount === 0 &&
      overallScore >= 80 &&
      timeLimit !== "0" &&
      timeLeft !== 0
    ) {
      tips.push(
        "Strong performance! Try a slightly larger timed set to build exam stamina."
      );
    }

    if (tips.length === 0) {
      tips.push(
        "Keep practising this topic. Understand why each answer is right instead of memorising the option."
      );
    }

    return tips;
  }

  return (
    <section className="ai-study-page">
      <header className="ai-study-heading">
        <div>
          <div className="ai-study-eyebrow">
            <Sparkles size={15} />
            YOUR PERSONAL AI TUTOR
          </div>

          <h1>
            Learn smarter with <span>AI.</span>
          </h1>

          <p>
            Generate practice questions, check your understanding,
            and get explanations tailored to your topic.
          </p>
        </div>

        <motion.div
          className="ai-study-hero-icon"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <BrainCircuit size={43} />
          <Sparkles
            className="ai-study-sparkle"
            size={19}
          />
        </motion.div>
      </header>

      {!practiceSet && (
        <motion.form
          className="ai-generator-card"
          onSubmit={generateQuestions}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="ai-generator-title">
            <div className="ai-generator-icon">
              <BookOpen size={22} />
            </div>

            <div>
              <h2>Create a practice set</h2>
              <p>Choose how you want to practise today.</p>
            </div>
          </div>

          <label className="ai-study-field">
            What topic do you want to study?

            <input
              value={topic}
              onChange={(event) =>
                setTopic(event.target.value)
              }
              maxLength={120}
              placeholder="e.g. OSI model, subnetting, DBMS..."
              required
            />
          </label>

          <div className="ai-generator-fields">
            <label className="ai-study-field">
              Difficulty

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value)
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="ai-study-field">
              Number of questions

              <select
                value={count}
                onChange={(event) =>
                  setCount(event.target.value)
                }
              >
                {QUESTION_COUNTS.map((number) => (
                  <option key={number} value={String(number)}>
                    {number} questions
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ai-generator-fields ai-generator-fields-timing">
            <label className="ai-study-field">
              Exam time limit

              <select
                value={timeLimit}
                onChange={(event) =>
                  setTimeLimit(event.target.value)
                }
              >
                {TIME_LIMITS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ai-speed-option">
              <input
                type="checkbox"
                checked={trackSpeed}
                onChange={(event) =>
                  setTrackSpeed(event.target.checked)
                }
              />

              <span>
                <strong>Track time per question</strong>
                <small>
                  Measure response speed and see timing insights at the end.
                </small>
              </span>
            </label>
          </div>

          {error && (
            <div className="ai-study-error" role="alert">
              <XCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="ai-generate-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  className="ai-spin"
                  size={18}
                />
                Generating your questions...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate practice questions
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="ai-generator-note">
            <CheckCircle2 size={15} />
            Generated by Gemini · Questions are for practice
          </p>
        </motion.form>
      )}

      {loading && !practiceSet && (
        <div className="ai-loading-card">
          <LoaderCircle
            className="ai-spin"
            size={30}
          />
          <h3>Your AI tutor is preparing questions</h3>
          <p>This may take a few seconds.</p>
        </div>
      )}

      {practiceSet && (
        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="ai-results"
              className="ai-results-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="ai-results-icon">
                <Trophy size={35} />
              </div>

              <div className="ai-study-eyebrow">
                PRACTICE COMPLETED
              </div>

              <h2>
                {timeLeft === 0
                  ? "Time is up. Review your results."
                  : "Nice work. Keep learning!"}
              </h2>

              <p className="ai-results-subtitle">
                {practiceSet.title}
              </p>

              <div className="ai-score-circle">
                <strong>{overallScore}%</strong>
                <span>Overall score</span>
              </div>

              <div className="ai-score-stats">
                <div>
                  <CheckCircle2 size={19} />
                  <strong>{correctCount}</strong>
                  <span>Correct</span>
                </div>

                <div>
                  <XCircle size={19} />
                  <strong>{incorrectCount}</strong>
                  <span>Incorrect</span>
                </div>

                <div>
                  <Clock3 size={19} />
                  <strong>{unansweredCount}</strong>
                  <span>Unanswered</span>
                </div>

                <div>
                  <Target size={19} />
                  <strong>{questions.length}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="ai-performance-card">
                <div className="ai-performance-heading">
                  <Gauge size={21} />

                  <div>
                    <h3>Your performance</h3>
                    <p>
                      Use these insights to guide your next practice.
                    </p>
                  </div>
                </div>

                <div className="ai-performance-grid">
                  <div className="ai-performance-metric">
                    <span>Time used</span>
                    <strong>
                      {formatTime(practiceElapsed)}
                    </strong>
                  </div>

                  <div className="ai-performance-metric">
                    <span>Attempt accuracy</span>
                    <strong>
                      {answeredCount
                        ? `${attemptedAccuracy}%`
                        : "—"}
                    </strong>
                  </div>

                  <div className="ai-performance-metric">
                    <span>Average per question</span>
                    <strong>
                      {trackSpeed && averageTime !== null
                        ? `${averageTime}s`
                        : "Not tracked"}
                    </strong>
                  </div>

                  <div className="ai-performance-metric">
                    <span>Exam timer</span>
                    <strong>
                      {timeLimit === "0"
                        ? "Untimed"
                        : timeLeft === 0
                          ? "Expired"
                          : "Used"}
                    </strong>
                  </div>
                </div>

                {trackSpeed && recordedTimes.length > 0 && (
                  <div className="ai-speed-insights">
                    <p>
                      <Zap size={16} />
                      Fastest: Question {fastestQuestion.index + 1} in{" "}
                      {fastestQuestion.seconds}s
                    </p>

                    <p>
                      <Clock3 size={16} />
                      Slowest: Question {slowestQuestion.index + 1} in{" "}
                      {slowestQuestion.seconds}s
                    </p>
                  </div>
                )}

                <div className="ai-study-tips">
                  <h4>
                    <Lightbulb size={18} />
                    Your next steps
                  </h4>

                  {getStudyTips().map((tip, index) => (
                    <p key={index}>{tip}</p>
                  ))}
                </div>
              </div>

              <div className="ai-results-actions">
                <button
                  type="button"
                  className="ai-secondary-button"
                  onClick={restartPractice}
                >
                  <RotateCcw size={16} />
                  Try again
                </button>

                <button
                  type="button"
                  className="ai-generate-button"
                  onClick={startAnotherPractice}
                >
                  New practice set
                  <ArrowRight size={16} />
                </button>
              </div>

              <button
                type="button"
                className="ai-review-toggle"
                aria-expanded={showReview}
                onClick={() =>
                  setShowReview((visible) => !visible)
                }
              >
                <ListChecks size={18} />

                {showReview
                  ? "Hide question review"
                  : "Review all questions"}

                <ArrowRight
                  size={16}
                  className={
                    showReview ? "ai-review-arrow-open" : ""
                  }
                />
              </button>

              {showReview && (
                <div className="ai-question-review">
                  {questions.map((item, index) => {
                    const answer = answers[index];
                    const wasAnswered = answer !== undefined;

                    const isCorrect =
                      wasAnswered &&
                      answer === item.correctOption;

                    return (
                      <article
                        className="ai-review-item"
                        key={`review-${index}`}
                      >
                        <div className="ai-review-title">
                          <strong>
                            Question {index + 1}:{" "}
                            {item.questionText}
                          </strong>

                          <span
                            className={`ai-review-status ${
                              !wasAnswered
                                ? "unanswered"
                                : isCorrect
                                  ? "correct"
                                  : "incorrect"
                            }`}
                          >
                            {!wasAnswered
                              ? "Unanswered"
                              : isCorrect
                                ? "Correct"
                                : "Incorrect"}
                          </span>
                        </div>

                        <p>
                          Your answer:{" "}
                          <strong>
                            {wasAnswered
                              ? item.options[answer]
                              : "Not answered"}
                          </strong>
                        </p>

                        <p>
                          Correct answer:{" "}
                          <strong>
                            {item.options[item.correctOption]}
                          </strong>
                        </p>

                        {trackSpeed && (
                          <p>
                            Time taken:{" "}
                            <strong>
                              {timeTaken[index] !== undefined
                                ? `${timeTaken[index]} seconds`
                                : "Not recorded"}
                            </strong>
                          </p>
                        )}

                        <p className="ai-review-explanation">
                          {item.explanation}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`question-${currentIndex}`}
              className="ai-practice-card"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div className="ai-practice-header">
                <div>
                  <span className="ai-practice-label">
                    AI PRACTICE SESSION
                  </span>

                  <h2>{practiceSet.title}</h2>

                  <p>
                    {practiceSet.topic} · {practiceSet.difficulty}
                  </p>
                </div>

                <span className="ai-question-count">
                  {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <div className="ai-live-timer-row">
                {timeLeft !== null && (
                  <span
                    className={`ai-timer-badge ${
                      timeLeft <= 60
                        ? "ai-timer-warning"
                        : ""
                    }`}
                  >
                    <Timer size={16} />
                    Time left: {formatTime(timeLeft)}
                  </span>
                )}

                <span className="ai-timer-badge">
                  <Clock3 size={16} />
                  Elapsed: {formatTime(practiceElapsed)}
                </span>

                {trackSpeed && (
                  <span className="ai-timer-badge">
                    <Gauge size={16} />
                    This question: {formatTime(questionElapsed)}
                  </span>
                )}
              </div>

              <div className="ai-question-progress">
                <div
                  style={{
                    width: `${
                      ((currentIndex + 1) / questions.length) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="ai-question-body">
                <span className="ai-question-number">
                  QUESTION {String(currentIndex + 1).padStart(2, "0")}
                </span>

                <h3>{question.questionText}</h3>

                <p className="ai-select-hint">
                  Select one answer.
                </p>

                <div className="ai-options-list">
                  {question.options.map((option, index) => {
                    const isSelected = selectedOption === index;

                    const isCorrect =
                      index === question.correctOption;

                    const showFeedback =
                      selectedOption !== undefined;

                    const stateClass = !showFeedback
                      ? ""
                      : isCorrect
                        ? "ai-option-correct"
                        : isSelected
                          ? "ai-option-wrong"
                          : "";

                    return (
                      <button
                        key={`${currentIndex}-${index}`}
                        type="button"
                        className={`ai-answer-option ${stateClass}`}
                        disabled={showFeedback}
                        onClick={() => selectAnswer(index)}
                      >
                        <span className="ai-option-letter">
                          {String.fromCharCode(65 + index)}
                        </span>

                        <span className="ai-option-text">
                          {option}
                        </span>

                        {showFeedback && isCorrect && (
                          <CheckCircle2 size={19} />
                        )}

                        {showFeedback &&
                          isSelected &&
                          !isCorrect && (
                            <XCircle size={19} />
                          )}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== undefined && (
                  <motion.div
                    className={`ai-feedback ${
                      selectedOption === question.correctOption
                        ? "correct"
                        : "incorrect"
                    }`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {selectedOption === question.correctOption ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <XCircle size={20} />
                    )}

                    <div>
                      <strong>
                        {selectedOption === question.correctOption
                          ? "Correct answer!"
                          : "Not quite. Let's learn from it."}
                      </strong>

                      <p>{question.explanation}</p>
                    </div>
                  </motion.div>
                )}

                {selectedOption !== undefined && (
                  <div className="ai-tutor-box">
                    <div className="ai-tutor-heading">
                      <Lightbulb size={19} />

                      <div>
                        <strong>Ask your AI tutor</strong>
                        <span>
                          Get another explanation for this answer.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ai-secondary-button"
                      disabled={explanationLoading}
                      onClick={explainAnswer}
                    >
                      {explanationLoading ? (
                        <>
                          <LoaderCircle
                            className="ai-spin"
                            size={16}
                          />
                          Explaining...
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={16} />
                          Explain this answer with AI
                        </>
                      )}
                    </button>

                    {aiExplanation && (
                      <motion.p
                        className="ai-tutor-explanation"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {aiExplanation}
                      </motion.p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="ai-study-error" role="alert">
                    <XCircle size={17} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="ai-practice-footer">
                <button
                  type="button"
                  className="ai-secondary-button"
                  disabled={currentIndex === 0}
                  onClick={() =>
                    goToQuestion(currentIndex - 1)
                  }
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <span>
                  {answeredCount} of {questions.length} answered
                </span>

                {currentIndex === questions.length - 1 ? (
                  <button
                    type="button"
                    className="ai-generate-button"
                    onClick={finishPractice}
                  >
                    Finish practice
                    <Trophy size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ai-generate-button"
                    disabled={selectedOption === undefined}
                    onClick={() =>
                      goToQuestion(currentIndex + 1)
                    }
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
}