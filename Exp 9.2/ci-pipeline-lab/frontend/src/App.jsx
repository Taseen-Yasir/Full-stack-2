import { useState } from "react";
import "./App.css";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

const initialActivity = [
  {
    title: "Canary release prepared",
    detail: "Candidate v1.4.1 · 10% traffic",
    status: "CANARY",
  },
  {
    title: "Container image ready",
    detail: "releasepilot:1.4.1",
    status: "READY",
  },
  {
    title: "Stable release retained",
    detail: "Production version v1.4.0",
    status: "STABLE",
  },
];

function Badge({ status }) {
  const className = status.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`badge badge-${className}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

function App() {
  const [imageBuilt, setImageBuilt] = useState(true);
  const [rollout, setRollout] = useState({
    stableVersion: "v1.4.0",
    candidateVersion: "v1.4.1",
    traffic: 10,
    status: "CANARY",
  });
  const [activity, setActivity] = useState(initialActivity);
  const [message, setMessage] = useState(
    "Demo snapshot: release v1.4.1 is receiving 10% of traffic."
  );

  function addActivity(title, detail, status) {
    setActivity((previous) =>
      [{ title, detail, status }, ...previous].slice(0, 5)
    );
  }

  function buildImage() {
    setImageBuilt(true);
    setMessage(
      "Simulation only: the Docker image stage is marked complete. No Docker image was actually built."
    );

    addActivity(
      "Image build stage completed",
      "releasepilot:1.4.1 · simulated action",
      "READY"
    );
  }

  function startCanary() {
    if (!imageBuilt) {
      setMessage("Prepare the image stage before starting the canary demo.");
      return;
    }

    setRollout((previous) => ({
      ...previous,
      traffic: 10,
      status: "CANARY",
    }));

    setMessage(
      "Simulation only: the candidate release is set to receive 10% of traffic."
    );

    addActivity(
      "Canary rollout started",
      "v1.4.1 · 10% traffic · simulated action",
      "CANARY"
    );
  }

  function changeTraffic(value) {
    setRollout((previous) => ({
      ...previous,
      traffic: Number(value),
      status: "CANARY",
    }));

    setMessage(
      `Simulation only: canary traffic preview adjusted to ${value}%.`
    );
  }

  function promoteRelease() {
    setRollout((previous) => ({
      ...previous,
      stableVersion: previous.candidateVersion,
      traffic: 100,
      status: "STABLE",
    }));

    setMessage(
      "Simulation only: candidate v1.4.1 is now marked as the stable release at 100% traffic."
    );

    addActivity(
      "Release promoted",
      "v1.4.1 · 100% traffic · simulated action",
      "STABLE"
    );
  }

  function rollbackRelease() {
    setRollout((previous) => ({
      ...previous,
      traffic: 0,
      status: "ROLLED BACK",
      candidateVersion: "v1.4.1",
    }));

    setMessage(
      "Simulation only: the canary has been rolled back. The stable release remains v1.4.0."
    );

    addActivity(
      "Canary rollback simulated",
      "Traffic removed from candidate v1.4.1",
      "ROLLED BACK"
    );
  }

  const canaryTraffic =
    rollout.status === "CANARY" ? rollout.traffic : 0;

  const stableTraffic =
    rollout.status === "CANARY" ? 100 - rollout.traffic : 100;

  const currentVersion =
    rollout.status === "STABLE"
      ? rollout.stableVersion
      : "v1.4.0";

  return (
    <div className="release-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <strong>ReleasePilot</strong>
            <span>DEPLOYMENT CONTROL</span>
          </div>
        </div>

        <div className="sidebar-label">RELEASE WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-link active" href="#overview">
            <span>▦</span> Deployment Overview
          </a>
          <a className="nav-link" href="#pipeline">
            <span>⇢</span> Release Pipeline
          </a>
          <a className="nav-link" href="#canary">
            <span>◉</span> Canary Strategy
          </a>
          <a className="nav-link" href="#history">
            <span>☷</span> Release History
          </a>
        </nav>

        <div className="sidebar-label">ENVIRONMENT</div>

        <div className="environment">
          <span className="environment-dot" />
          <div>
            <strong>Local Demo</strong>
            <span>Deployment simulation</span>
          </div>
          <span className="environment-state">READY</span>
        </div>

        <div className="sidebar-spacer" />

        <div className="student-card">
          <div className="student-heading">PROJECT OWNER</div>
          <div className="student-profile">
            <div className="student-avatar">TP</div>
            <div>
              <strong>{STUDENT_NAME}</strong>
              <span>UID: {STUDENT_UID}</span>
            </div>
          </div>
          <div className="student-divider" />
          <div className="experiment-line">
            <span>Experiment</span>
            <strong>9.2</strong>
          </div>
          <p>Continuous Deployment &amp; Release Strategies</p>
        </div>

        <div className="sidebar-footer">
          <span className="online-dot" />
          Frontend preview mode
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Experiments</span>
            <span>/</span>
            <strong>9.2 · Release Strategies</strong>
          </div>

          <div className="topbar-actions">
            <span className="demo-pill">
              <span /> LOCAL DEMO
            </span>
            <button className="print-button" onClick={() => window.print()}>
              ▣ Print Dashboard
            </button>
          </div>
        </header>

        <div className="page-content" id="overview">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                CONTINUOUS DELIVERY · RELEASE ENGINEERING
              </div>

              <h1>
                Ship smarter.
                <span> Roll out safer.</span>
              </h1>

              <p>
                Prepare container images, coordinate deployment stages,
                and gradually release new versions with a canary strategy.
              </p>

              <div className="hero-tags">
                <span>✓ Docker-ready workflow</span>
                <span>✓ Staged deployment</span>
                <span>✓ Controlled rollout</span>
              </div>
            </div>

            <div className="hero-art">
              <div className="art-ring ring-one" />
              <div className="art-ring ring-two" />

              <div className="art-flow">
                <div className="art-main">CD</div>
                <span className="art-line" />
                <div className="art-node">
                  <b>▣</b>
                  <small>IMAGE</small>
                </div>
                <span className="art-line" />
                <div className="art-node">
                  <b>◉</b>
                  <small>CANARY</small>
                </div>
                <span className="art-line" />
                <div className="art-node">
                  <b>✓</b>
                  <small>RELEASE</small>
                </div>
              </div>

              <div className="art-caption">
                <span /> Containerize · Deploy · Monitor
              </div>
            </div>
          </section>

          <div className="demo-notice">
            <span className="notice-icon">i</span>
            <p>
              <strong>Demo mode:</strong> {message}
            </p>
          </div>

          <section className="metrics">
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon icon-blue">⇧</span>
                <span className="metric-label">STABLE RELEASE</span>
              </div>
              <div className="metric-value">{currentVersion}</div>
              <div className="metric-title">Current stable version</div>
              <div className="metric-foot">
                <span className="foot-line blue-line" />
                <span>Production baseline</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon icon-purple">◉</span>
                <span className="metric-label">CANARY TRAFFIC</span>
              </div>
              <div className="metric-value">{canaryTraffic}%</div>
              <div className="metric-title">Traffic to candidate release</div>
              <div className="metric-foot">
                <span className="foot-line purple-line" />
                <span>Gradual traffic allocation</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon icon-green">▣</span>
                <span className="metric-label">IMAGE STAGE</span>
              </div>
              <div className="metric-value">
                {imageBuilt ? "Ready" : "Pending"}
              </div>
              <div className="metric-title">Container image preparation</div>
              <div className="metric-foot">
                <span className="foot-line green-line" />
                <span>Docker step preview</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon icon-orange">⇄</span>
                <span className="metric-label">DEPLOYMENT STATE</span>
              </div>
              <div className="metric-value metric-state">
                {rollout.status}
              </div>
              <div className="metric-title">Current release preview</div>
              <div className="metric-foot">
                <span className="foot-line orange-line" />
                <span>Local simulated state</span>
              </div>
            </article>
          </section>

          <section className="content-grid" id="pipeline">
            <article className="panel pipeline-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-eyebrow">AUTOMATION WORKFLOW</div>
                  <h2>Deployment Pipeline</h2>
                  <p>From source code to staged release.</p>
                </div>
                <span className="heading-icon">⇢</span>
              </div>

              <div className="pipeline-list">
                <div className="pipeline-stage">
                  <div className="stage-icon stage-source">⌘</div>
                  <div className="stage-copy">
                    <strong>Source &amp; Version</strong>
                    <span>Application source and release tag</span>
                  </div>
                  <Badge status="READY" />
                </div>

                <div className="stage-connector" />

                <div className="pipeline-stage">
                  <div className="stage-icon stage-image">▣</div>
                  <div className="stage-copy">
                    <strong>Build Docker Image</strong>
                    <span>Package application with dependencies</span>
                  </div>
                  <Badge status={imageBuilt ? "READY" : "PENDING"} />
                </div>

                <div className="stage-connector" />

                <div className="pipeline-stage">
                  <div className="stage-icon stage-verify">✓</div>
                  <div className="stage-copy">
                    <strong>Verify &amp; Test</strong>
                    <span>Run configured checks before release</span>
                  </div>
                  <Badge status="CONFIGURED" />
                </div>

                <div className="stage-connector" />

                <div className="pipeline-stage">
                  <div className="stage-icon stage-canary">◉</div>
                  <div className="stage-copy">
                    <strong>Deploy Canary</strong>
                    <span>Expose a small share of production traffic</span>
                  </div>
                  <Badge status={rollout.status} />
                </div>

                <div className="stage-connector" />

                <div className="pipeline-stage">
                  <div className="stage-icon stage-release">↗</div>
                  <div className="stage-copy">
                    <strong>Monitor &amp; Promote</strong>
                    <span>Evaluate the release before full rollout</span>
                  </div>
                  <Badge status={rollout.status === "STABLE" ? "READY" : "PENDING"} />
                </div>
              </div>

              <div className="pipeline-footnote">
                <span>ⓘ</span>
                Pipeline stages are presented for demonstration; the
                buttons below update only the frontend preview.
              </div>
            </article>

            <article className="panel canary-panel" id="canary">
              <div className="panel-heading">
                <div>
                  <div className="panel-eyebrow">PROGRESSIVE DELIVERY</div>
                  <h2>Canary Release Control</h2>
                  <p>Preview gradual traffic shifting and promotion.</p>
                </div>
                <span className="heading-icon purple-heading">◉</span>
              </div>

              <div className="release-comparison">
                <div className="release-box stable-box">
                  <div className="release-box-top">
                    <span className="release-symbol">✓</span>
                    <Badge status="STABLE" />
                  </div>
                  <span className="release-label">STABLE VERSION</span>
                  <strong>{rollout.stableVersion}</strong>
                  <small>Existing production release</small>
                </div>

                <div className="release-box candidate-box">
                  <div className="release-box-top">
                    <span className="release-symbol candidate-symbol">↗</span>
                    <Badge status={rollout.status} />
                  </div>
                  <span className="release-label">CANDIDATE VERSION</span>
                  <strong>{rollout.candidateVersion}</strong>
                  <small>New release preview</small>
                </div>
              </div>

              <div className="traffic-heading">
                <span>Traffic allocation</span>
                <strong>{canaryTraffic}% Canary</strong>
              </div>

              <div className="traffic-bar">
                <div
                  className="traffic-stable"
                  style={{ width: `${stableTraffic}%` }}
                />
                <div
                  className="traffic-canary"
                  style={{ width: `${canaryTraffic}%` }}
                />
              </div>

              <div className="traffic-legend">
                <span><i className="legend-stable" /> Stable {stableTraffic}%</span>
                <span><i className="legend-canary" /> Canary {canaryTraffic}%</span>
              </div>

              <label className="traffic-slider-label" htmlFor="traffic">
                Preview canary traffic
                <strong>{canaryTraffic}%</strong>
              </label>

              <input
                id="traffic"
                className="traffic-slider"
                type="range"
                min="0"
                max="50"
                step="10"
                value={canaryTraffic}
                disabled={rollout.status !== "CANARY"}
                onChange={(event) => changeTraffic(event.target.value)}
              />

              <div className="slider-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>

              <div className="release-actions">
                <button type="button" className="button-secondary" onClick={buildImage}>
                  ▣ Build Image
                </button>
                <button type="button" className="button-secondary" onClick={startCanary}>
                  ◉ Start Canary
                </button>
                <button type="button" className="button-primary" onClick={promoteRelease}>
                  ✓ Promote Release
                </button>
                <button type="button" className="button-danger" onClick={rollbackRelease}>
                  ↶ Rollback
                </button>
              </div>

              <div className="canary-note">
                <span>!</span>
                <p>
                  A real canary rollout requires an actual deployment system,
                  traffic routing, health checks and monitoring. These controls
                  are local UI simulations.
                </p>
              </div>
            </article>
          </section>

          <section className="panel history-panel" id="history">
            <div className="panel-heading history-heading">
              <div>
                <div className="panel-eyebrow">RELEASE OBSERVABILITY</div>
                <h2>Release Activity</h2>
                <p>Recent actions in this dashboard preview.</p>
              </div>
              <span className="sample-label">DEMO ACTIVITY</span>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>ACTIVITY</th>
                    <th>DETAILS</th>
                    <th>STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((item, index) => (
                    <tr key={`${item.title}-${index}`}>
                      <td>
                        <span className="activity-bullet" />
                        <strong>{item.title}</strong>
                      </td>
                      <td>{item.detail}</td>
                      <td><Badge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="main-footer">
            <div className="footer-brand">
              <span className="footer-logo">R</span>
              <div>
                <strong>ReleasePilot · Experiment 9.2</strong>
                <span>Continuous Deployment &amp; Release Strategies</span>
              </div>
            </div>

            <div className="footer-owner">
              <strong>{STUDENT_NAME}</strong>
              <span>UID: {STUDENT_UID}</span>
            </div>

            <div className="footer-state">
              <span /> LOCAL PREVIEW
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;