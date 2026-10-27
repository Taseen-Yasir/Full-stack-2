import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8300";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  return (
    <span className={`status-badge status-${normalized.toLowerCase()}`}>
      {normalized === "DLQ" ? "IN DLQ" : normalized}
    </span>
  );
}

function StatCard({ icon, label, value, description, type }) {
  return (
    <article className={`stat-card stat-${type}`}>
      <div className="stat-icon">{icon}</div>

      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-description">{description}</span>
      </div>

      <div className="stat-accent" />
    </article>
  );
}

function App() {
  // -------------------------------------------------------
  // THEME
  // -------------------------------------------------------

  const [theme, setTheme] = useState(
    () => localStorage.getItem("exp81-theme") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("exp81-theme", theme);
  }, [theme]);

  // -------------------------------------------------------
  // BACKEND AND EVENTS
  // -------------------------------------------------------

  const [events, setEvents] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiError, setApiError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "",
    text: "",
  });

  // -------------------------------------------------------
  // EVENT FORM
  // -------------------------------------------------------

  const [form, setForm] = useState({
    eventId: "",
    content: "",
    failuresBeforeSuccess: 0,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // -------------------------------------------------------
  // FETCH EVENTS
  // -------------------------------------------------------

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/events`);

      if (!response.ok) {
        throw new Error(`Backend responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      setEvents(Array.isArray(data) ? data : []);
      setApiStatus("online");
      setApiError("");
    } catch (error) {
      setApiStatus("offline");
      setApiError(
        "Cannot reach the backend. Make sure Spring Boot is running on port 8300."
      );
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const interval = window.setInterval(fetchEvents, 3000);

    return () => window.clearInterval(interval);
  }, [fetchEvents]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }

  // -------------------------------------------------------
  // FORM INPUT
  // -------------------------------------------------------

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "failuresBeforeSuccess"
          ? Math.max(0, Math.min(10, Number(value)))
          : value,
    }));
  }

  // -------------------------------------------------------
  // SUBMIT EVENT TO KAFKA
  // -------------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.content.trim()) {
      setFeedback({
        type: "error",
        text: "Enter some post content before submitting.",
      });
      return;
    }

    if (
      !Number.isInteger(Number(form.failuresBeforeSuccess)) ||
      Number(form.failuresBeforeSuccess) < 0 ||
      Number(form.failuresBeforeSuccess) > 10
    ) {
      setFeedback({
        type: "error",
        text: "Choose between 0 and 10 simulated failures.",
      });
      return;
    }

    setSubmitting(true);

    setFeedback({
      type: "info",
      text: "Submitting the event to Kafka...",
    });

    try {
      const response = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: form.eventId.trim(),
          content: form.content.trim(),
          failuresBeforeSuccess: Number(form.failuresBeforeSuccess),
        }),
      });

      const raw = await response.text();

      let data = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Request failed with HTTP ${response.status}`
        );
      }

      setFeedback({
        type: "success",
        text: `${data.eventId || "Event"}: ${
          data.message || "Successfully submitted."
        }`,
      });

      setForm({
        eventId: "",
        content: "",
        failuresBeforeSuccess: 0,
      });

      await fetchEvents();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error.message ||
          "Submission failed. Check the backend and Kafka.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------
  // PRE-FILLED DEMOS
  // -------------------------------------------------------

  function fillDemo(type) {
    const suffix = Date.now().toString().slice(-6);

    if (type === "retry") {
      setForm({
        eventId: `POST-RETRY-${suffix}`,
        content: "Testing exponential backoff retries",
        failuresBeforeSuccess: 2,
      });

      setFeedback({
        type: "info",
        text: "Retry demo prepared. Click Send Event to run it.",
      });
    } else {
      setForm({
        eventId: `POST-DLQ-${suffix}`,
        content: "Testing the Kafka Dead Letter Queue",
        failuresBeforeSuccess: 10,
      });

      setFeedback({
        type: "info",
        text: "DLQ demo prepared. Click Send Event to run it.",
      });
    }
  }

  // -------------------------------------------------------
  // DASHBOARD METRICS
  // -------------------------------------------------------

  const metrics = useMemo(() => {
    return {
      total: events.length,

      processed: events.filter(
        (event) => event.status === "PROCESSED"
      ).length,

      retrying: events.filter(
        (event) =>
          event.status === "RETRYING" ||
          event.status === "PROCESSING"
      ).length,

      dlq: events.filter(
        (event) => event.status === "DLQ"
      ).length,

      queued: events.filter(
        (event) => event.status === "QUEUED"
      ).length,
    };
  }, [events]);

  const dlqEvents = useMemo(
    () => events.filter((event) => event.status === "DLQ"),
    [events]
  );

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className={`dashboard theme-${theme}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">⌘</div>

          <div className="brand-copy">
            <div className="eyebrow">FULL STACK DEVELOPMENT II</div>

            <h1>
              Kafka<span>Pulse</span>
              <span className="version-badge">EXP 8.1</span>
            </h1>

            <p>Event Processing · Reliability · Fault Tolerance</p>
          </div>
        </div>

        <div className="header-right">
          <div className="owner-card">
            <div className="owner-avatar">TP</div>

            <div className="owner-text">
              <span>PROJECT OWNER</span>
              <strong>{STUDENT_NAME}</strong>
              <small>UID: {STUDENT_UID}</small>
            </div>
          </div>

          <div className="clock-card">
            <span className="clock-icon">◷</span>

            <div>
              <strong>
                {currentTime.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>

              <span>
                {currentTime.toLocaleTimeString("en-IN")}
              </span>
            </div>
          </div>

          <button
            className="theme-toggle"
            type="button"
            onClick={() =>
              setTheme((old) => (old === "dark" ? "light" : "dark"))
            }
            title="Toggle theme"
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      {/* CONNECTION ERROR */}
      {apiStatus === "offline" && (
        <div className="connection-alert">
          <span>!</span>

          <div>
            <strong>Backend connection unavailable</strong>
            <p>{apiError}</p>
          </div>

          <button onClick={handleRefresh} type="button">
            Retry connection
          </button>
        </div>
      )}

      {/* MAIN */}
      <main className="main-content">
        {/* TOP LAYOUT */}
        <div className="top-layout">
          {/* EVENT COMPOSER */}
          <section className="panel composer-panel">
            <div className="panel-heading">
              <div className="heading-icon blue-icon">➤</div>

              <div>
                <div className="eyebrow">EVENT PRODUCER</div>
                <h2>Submit New Event</h2>
                <p>Publish a scheduled-post event to Kafka.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="eventId">
                EVENT ID
                <span>Optional · Auto-generated if blank</span>
              </label>

              <input
                id="eventId"
                name="eventId"
                type="text"
                value={form.eventId}
                onChange={updateForm}
                placeholder="e.g. POST-100"
                maxLength={100}
              />

              <label className="field-label" htmlFor="content">
                POST CONTENT
              </label>

              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={updateForm}
                placeholder="Write the content of your scheduled post..."
                rows={3}
                maxLength={2000}
                required
              />

              <div className="field-row">
                <label className="field-label" htmlFor="failures">
                  SIMULATED FAILURES
                </label>

                <span className="field-value">
                  {form.failuresBeforeSuccess}
                </span>
              </div>

              <input
                id="failures"
                className="number-input"
                name="failuresBeforeSuccess"
                type="number"
                min="0"
                max="10"
                value={form.failuresBeforeSuccess}
                onChange={updateForm}
              />

              <div className="range-hints">
                <span>0 · Normal event</span>
                <span>2 · Retry demo</span>
                <span>10 · DLQ demo</span>
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >
                <span>{submitting ? "SUBMITTING..." : "SEND EVENT TO KAFKA"}</span>
                <span className="button-arrow">↗</span>
              </button>

              {feedback.text && (
                <div className={`feedback feedback-${feedback.type}`}>
                  {feedback.text}
                </div>
              )}
            </form>

            <div className="demo-actions">
              <button
                type="button"
                className="demo-button retry-demo"
                onClick={() => fillDemo("retry")}
              >
                ↻ Fill retry demo
              </button>

              <button
                type="button"
                className="demo-button dlq-demo"
                onClick={() => fillDemo("dlq")}
              >
                ⚠ Fill DLQ demo
              </button>
            </div>
          </section>

          {/* OVERVIEW */}
          <div className="overview-column">
            {/* STAT CARDS */}
            <section className="stats-grid">
              <StatCard
                icon="▤"
                label="TOTAL EVENTS"
                value={metrics.total}
                description="Submitted"
                type="blue"
              />

              <StatCard
                icon="✓"
                label="PROCESSED"
                value={metrics.processed}
                description="Completed successfully"
                type="green"
              />

              <StatCard
                icon="↻"
                label="RETRYING"
                value={metrics.retrying}
                description="Active retries"
                type="orange"
              />

              <StatCard
                icon="⚠"
                label="DEAD LETTER QUEUE"
                value={metrics.dlq}
                description="Failed permanently"
                type="red"
              />
            </section>

            {/* SYSTEM + HOW IT WORKS */}
            <section className="overview-panels">
              <article className="panel system-panel">
                <div className="section-title">
                  <span className="mini-icon">⌁</span>

                  <div>
                    <h3>System Status</h3>
                    <p>Service connectivity</p>
                  </div>
                </div>

                <div className="system-row">
                  <div className="system-symbol">◈</div>

                  <div className="system-info">
                    <strong>Spring Boot Backend</strong>
                    <span>localhost:8300</span>
                  </div>

                  <span
                    className={`connection-badge ${
                      apiStatus === "online" ? "connected" : "disconnected"
                    }`}
                  >
                    {apiStatus === "online"
                      ? "ONLINE"
                      : apiStatus === "checking"
                      ? "CHECKING"
                      : "OFFLINE"}
                  </span>
                </div>

                <div className="system-row">
                  <div className="system-symbol kafka-symbol">⌘</div>

                  <div className="system-info">
                    <strong>Apache Kafka</strong>
                    <span>Broker: localhost:9092</span>
                  </div>

                  <span className="connection-badge configured">
                    CONFIGURED
                  </span>
                </div>

                <div className="system-row">
                  <div className="system-symbol">⇄</div>

                  <div className="system-info">
                    <strong>Kafka Consumers</strong>
                    <span>Events + DLQ listeners</span>
                  </div>

                  <span className="connection-badge configured">
                    ENABLED
                  </span>
                </div>

                <div className="system-row">
                  <div className="system-symbol">▦</div>

                  <div className="system-info">
                    <strong>H2 Event Database</strong>
                    <span>Persistent event tracking</span>
                  </div>

                  <span className="connection-badge configured">
                    ENABLED
                  </span>
                </div>
              </article>

              <article className="panel workflow-panel">
                <div className="section-title">
                  <span className="mini-icon purple-icon">◎</span>

                  <div>
                    <h3>Reliability Workflow</h3>
                    <p>How the system handles events</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-number step-blue">01</span>

                  <div>
                    <strong>Produce</strong>
                    <p>Send an event to the Kafka topic.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-number step-purple">02</span>

                  <div>
                    <strong>Process</strong>
                    <p>Consumer reads and validates the event.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-number step-orange">03</span>

                  <div>
                    <strong>Retry</strong>
                    <p>Failures trigger exponential backoff.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-number step-red">04</span>

                  <div>
                    <strong>Dead Letter Queue</strong>
                    <p>Exhausted events are routed to the DLQ.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-number step-green">05</span>

                  <div>
                    <strong>Idempotency</strong>
                    <p>Previously submitted event IDs are rejected.</p>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </div>

        {/* ALL EVENTS */}
        <section className="panel table-panel">
          <div className="table-heading">
            <div className="table-heading-left">
              <div className="heading-icon blue-icon">≡</div>

              <div>
                <div className="eyebrow">EVENT MONITOR</div>
                <h2>All Events</h2>
                <p>Automatically refreshed every 3 seconds.</p>
              </div>
            </div>

            <div className="table-tools">
              <span className="record-count">
                {events.length} RECORD{events.length === 1 ? "" : "S"}
              </span>

              <button
                className="refresh-button"
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>EVENT ID</th>
                  <th>CONTENT</th>
                  <th>STATUS</th>
                  <th>ATTEMPTS</th>
                  <th>FAILURES</th>
                  <th>LAST ERROR</th>
                  <th>CREATED</th>
                  <th>UPDATED</th>
                </tr>
              </thead>

              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <div className="empty-icon">⌁</div>
                      <strong>No events yet</strong>
                      <span>Submit an event to see live processing data.</span>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.eventId || event.id}>
                      <td>
                        <span className="event-id">
                          {event.eventId || "—"}
                        </span>
                      </td>

                      <td className="content-cell">
                        {event.content || "—"}
                      </td>

                      <td>
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="number-cell">
                        {event.attempts ?? 0}
                      </td>

                      <td className="number-cell">
                        {event.failuresBeforeSuccess ?? 0}
                      </td>

                      <td className="error-cell">
                        {event.lastError || "—"}
                      </td>

                      <td>{formatDate(event.createdAt)}</td>
                      <td>{formatDate(event.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* DLQ */}
        <section className="panel table-panel dlq-panel">
          <div className="table-heading">
            <div className="table-heading-left">
              <div className="heading-icon red-icon">⚠</div>

              <div>
                <div className="eyebrow">FAILED EVENT STORAGE</div>
                <h2>Dead Letter Queue</h2>
                <p>Events that exhausted their configured retry attempts.</p>
              </div>
            </div>

            <span className="dlq-counter">
              {dlqEvents.length} IN DLQ
            </span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>EVENT ID</th>
                  <th>CONTENT</th>
                  <th>ATTEMPTS</th>
                  <th>LAST ERROR</th>
                  <th>CREATED</th>
                  <th>UPDATED</th>
                </tr>
              </thead>

              <tbody>
                {dlqEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state compact-empty">
                      <div className="empty-icon">✓</div>
                      <strong>DLQ is clear</strong>
                      <span>No permanently failed events are recorded.</span>
                    </td>
                  </tr>
                ) : (
                  dlqEvents.map((event) => (
                    <tr key={event.eventId || event.id}>
                      <td>
                        <span className="event-id">
                          {event.eventId || "—"}
                        </span>
                      </td>

                      <td className="content-cell">
                        {event.content || "—"}
                      </td>

                      <td className="number-cell">
                        {event.attempts ?? 0}
                      </td>

                      <td className="error-cell">
                        {event.lastError || "Processing failed"}
                      </td>

                      <td>{formatDate(event.createdAt)}</td>
                      <td>{formatDate(event.updatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="footer-symbol">⌘</div>

          <div>
            <strong>KafkaPulse · Experiment 8.1</strong>
            <span>Kafka Reliability and Fault-Tolerant Event Processing</span>
          </div>
        </div>

        <div className="footer-owner">
          <span>{STUDENT_NAME}</span>
          <strong>UID: {STUDENT_UID}</strong>
          <small>Computer Science & Engineering · AI & ML</small>
        </div>
      </footer>
    </div>
  );
}

export default App;