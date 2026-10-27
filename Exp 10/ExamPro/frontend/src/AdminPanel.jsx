import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Plus,
  BookOpen,
  Clock3,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  LoaderCircle,
  CircleAlert,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import "./AdminPanel.css";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: 1,
  topic: "General",
  explanation: "",
});

const emptyExam = () => ({
  title: "",
  description: "",
  subject: "",
  durationMinutes: 30,
  isPublished: false,
  questions: [emptyQuestion()],
});

async function apiRequest(token, path, options = {}) {
  const { body, headers: customHeaders, ...rest } = options;

  const response = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
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

function normalizeQuestion(question) {
  const options = Array.isArray(question.options)
    ? question.options.map((option) => String(option ?? ""))
    : [];

  return {
    ...(question._id ? { _id: question._id } : {}),
    questionText: question.questionText || "",
    options: [
      ...options,
      ...Array(Math.max(0, 4 - options.length)).fill(""),
    ].slice(0, 4),
    correctOption: Number(question.correctOption ?? 0),
    marks: Number(question.marks ?? 1),
    topic: question.topic || "General",
    explanation: question.explanation || "",
  };
}

function validateForm(form) {
  if (!form.title.trim()) {
    return "Enter an exam title.";
  }

  if (!form.subject.trim()) {
    return "Enter a subject.";
  }

  const duration = Number(form.durationMinutes);

  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 300
  ) {
    return "Duration must be between 1 and 300 minutes.";
  }

  if (!form.questions.length) {
    return "Add at least one question.";
  }

  for (let i = 0; i < form.questions.length; i++) {
    const question = form.questions[i];
    const number = i + 1;

    if (!question.questionText.trim()) {
      return `Question ${number}: enter the question text.`;
    }

    if (
      question.options.length < 2 ||
      question.options.some((option) => !option.trim())
    ) {
      return `Question ${number}: fill in all four answer options.`;
    }

    if (
      !Number.isInteger(Number(question.correctOption)) ||
      Number(question.correctOption) < 0 ||
      Number(question.correctOption) >= question.options.length
    ) {
      return `Question ${number}: select a valid correct answer.`;
    }

    if (
      !Number.isFinite(Number(question.marks)) ||
      Number(question.marks) < 0.5
    ) {
      return `Question ${number}: marks must be at least 0.5.`;
    }
  }

  return "";
}

export default function AdminPanel({ token }) {
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState(emptyExam);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(token, "/exams/admin/all");
      setExams(data.exams || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  function updateExamField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateQuestion(index, field, value) {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question, i) =>
        i === index
          ? { ...question, [field]: value }
          : question
      ),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((question, i) => {
        if (i !== questionIndex) return question;

        const options = [...question.options];
        options[optionIndex] = value;

        return {
          ...question,
          options,
        };
      }),
    }));
  }

  function addQuestion() {
    setForm((previous) => ({
      ...previous,
      questions: [...previous.questions, emptyQuestion()],
    }));

    setError("");
  }

  function removeQuestion(index) {
    if (form.questions.length <= 1) {
      setError("An examination must contain at least one question.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      questions: previous.questions.filter((_, i) => i !== index),
    }));

    setError("");
  }

  function resetForm() {
    setForm(emptyExam());
    setEditingId(null);
    setFormOpen(false);
    setError("");
  }

  function openCreateForm() {
    setForm(emptyExam());
    setEditingId(null);
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  async function openEditForm(examId) {
    setError("");
    setMessage("");
    setActionId(examId);

    try {
      const data = await apiRequest(
        token,
        `/exams/admin/${examId}`
      );

      const exam = data.exam;

      setForm({
        title: exam.title || "",
        description: exam.description || "",
        subject: exam.subject || "",
        durationMinutes: exam.durationMinutes,
        isPublished: Boolean(exam.isPublished),
        questions: (exam.questions || []).map(normalizeQuestion),
      });

      setEditingId(examId);
      setFormOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function saveExam(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject.trim(),
      durationMinutes: Number(form.durationMinutes),
      isPublished: Boolean(form.isPublished),
      questions: form.questions.map((question) => ({
        ...(question._id ? { _id: question._id } : {}),
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()),
        correctOption: Number(question.correctOption),
        marks: Number(question.marks),
        topic: question.topic.trim() || "General",
        explanation: question.explanation.trim(),
      })),
    };

    setSaving(true);

    try {
      const data = await apiRequest(
        token,
        editingId ? `/exams/${editingId}` : "/exams",
        {
          method: editingId ? "PUT" : "POST",
          body: payload,
        }
      );

      setMessage(
        data.message ||
          (editingId
            ? "Exam updated successfully."
            : "Exam created successfully.")
      );

      setForm(emptyExam());
      setEditingId(null);
      setFormOpen(false);

      await loadExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // FIXED: Change only the publication status.
  // Do not resubmit the exam questions when publishing or unpublishing.
  async function togglePublish(exam) {
    setError("");
    setMessage("");
    setActionId(exam._id);

    try {
      const nextPublished = !exam.isPublished;

      const result = await apiRequest(
        token,
        `/exams/${exam._id}`,
        {
          method: "PUT",
          body: {
            isPublished: nextPublished,
          },
        }
      );

      setMessage(
        result.message ||
          (nextPublished
            ? "Exam published."
            : "Exam unpublished.")
      );

      await loadExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  async function deleteExam(exam) {
    const confirmed = window.confirm(
      `Delete "${exam.title}"?\n\nExams with student attempts cannot be deleted.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setActionId(exam._id);

    try {
      const result = await apiRequest(
        token,
        `/exams/${exam._id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result.message || "Exam deleted successfully."
      );

      if (editingId === exam._id) {
        resetForm();
      }

      await loadExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId("");
    }
  }

  const publishedCount = exams.filter(
    (exam) => exam.isPublished
  ).length;

  const draftCount = exams.length - publishedCount;

  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={14} /> ADMINISTRATION
          </div>

          <h1>Exam management</h1>

          <p>
            Create assessments, maintain question banks, and control
            which examinations students can access.
          </p>
        </div>

        {!formOpen && (
          <button
            className="admin-primary-button"
            type="button"
            onClick={openCreateForm}
          >
            <Plus size={17} />
            Create exam
          </button>
        )}
      </div>

      {error && (
        <div className="admin-alert error" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <div className="admin-alert success" role="status">
          <CheckCircle2 size={17} />
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-stats">
        <div className="admin-stat-card">
          <span>Total exams</span>
          <strong>{exams.length}</strong>
          <BookOpen size={20} />
        </div>

        <div className="admin-stat-card">
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <Eye size={20} />
        </div>

        <div className="admin-stat-card">
          <span>Drafts</span>
          <strong>{draftCount}</strong>
          <ClipboardList size={20} />
        </div>
      </div>

      {formOpen && (
        <motion.form
          className="admin-form"
          onSubmit={saveExam}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="admin-form-heading">
            <div>
              <span className="admin-form-kicker">
                {editingId ? "UPDATE ASSESSMENT" : "NEW ASSESSMENT"}
              </span>

              <h2>{editingId ? "Edit exam" : "Create an exam"}</h2>
            </div>

            <button
              type="button"
              className="admin-icon-button"
              onClick={resetForm}
              aria-label="Close exam editor"
            >
              <X size={18} />
            </button>
          </div>

          <div className="admin-field-grid">
            <label>
              Exam title
              <input
                value={form.title}
                maxLength={150}
                onChange={(e) =>
                  updateExamField("title", e.target.value)
                }
                placeholder="e.g. Computer Networks Fundamentals"
                required
              />
            </label>

            <label>
              Subject
              <input
                value={form.subject}
                onChange={(e) =>
                  updateExamField("subject", e.target.value)
                }
                placeholder="e.g. Computer Networks"
                required
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={form.durationMinutes}
                onChange={(e) =>
                  updateExamField("durationMinutes", e.target.value)
                }
                required
              />
            </label>

            <label className="admin-publish-field">
              Publication status
              <span className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    updateExamField("isPublished", e.target.checked)
                  }
                />
                Publish immediately
              </span>
            </label>
          </div>

          <label className="admin-full-field">
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                updateExamField("description", e.target.value)
              }
              rows={3}
              placeholder="Describe the examination..."
            />
          </label>

          <div className="admin-question-heading">
            <div>
              <h3>Questions</h3>
              <p>
                Add MCQs, provide four answer options, and select the
                correct answer.
              </p>
            </div>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={addQuestion}
            >
              <Plus size={15} />
              Add question
            </button>
          </div>

          {form.questions.map((question, index) => (
            <article
              className="admin-question-editor"
              key={question._id || `new-question-${index}`}
            >
              <div className="admin-question-editor-heading">
                <span>
                  QUESTION {String(index + 1).padStart(2, "0")}
                </span>

                <button
                  type="button"
                  className="admin-remove-question"
                  onClick={() => removeQuestion(index)}
                  title="Remove question"
                  aria-label={`Remove question ${index + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <label>
                Question text
                <textarea
                  value={question.questionText}
                  onChange={(e) =>
                    updateQuestion(
                      index,
                      "questionText",
                      e.target.value
                    )
                  }
                  rows={2}
                  placeholder="Enter the MCQ question..."
                  required
                />
              </label>

              <div className="admin-options-grid">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex}>
                    Option {String.fromCharCode(65 + optionIndex)}
                    <input
                      value={option}
                      onChange={(e) =>
                        updateOption(
                          index,
                          optionIndex,
                          e.target.value
                        )
                      }
                      placeholder={`Enter option ${String.fromCharCode(
                        65 + optionIndex
                      )}`}
                      required
                    />
                  </label>
                ))}
              </div>

              <div className="admin-field-grid">
                <label>
                  Correct answer
                  <select
                    value={question.correctOption}
                    onChange={(e) =>
                      updateQuestion(
                        index,
                        "correctOption",
                        Number(e.target.value)
                      )
                    }
                  >
                    {question.options.map((option, optionIndex) => (
                      <option value={optionIndex} key={optionIndex}>
                        {String.fromCharCode(65 + optionIndex)}
                        {option.trim()
                          ? ` — ${option.trim().slice(0, 45)}`
                          : " — Fill in this option"}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Marks
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={question.marks}
                    onChange={(e) =>
                      updateQuestion(index, "marks", e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Topic
                  <input
                    value={question.topic}
                    onChange={(e) =>
                      updateQuestion(index, "topic", e.target.value)
                    }
                    placeholder="e.g. IP Addressing"
                  />
                </label>
              </div>

              <label className="admin-explanation-field">
                Explanation (shown after submission)
                <textarea
                  value={question.explanation}
                  onChange={(e) =>
                    updateQuestion(
                      index,
                      "explanation",
                      e.target.value
                    )
                  }
                  rows={2}
                  placeholder="Explain why the correct answer is right..."
                />
              </label>
            </article>
          ))}

          <div className="admin-form-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle
                  className="admin-spinner"
                  size={17}
                />
              ) : (
                <Save size={17} />
              )}

              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create exam"}
            </button>
          </div>
        </motion.form>
      )}

      <div className="admin-list-heading">
        <div>
          <h2>Your examinations</h2>
          <p>Manage published exams and unpublished drafts.</p>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={loadExams}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle
              className="admin-spinner"
              size={15}
            />
          ) : (
            <ClipboardList size={15} />
          )}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-empty">
          <LoaderCircle
            className="admin-spinner"
            size={28}
          />
          <span>Loading examinations...</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="admin-empty">
          <BookOpen size={34} />
          <h3>No examinations yet</h3>
          <p>
            Create your first examination to make it available for
            publication.
          </p>

          <button
            type="button"
            className="admin-primary-button"
            onClick={openCreateForm}
          >
            <Plus size={17} />
            Create your first exam
          </button>
        </div>
      ) : (
        <div className="admin-exam-list">
          {exams.map((exam, index) => {
            const busy = actionId === exam._id;

            return (
              <motion.article
                key={exam._id}
                className="admin-exam-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(index * 0.04, 0.3),
                }}
              >
                <div className="admin-exam-icon">
                  <BookOpen size={21} />
                </div>

                <div className="admin-exam-info">
                  <div className="admin-exam-title-row">
                    <h3>{exam.title}</h3>

                    <span
                      className={`admin-status ${
                        exam.isPublished ? "published" : "draft"
                      }`}
                    >
                      {exam.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p>{exam.subject}</p>

                  <div className="admin-exam-meta">
                    <span>
                      <ClipboardList size={14} />
                      {exam.questions?.length || 0} questions
                    </span>

                    <span>
                      <Clock3 size={14} />
                      {exam.durationMinutes} min
                    </span>
                  </div>
                </div>

                <div className="admin-exam-actions">
                  <button
                    type="button"
                    className="admin-icon-button"
                    title="Edit exam"
                    aria-label={`Edit ${exam.title}`}
                    disabled={Boolean(actionId)}
                    onClick={() => openEditForm(exam._id)}
                  >
                    {busy ? (
                      <LoaderCircle
                        className="admin-spinner"
                        size={16}
                      />
                    ) : (
                      <Pencil size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-icon-button"
                    title={
                      exam.isPublished
                        ? "Unpublish exam"
                        : "Publish exam"
                    }
                    aria-label={
                      exam.isPublished
                        ? `Unpublish ${exam.title}`
                        : `Publish ${exam.title}`
                    }
                    disabled={Boolean(actionId)}
                    onClick={() => togglePublish(exam)}
                  >
                    {exam.isPublished ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-icon-button danger"
                    title="Delete exam"
                    aria-label={`Delete ${exam.title}`}
                    disabled={Boolean(actionId)}
                    onClick={() => deleteExam(exam)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}