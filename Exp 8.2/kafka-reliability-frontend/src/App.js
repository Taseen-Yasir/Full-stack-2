import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8301";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();

  return (
    <span className={`status-pill status-${normalized.toLowerCase()}`}>
      <span className="status-dot" />
      {normalized}
    </span>
  );
}

function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>

      <strong className="metric-number">{value}</strong>
      <span className="metric-detail">{detail}</span>
      <div className="metric-bottom-line" />
    </article>
  );
}

function App() {
  // Independent theme setting for Exp 8.2
  const [theme, setTheme] = useState(
    () => localStorage.getItem("exp82-theme") || "light"
  );

  useEffect(() => {
    localStorage.setItem("exp82-theme", theme);
  }, [theme]);

  // Backend and event data
  const [events, setEvents] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiError, setApiError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Event form
  const [form, setForm] = useState({
    eventId: "",
    content: "",
    failuresBeforeSuccess: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    text: "",
  });

  // Event ledger controls
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedEventId, setSelectedEventId] = useState("");

  // -------------------------------------------------------
  // LOAD EVENTS
  // -------------------------------------------------------

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/events`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setEvents(Array.isArray(data) ? data : []);
      setApiStatus("online");
      setApiError("");
    } catch {
      setApiStatus("offline");
      setApiError(
        "Unable to reach port 8301. Check that the Exp 8.2 backend is running."
      );
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const timer = window.setInterval(fetchEvents, 3000);
    return () => window.clearInterval(timer);
  }, [fetchEvents]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }

  // -------------------------------------------------------
  // FORM
  // -------------------------------------------------------

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "failuresBeforeSuccess"
          ? Math.max(0, Math.min(10, Number(value)))
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.content.trim()) {
      setFeedback({
        type: "error",
        text: "Please enter the event content.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback({
      type: "info",
      text: "Submitting event to the Exp 8.2 Kafka topic...",
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
          failuresBeforeSuccess: Number(
            form.failuresBeforeSuccess
          ),
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
        text: `${data.eventId}: ${data.message || "Event submitted."}`,
      });

      setForm({
        eventId: "",
        content: "",
        failuresBeforeSuccess: 0,
      });

      if (data.eventId) setSelectedEventId(data.eventId);

      await fetchEvents();
    } catch (error) {
      setFeedback({
        type: "error",
        text: error.message || "Unable to submit the event.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------
  // DEMO SCENARIOS
  // -------------------------------------------------------

  function prepareScenario(type) {
    const suffix = Date.now().toString().slice(-6);

    if (type === "normal") {
      setForm({
        eventId: `E82-EVENT-${suffix}`,
        content: "Experiment 8.2 normal scheduled-post event",
        failuresBeforeSuccess: 0,
      });
    } else if (type === "retry") {
      setForm({
        eventId: `E82-RETRY-${suffix}`,
        content: "Experiment 8.2 exponential-backoff test",
        failuresBeforeSuccess: 2,
      });
    } else {
      setForm({
        eventId: `E82-DLQ-${suffix}`,
        content: "Experiment 8.2 permanent-failure DLQ test",
        failuresBeforeSuccess: 10,
      });
    }

    setFeedback({
      type: "info",
      text: "Demo scenario loaded. Click Submit Event to run it.",
    });
  }

  // -------------------------------------------------------
  // CALCULATE ANALYTICS FROM REAL EVENT RECORDS
  // -------------------------------------------------------

  const analytics = useMemo(() => {
    const total = events.length;

    const processed = events.filter(
      (event) => event.status === "PROCESSED"
    ).length;

    const retrying = events.filter(
      (event) =>
        event.status === "RETRYING" ||
        event.status === "PROCESSING"
    ).length;

    const dlq = events.filter(
      (event) => event.status === "DLQ"
    ).length;

    const queued = events.filter(
      (event) => event.status === "QUEUED"
    ).length;

    const retriedEvents = events.filter(
      (event) => Number(event.attempts || 0) > 1
    ).length;

    const averageAttempts = total
      ? (
          events.reduce(
            (sum, event) => sum + Number(event.attempts || 0),
            0
          ) / total
        ).toFixed(1)
      : "0.0";

    const successRate = total
      ? Math.round((processed / total) * 100)
      : 0;

    return {
      total,
      processed,
      retrying,
      dlq,
      queued,
      retriedEvents,
      averageAttempts,
      successRate,
    };
  }, [events]);

  const dlqEvents = useMemo(
    () => events.filter((event) => event.status === "DLQ"),
    [events]
  );

  const selectedEvent =
    events.find((event) => event.eventId === selectedEventId) ||
    events[0] ||
    null;

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        if (activeFilter === "PROCESSED") {
          return event.status === "PROCESSED";
        }

        if (activeFilter === "RETRIED") {
          return Number(event.attempts || 0) > 1;
        }

        if (activeFilter === "DLQ") {
          return event.status === "DLQ";
        }

        if (activeFilter === "ACTIVE") {
          return ["QUEUED", "PROCESSING", "RETRYING"].includes(
            event.status
          );
        }

        return true;
      })
      .filter((event) => {
        if (!query) return true;

        return (
          String(event.eventId || "").toLowerCase().includes(query) ||
          String(event.content || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [events, search, activeFilter]);

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className={`streamops theme-${theme}`}>
      <aside className="sidebar">
        <a className="sidebar-brand" href="#overview">
          <div className="sidebar-brand-icon">S</div>
          <div>
            <strong>StreamOps</strong>
            <span>RELIABILITY SUITE</span>
          </div>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="side-navigation">
          <a className="nav-item nav-active" href="#overview">
            <span>▦</span> Overview
          </a>

          <a className="nav-item" href="#event-ledger">
            <span>☷</span> Event Ledger
          </a>

          <a className="nav-item" href="#retry-analysis">
            <span>↻</span> Retry Analysis
          </a>

          <a className="nav-item" href="#dead-letter-queue">
            <span>⚑</span> Dead Letter Queue
            <b>{analytics.dlq}</b>
          </a>
        </nav>

        <div className="sidebar-section-label">SYSTEM</div>

        <div className="sidebar-system">
          <span className={`live-dot ${apiStatus}`} />
          <div>
            <strong>Backend API</strong>
            <small>
              {apiStatus === "online"
                ? "Connected"
                : apiStatus === "checking"
                ? "Checking..."
                : "Disconnected"}
            </small>
          </div>
        </div>

        <div className="sidebar-system">
          <span className="live-dot configured-dot" />
          <div>
            <strong>Kafka Broker</strong>
            <small>localhost:9092</small>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-experiment">
            <span className="experiment-label">CURRENT EXPERIMENT</span>
            <strong>8.2</strong>
            <p>Event Reliability Analytics</p>
          </div>

          <div className="sidebar-owner">
            <div className="owner-avatar">TP</div>
            <div>
              <strong>{STUDENT_NAME}</strong>
              <span>UID: {STUDENT_UID}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="workspace">
        {/* TOP HEADER */}
        <header className="workspace-header">
          <div className="breadcrumb">
            <span>Experiments</span>
            <span>/</span>
            <strong>8.2 Reliability Analytics</strong>
          </div>

          <div className="header-actions">
            <span className={`api-indicator ${apiStatus}`}>
              <span className="live-dot" />
              {apiStatus === "online"
                ? "API CONNECTED"
                : apiStatus === "checking"
                ? "CONNECTING"
                : "API OFFLINE"}
            </span>

            <button
              className="theme-button"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
              type="button"
            >
              {theme === "light" ? "☾ Dark mode" : "☀ Light mode"}
            </button>

            <button
              className="icon-button"
              onClick={handleRefresh}
              type="button"
              disabled={refreshing}
              title="Refresh events"
            >
              {refreshing ? "…" : "↻"}
            </button>
          </div>
        </header>

        {apiStatus === "offline" && (
          <div className="connection-warning">
            <strong>Backend disconnected.</strong> {apiError}
            <button onClick={handleRefresh} type="button">
              Retry connection
            </button>
          </div>
        )}

        <main className="dashboard-main">
          {/* INTRO */}
          <section className="page-intro" id="overview">
            <div>
              <div className="section-eyebrow">
                EVENT-DRIVEN SYSTEMS / OBSERVABILITY
              </div>

              <h1>Reliability Overview</h1>

              <p>
                Monitor processing outcomes, inspect retry behavior,
                and investigate failed events across the Kafka pipeline.
              </p>
            </div>

            <div className="intro-owner">
              <span className="intro-avatar">TP</span>
              <div>
                <small>PROJECT BY</small>
                <strong>{STUDENT_NAME}</strong>
                <span>UID: {STUDENT_UID}</span>
              </div>
            </div>
          </section>

          {/* METRICS */}
          <section className="metrics-grid">
            <MetricCard
              label="TOTAL EVENTS"
              value={analytics.total}
              detail={`${analytics.queued} currently queued`}
              icon="↗"
              tone="navy"
            />

            <MetricCard
              label="SUCCESS RATE"
              value={`${analytics.successRate}%`}
              detail={`${analytics.processed} processed successfully`}
              icon="✓"
              tone="green"
            />

            <MetricCard
              label="EVENTS RETRIED"
              value={analytics.retriedEvents}
              detail={`Average ${analytics.averageAttempts} attempts per event`}
              icon="↻"
              tone="orange"
            />

            <MetricCard
              label="DEAD LETTER QUEUE"
              value={analytics.dlq}
              detail="Events requiring investigation"
              icon="!"
              tone="red"
            />
          </section>

          {/* MAIN WORK AREA */}
          <section className="main-grid">
            {/* EVENT SUBMISSION */}
            <article className="card event-composer">
              <div className="card-heading">
                <div>
                  <div className="section-eyebrow">PRODUCER CONSOLE</div>
                  <h2>Create an Event</h2>
                  <p>Publish an event to the Exp 8.2 Kafka topic.</p>
                </div>

                <span className="heading-symbol">＋</span>
              </div>

              <div className="scenario-row">
                <button
                  type="button"
                  onClick={() => prepareScenario("normal")}
                  className="scenario scenario-normal"
                >
                  <span>01</span>
                  Normal
                </button>

                <button
                  type="button"
                  onClick={() => prepareScenario("retry")}
                  className="scenario scenario-retry"
                >
                  <span>02</span>
                  Retry test
                </button>

                <button
                  type="button"
                  onClick={() => prepareScenario("dlq")}
                  className="scenario scenario-dlq"
                >
                  <span>03</span>
                  DLQ test
                </button>
              </div>

              <form className="event-form" onSubmit={handleSubmit}>
                <label htmlFor="eventId">
                  Event ID
                  <span>Leave empty for automatic generation</span>
                </label>

                <input
                  id="eventId"
                  name="eventId"
                  value={form.eventId}
                  onChange={handleInputChange}
                  placeholder="E82-EVENT-001"
                  maxLength={100}
                />

                <label htmlFor="content">Event content</label>

                <textarea
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={handleInputChange}
                  placeholder="Enter scheduled post content..."
                  rows={4}
                  maxLength={2000}
                  required
                />

                <div className="failure-setting">
                  <div>
                    <label htmlFor="failuresBeforeSuccess">
                      Simulated failures
                    </label>
                    <p>Choose how many attempts should fail first.</p>
                  </div>

                  <input
                    id="failuresBeforeSuccess"
                    name="failuresBeforeSuccess"
                    type="number"
                    min="0"
                    max="10"
                    value={form.failuresBeforeSuccess}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="failure-hints">
                  <span>0 = success</span>
                  <span>2 = retry scenario</span>
                  <span>10 = DLQ scenario</span>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Event"}
                  <span>↗</span>
                </button>

                {feedback.text && (
                  <div className={`form-feedback feedback-${feedback.type}`}>
                    {feedback.text}
                  </div>
                )}
              </form>

              <div className="topic-reference">
                <span className="topic-indicator" />
                <div>
                  <strong>Target Kafka Topic</strong>
                  <code>scheduled-posts-82</code>
                </div>
              </div>
            </article>

            {/* RETRY ANALYTICS */}
            <div className="analytics-column">
              <article className="card retry-analytics" id="retry-analysis">
                <div className="card-heading">
                  <div>
                    <div className="section-eyebrow">PROCESSING INSIGHTS</div>
                    <h2>Retry Analysis</h2>
                    <p>Summary calculated from stored event records.</p>
                  </div>

                  <span className="heading-symbol orange-symbol">↻</span>
                </div>

                <div className="retry-summary">
                  <div className="retry-big-number">
                    {analytics.retriedEvents}
                  </div>

                  <div>
                    <strong>Events with retries</strong>
                    <span>Events with more than one attempt</span>
                  </div>
                </div>

                <div className="chart-title">
                  <span>EVENT STATUS DISTRIBUTION</span>
                  <small>{analytics.total} total events</small>
                </div>

                {[
                  {
                    label: "Processed",
                    value: analytics.processed,
                    color: "bar-green",
                  },
                  {
                    label: "Queued",
                    value: analytics.queued,
                    color: "bar-blue",
                  },
                  {
                    label: "Retrying",
                    value: analytics.retrying,
                    color: "bar-orange",
                  },
                  {
                    label: "DLQ",
                    value: analytics.dlq,
                    color: "bar-red",
                  },
                ].map((item) => {
                  const percentage = analytics.total
                    ? (item.value / analytics.total) * 100
                    : 0;

                  return (
                    <div className="distribution-row" key={item.label}>
                      <div className="distribution-label">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>

                      <div className="distribution-track">
                        <div
                          className={`distribution-fill ${item.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="analytics-note">
                  <span>i</span>
                  <p>
                    Retry delays are configured by the Spring Kafka
                    exponential-backoff error handler.
                  </p>
                </div>
              </article>

              {/* EVENT INSPECTOR */}
              <article className="card event-inspector">
                <div className="card-heading inspector-heading">
                  <div>
                    <div className="section-eyebrow">EVENT INSPECTOR</div>
                    <h2>Selected Event</h2>
                  </div>

                  <span className="heading-symbol">⌕</span>
                </div>

                {selectedEvent ? (
                  <>
                    <div className="inspector-event-id">
                      {selectedEvent.eventId}
                    </div>

                    <div className="inspector-status-row">
                      <span>Current status</span>
                      <StatusBadge status={selectedEvent.status} />
                    </div>

                    <div className="inspector-details">
                      <div>
                        <span>Attempts</span>
                        <strong>{selectedEvent.attempts ?? 0}</strong>
                      </div>

                      <div>
                        <span>Simulated failures</span>
                        <strong>
                          {selectedEvent.failuresBeforeSuccess ?? 0}
                        </strong>
                      </div>
                    </div>

                    <div className="inspector-content">
                      <span>CONTENT</span>
                      <p>{selectedEvent.content || "No content recorded"}</p>
                    </div>

                    {selectedEvent.lastError && (
                      <div className="inspector-error">
                        <strong>Last processing error</strong>
                        <p>{selectedEvent.lastError}</p>
                      </div>
                    )}

                    <div className="inspector-footer">
                      <span>Last updated</span>
                      <strong>{formatDate(selectedEvent.updatedAt)}</strong>
                    </div>
                  </>
                ) : (
                  <div className="inspector-empty">
                    <span>⌕</span>
                    <strong>No event selected</strong>
                    <p>Submit an event or select a record below.</p>
                  </div>
                )}
              </article>
            </div>
          </section>

          {/* EVENT LEDGER */}
          <section className="card ledger-card" id="event-ledger">
            <div className="ledger-heading">
              <div>
                <div className="section-eyebrow">EVENT OBSERVABILITY</div>
                <h2>Event Ledger</h2>
                <p>Inspect processing records and select an event to view its details.</p>
              </div>

              <button
                type="button"
                className="refresh-ledger"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            <div className="ledger-controls">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search event ID or content..."
                />
              </div>

              <div className="filter-tabs">
                {[
                  "ALL",
                  "ACTIVE",
                  "PROCESSED",
                  "RETRIED",
                  "DLQ",
                ].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={
                      activeFilter === filter ? "filter-active" : ""
                    }
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="ledger-table-wrap">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>EVENT ID</th>
                    <th>CONTENT</th>
                    <th>STATUS</th>
                    <th>ATTEMPTS</th>
                    <th>FAILURES</th>
                    <th>UPDATED</th>
                    <th>INSPECT</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="ledger-empty">
                        <span>▤</span>
                        <strong>No matching events</strong>
                        <small>Submit an event or change the filters.</small>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr
                        key={event.eventId || event.id}
                        className={
                          selectedEventId === event.eventId
                            ? "selected-row"
                            : ""
                        }
                      >
                        <td>
                          <span className="ledger-event-id">
                            {event.eventId}
                          </span>
                        </td>

                        <td className="ledger-content">
                          {event.content}
                        </td>

                        <td>
                          <StatusBadge status={event.status} />
                        </td>

                        <td>{event.attempts ?? 0}</td>
                        <td>{event.failuresBeforeSuccess ?? 0}</td>
                        <td>{formatDate(event.updatedAt)}</td>

                        <td>
                          <button
                            type="button"
                            className="inspect-button"
                            onClick={() =>
                              setSelectedEventId(event.eventId)
                            }
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ledger-footer">
              <span>
                Showing {filteredEvents.length} of {events.length} records
              </span>
              <span>Auto-refresh interval: 3 seconds</span>
            </div>
          </section>

          {/* DLQ */}
          <section className="card dead-letter-card" id="dead-letter-queue">
            <div className="ledger-heading">
              <div className="dlq-heading-title">
                <span className="dlq-icon">!</span>
                <div>
                  <div className="section-eyebrow">FAILURE INVESTIGATION</div>
                  <h2>Dead Letter Queue</h2>
                  <p>Events that exhausted the configured retries.</p>
                </div>
              </div>

              <span className="dlq-total">{dlqEvents.length} EVENTS</span>
            </div>

            <div className="dlq-content">
              {dlqEvents.length === 0 ? (
                <div className="dlq-empty">
                  <span>✓</span>
                  <div>
                    <strong>No events currently in the DLQ</strong>
                    <p>
                      Use the DLQ test scenario to deliberately simulate
                      persistent processing failures.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="ledger-table-wrap">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>EVENT ID</th>
                        <th>CONTENT</th>
                        <th>ATTEMPTS</th>
                        <th>LAST ERROR</th>
                        <th>UPDATED</th>
                        <th>INSPECT</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dlqEvents.map((event) => (
                        <tr key={event.eventId}>
                          <td>
                            <span className="ledger-event-id">
                              {event.eventId}
                            </span>
                          </td>

                          <td className="ledger-content">
                            {event.content}
                          </td>

                          <td>{event.attempts ?? 0}</td>
                          <td className="error-text">
                            {event.lastError || "Processing failed"}
                          </td>
                          <td>{formatDate(event.updatedAt)}</td>

                          <td>
                            <button
                              type="button"
                              className="inspect-button"
                              onClick={() =>
                                setSelectedEventId(event.eventId)
                              }
                            >
                              Inspect →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="workspace-footer">
          <div className="footer-left">
            <span className="footer-logo">S</span>
            <div>
              <strong>StreamOps · Experiment 8.2</strong>
              <span>Kafka Reliability Analytics Console</span>
            </div>
          </div>

          <div className="footer-identity">
            <strong>{STUDENT_NAME}</strong>
            <span>UID: {STUDENT_UID}</span>
          </div>

          <div className="footer-status">
            <span className={`live-dot ${apiStatus}`} />
            {apiStatus === "online" ? "BACKEND ONLINE" : "BACKEND STATUS"}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;