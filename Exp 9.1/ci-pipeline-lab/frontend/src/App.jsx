import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8400";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toLowerCase();

  return (
    <span className={`status-badge status-${normalized}`}>
      <span className="status-dot" />
      {status || "UNKNOWN"}
    </span>
  );
}

function App() {
  const [builds, setBuilds] = useState([]);
  const [apiStatus, setApiStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [commitMessage, setCommitMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedBuildId, setSelectedBuildId] = useState(null);

  const [notice, setNotice] = useState({
    type: "",
    message: "",
  });

  // Load build records from the Spring Boot API.
  const loadBuilds = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);

    try {
      const response = await fetch(`${API_BASE}/api/builds`);

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      setBuilds(Array.isArray(data) ? data : []);
      setApiStatus("online");
    } catch (error) {
      setApiStatus("offline");

      setNotice({
        type: "error",
        message: `Cannot connect to the backend at ${API_BASE}. Make sure Spring Boot is running on port 8400.`,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBuilds();

    const timer = window.setInterval(() => {
      loadBuilds();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [loadBuilds]);

  // Submit a build record.
  async function handleSubmit(event) {
    event.preventDefault();

    const message = commitMessage.trim();

    if (!message) {
      setNotice({
        type: "error",
        message: "Please enter a commit message.",
      });
      return;
    }

    if (message.length > 200) {
      setNotice({
        type: "error",
        message: "Commit message must not exceed 200 characters.",
      });
      return;
    }

    setSubmitting(true);
    setNotice({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/api/builds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commitMessage: message,
        }),
      });

      const raw = await response.text();
      let result = {};

      try {
        result = raw ? JSON.parse(raw) : {};
      } catch {
        result = { message: raw };
      }

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.message ||
            result.title ||
            `Request failed with HTTP ${response.status}`
        );
      }

      setCommitMessage("");

      setNotice({
        type: "success",
        message: `Build record #${result.id} was created successfully.`,
      });

      await loadBuilds();

      if (result.id != null) {
        setSelectedBuildId(result.id);
      }
    } catch (error) {
      setNotice({
        type: "error",
        message: error.message || "Unable to create the build record.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const stats = useMemo(() => {
    const total = builds.length;

    const queued = builds.filter(
      (build) => build.status === "QUEUED"
    ).length;

    const completed = builds.filter(
      (build) => build.status === "COMPLETED"
    ).length;

    return {
      total,
      queued,
      completed,
    };
  }, [builds]);

  const filteredBuilds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return builds
      .filter((build) => {
        if (filter === "QUEUED") {
          return build.status === "QUEUED";
        }

        if (filter === "COMPLETED") {
          return build.status === "COMPLETED";
        }

        return true;
      })
      .filter((build) => {
        return (
          !query ||
          String(build.id).includes(query) ||
          String(build.commitMessage || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [builds, search, filter]);

  const selectedBuild =
    builds.find(
      (build) => String(build.id) === String(selectedBuildId)
    ) || null;

  return (
    <div className="ci-app">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <div className="brand-logo">
            <span className="brand-symbol">C</span>
            <span className="brand-check">✓</span>
          </div>

          <div className="brand-copy">
            <strong>CI Pipeline Lab</strong>
            <span>CONTINUOUS INTEGRATION</span>
          </div>
        </a>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="#dashboard">
            <span className="nav-icon">▦</span>
            Overview
          </a>

          <a className="nav-link" href="#create-build">
            <span className="nav-icon">＋</span>
            Create Build
          </a>

          <a className="nav-link" href="#build-history">
            <span className="nav-icon">☷</span>
            Build History
          </a>

          <a className="nav-link" href="#test-stages">
            <span className="nav-icon">✓</span>
            Test Stages
          </a>
        </nav>

        <div className="sidebar-label">ENVIRONMENT</div>

        <div className="environment-card">
          <span className="environment-dot" />

          <div>
            <strong>Spring Boot API</strong>
            <span>localhost:8400</span>
          </div>

          <span
            className={`connection-icon ${apiStatus}`}
            title={`Backend ${apiStatus}`}
          />
        </div>

        <div className="sidebar-bottom">
          <div className="student-card">
            <span className="student-overline">PROJECT AUTHOR</span>

            <div className="student-profile">
              <div className="student-avatar">TP</div>

              <div className="student-info">
                <strong>{STUDENT_NAME}</strong>
                <span>UID: {STUDENT_UID}</span>
              </div>
            </div>

            <div className="student-divider" />

            <div className="student-course">
              <span>Experiment</span>
              <strong>9.1</strong>
            </div>

            <p>Continuous Integration Pipeline</p>
          </div>

          <div className="sidebar-version">
            <span className="version-dot" />
            Local development environment
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Experiments</span>
            <span className="breadcrumb-separator">/</span>
            <strong>CI Pipeline</strong>
          </div>

          <div className="topbar-right">
            <div className={`api-chip ${apiStatus}`}>
              <span className="api-chip-dot" />

              {apiStatus === "online"
                ? "API CONNECTED"
                : apiStatus === "checking"
                ? "CONNECTING..."
                : "API OFFLINE"}
            </div>

            <button
              className="refresh-button"
              onClick={() => loadBuilds(true)}
              disabled={refreshing}
              type="button"
            >
              <span className={refreshing ? "refresh-spinning" : ""}>
                ↻
              </span>
              Refresh
            </button>
          </div>
        </header>

        <div className="page-container" id="dashboard">
          <section className="welcome-section">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                DEVELOPER WORKSPACE
              </div>

              <h1>
                Build. Test.
                <span className="gradient-text"> Deliver.</span>
              </h1>

              <p>
                Track build records, validate your application,
                and explore the components of a reliable CI pipeline.
              </p>

              <div className="welcome-tags">
                <span>
                  <span className="tag-check">✓</span>
                  Automated testing
                </span>

                <span>
                  <span className="tag-check">✓</span>
                  API monitoring
                </span>

                <span>
                  <span className="tag-check">✓</span>
                  Test visibility
                </span>
              </div>
            </div>

            <div className="welcome-visual">
              <div className="visual-glow" />
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />

              <div className="pipeline-visual">
                <div className="visual-icon">CI</div>

                <div className="visual-pipeline-line" />

                <div className="visual-stage">
                  <span className="visual-stage-icon">✓</span>
                  <span>BUILD</span>
                </div>

                <div className="visual-pipeline-line" />

                <div className="visual-stage">
                  <span className="visual-stage-icon">✓</span>
                  <span>TEST</span>
                </div>

                <div className="visual-pipeline-line" />

                <div className="visual-stage">
                  <span className="visual-stage-icon">↗</span>
                  <span>VERIFY</span>
                </div>
              </div>

              <div className="visual-caption">
                <span className="caption-dot" />
                Continuous integration workflow
              </div>
            </div>
          </section>

          {notice.message && (
            <div className={`notice notice-${notice.type}`}>
              <span>
                {notice.type === "success"
                  ? "✓"
                  : notice.type === "error"
                  ? "!"
                  : "i"}
              </span>

              <p>{notice.message}</p>

              <button
                onClick={() => setNotice({ type: "", message: "" })}
                type="button"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon stat-icon-blue">▤</div>
                <span className="stat-category">OVERVIEW</span>
              </div>

              <div className="stat-number">{stats.total}</div>
              <div className="stat-title">Total Build Records</div>

              <p className="stat-description">
                All records stored in the backend database
              </p>

              <div className="stat-bottom">
                <span className="stat-bottom-line line-blue" />
                <span>Live database count</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon stat-icon-orange">◷</div>
                <span className="stat-category">IN QUEUE</span>
              </div>

              <div className="stat-number">{stats.queued}</div>
              <div className="stat-title">Queued Records</div>

              <p className="stat-description">
                Records awaiting processing
              </p>

              <div className="stat-bottom">
                <span className="stat-bottom-line line-orange" />
                <span>Current status: QUEUED</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon stat-icon-green">✓</div>
                <span className="stat-category">COMPLETION</span>
              </div>

              <div className="stat-number">{stats.completed}</div>
              <div className="stat-title">Completed Records</div>

              <p className="stat-description">
                Records marked COMPLETED by the backend
              </p>

              <div className="stat-bottom">
                <span className="stat-bottom-line line-green" />
                <span>Based on stored status</span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <div className="stat-icon stat-icon-purple">⌘</div>
                <span className="stat-category">CONNECTIVITY</span>
              </div>

              <div className="stat-connection">
                <span className={`connection-pulse ${apiStatus}`} />
                {apiStatus === "online"
                  ? "Connected"
                  : apiStatus === "checking"
                  ? "Checking"
                  : "Offline"}
              </div>

              <div className="stat-title">Backend Status</div>

              <p className="stat-description">
                Spring Boot REST API
              </p>

              <div className="stat-bottom">
                <span
                  className={`stat-bottom-line ${
                    apiStatus === "online"
                      ? "line-green"
                      : "line-orange"
                  }`}
                />
                <span>Port 8400</span>
              </div>
            </article>
          </section>

          <section className="work-grid">
            <article className="panel create-panel" id="create-build">
              <div className="panel-heading">
                <div>
                  <div className="panel-eyebrow">PRODUCER CONSOLE</div>
                  <h2>Create a Build Record</h2>
                  <p>Register a new build record in the pipeline.</p>
                </div>

                <div className="panel-heading-icon">＋</div>
              </div>

              <form onSubmit={handleSubmit} className="build-form">
                <label htmlFor="commitMessage">
                  Commit message
                  <span>Required</span>
                </label>

                <textarea
                  id="commitMessage"
                  name="commitMessage"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  placeholder="e.g. Add automated unit tests..."
                  maxLength={200}
                  rows={4}
                  required
                />

                <div className="character-count">
                  <span>Describe the change being recorded.</span>
                  <span>{commitMessage.length}/200</span>
                </div>

                <div className="form-info">
                  <span className="form-info-icon">i</span>
                  <p>
                    New records are initially created with the
                    <strong> QUEUED </strong>
                    status. This form records a build; it does not
                    start an actual build job.
                  </p>
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting || apiStatus === "offline"}
                >
                  <span>{submitting ? "Submitting..." : "Create Build"}</span>
                  <span className="button-arrow">↗</span>
                </button>

                <div className="form-footer">
                  <span className="form-footer-dot" />
                  Connected to /api/builds
                </div>
              </form>
            </article>

            <article className="panel stages-panel" id="test-stages">
              <div className="panel-heading">
                <div>
                  <div className="panel-eyebrow">QUALITY ASSURANCE</div>
                  <h2>CI Test Stages</h2>
                  <p>Testing components configured in this experiment.</p>
                </div>

                <div className="panel-heading-icon test-icon">✓</div>
              </div>

              <div className="stage-list">
                <div className="stage-item">
                  <div className="stage-number">01</div>

                  <div className="stage-content">
                    <strong>Unit Testing</strong>
                    <span>JUnit 5 + Mockito</span>
                    <div className="stage-progress">
                      <span className="progress-blue" />
                    </div>
                  </div>

                  <span className="stage-state configured">
                    Configured
                  </span>
                </div>

                <div className="stage-item">
                  <div className="stage-number">02</div>

                  <div className="stage-content">
                    <strong>API Integration</strong>
                    <span>Spring MockMvc</span>
                    <div className="stage-progress">
                      <span className="progress-green" />
                    </div>
                  </div>

                  <span className="stage-state configured">
                    Configured
                  </span>
                </div>

                <div className="stage-item">
                  <div className="stage-number">03</div>

                  <div className="stage-content">
                    <strong>Contract Testing</strong>
                    <span>Pact consumer / provider</span>
                    <div className="stage-progress">
                      <span className="progress-purple" />
                    </div>
                  </div>

                  <span className="stage-state configured">
                    Configured
                  </span>
                </div>

                <div className="stage-item">
                  <div className="stage-number">04</div>

                  <div className="stage-content">
                    <strong>Database Testing</strong>
                    <span>PostgreSQL + Testcontainers</span>
                    <div className="stage-progress">
                      <span className="progress-orange" />
                    </div>
                  </div>

                  <span className="stage-state configured">
                    Configured
                  </span>
                </div>
              </div>

              <div className="stages-note">
                <span>✦</span>
                <p>
                  Run <code>.\mvnw.cmd clean verify</code> to build the
                  project and execute the automated test suite.
                </p>
              </div>
            </article>
          </section>

          <section className="panel history-panel" id="build-history">
            <div className="history-heading">
              <div>
                <div className="panel-eyebrow">DATABASE RECORDS</div>
                <h2>Build History</h2>
                <p>Search, filter and inspect build records from the API.</p>
              </div>

              <div className="history-total">
                <span className="history-total-dot" />
                {builds.length} RECORDS
              </div>
            </div>

            <div className="table-controls">
              <div className="table-search">
                <span>⌕</span>

                <input
                  type="text"
                  placeholder="Search by ID or commit message..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="table-filters">
                {["ALL", "QUEUED", "COMPLETED"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={filter === option ? "filter-active" : ""}
                    onClick={() => setFilter(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="build-table">
                <thead>
                  <tr>
                    <th>BUILD ID</th>
                    <th>COMMIT MESSAGE</th>
                    <th>STATUS</th>
                    <th>CREATED</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="table-empty">
                        Loading build records...
                      </td>
                    </tr>
                  ) : filteredBuilds.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty">
                        <div className="empty-icon">▤</div>
                        <strong>No build records found</strong>
                        <span>
                          Create a build record using the form above.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredBuilds.map((build) => (
                      <tr
                        key={build.id}
                        className={
                          String(selectedBuildId) === String(build.id)
                            ? "selected-row"
                            : ""
                        }
                      >
                        <td>
                          <span className="build-id">
                            #{build.id}
                          </span>
                        </td>

                        <td className="commit-cell">
                          {build.commitMessage}
                        </td>

                        <td>
                          <StatusBadge status={build.status} />
                        </td>

                        <td className="date-cell">
                          {formatDate(build.createdAt)}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="details-button"
                            onClick={() => setSelectedBuildId(build.id)}
                          >
                            Inspect <span>→</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing {filteredBuilds.length} of {builds.length} records
              </span>

              <button
                type="button"
                className="footer-refresh"
                onClick={() => loadBuilds(true)}
                disabled={refreshing}
              >
                ↻ {refreshing ? "Refreshing..." : "Refresh records"}
              </button>
            </div>
          </section>

          {selectedBuild && (
            <section className="panel selected-build-panel">
              <div className="selected-build-heading">
                <div>
                  <div className="panel-eyebrow">RECORD INSPECTOR</div>
                  <h2>Build #{selectedBuild.id}</h2>
                </div>

                <button
                  className="close-inspector"
                  type="button"
                  onClick={() => setSelectedBuildId(null)}
                  aria-label="Close build inspector"
                >
                  ×
                </button>
              </div>

              <div className="selected-build-details">
                <div>
                  <span>Commit message</span>
                  <strong>{selectedBuild.commitMessage}</strong>
                </div>

                <div>
                  <span>Current status</span>
                  <StatusBadge status={selectedBuild.status} />
                </div>

                <div>
                  <span>Created at</span>
                  <strong>{formatDate(selectedBuild.createdAt)}</strong>
                </div>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <div className="footer-brand">
              <span className="footer-logo">C</span>
              <div>
                <strong>CI Pipeline Lab</strong>
                <span>Experiment 9.1 · Continuous Integration</span>
              </div>
            </div>

            <div className="footer-author">
              <span>Developed by</span>
              <strong>{STUDENT_NAME}</strong>
              <span>UID: {STUDENT_UID}</span>
            </div>

            <div className="footer-local">
              <span className={`connection-pulse ${apiStatus}`} />
              Local environment
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;