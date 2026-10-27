
import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from "lucide-react";
import "./Auth.css";

export default function Auth({
  onAuthenticated,
  theme = "dark",
  onToggleTheme = () => {},
}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/${
          mode === "login" ? "login" : "register"
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            mode === "register"
              ? {
                  name: name.trim(),
                  email: email.trim(),
                  password,
                }
              : {
                  email: email.trim(),
                  password,
                }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Authentication failed."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "The server returned an incomplete response."
        );
      }

      onAuthenticated({
        token: data.token,
        user: data.user,
      });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to ExamPro. Make sure the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) =>
      current === "login" ? "register" : "login"
    );

    setError("");
    setPassword("");
    setShowPassword(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <a href="#auth" className="auth-brand">
          <span className="auth-brand-icon">
            <BrainCircuit
              size={27}
              strokeWidth={1.8}
            />
          </span>

          <span className="auth-brand-name">
            Exam<span>Pro</span>
          </span>
        </a>

        <div className="auth-visual">
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />
          <div className="auth-logo-glow" />

          <motion.div
            className="auth-animated-mark"
            animate={{
              y: [0, -7, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BrainCircuit
              className="auth-main-brain"
              size={82}
              strokeWidth={1.45}
            />
          </motion.div>

          <div className="auth-visual-caption">
            <span className="auth-caption-dot" />
            ONLINE EXAMINATION
            <span className="auth-caption-separator">
              ·
            </span>
            SMART ASSESSMENT
          </div>
        </div>

        <div className="auth-pitch">
          <div className="auth-kicker">
            <Sparkles size={14} />
            YOUR NEXT CHAPTER STARTS HERE
          </div>

          <h1>
            Knowledge is your
            <br />
            greatest
            <br />
            <span>superpower.</span>
          </h1>

          <p>
            Practice with purpose. Track your progress.
            Walk into every exam with confidence.
          </p>

          <div className="auth-feature">
            <span className="auth-feature-icon">
              <ShieldCheck size={19} />
            </span>

            <div>
              <strong>Your progress, protected</strong>
              <small>
                Secure accounts and individual results
              </small>
            </div>
          </div>
        </div>

        <div className="auth-student">
          <span>FULL STACK II · EXPERIMENT 10</span>
          <strong>Taseen Yasir Pritam</strong>
          <span>UID: 24BAI70036</span>
        </div>
      </section>

      <section className="auth-form-side" id="auth">
        <button
          className="auth-theme-toggle"
          type="button"
          onClick={onToggleTheme}
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

          <span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </button>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <a href="#auth" className="auth-mobile-brand">
            <span className="auth-mobile-icon">
              <BrainCircuit
                size={26}
                strokeWidth={1.8}
              />
            </span>

            <span className="auth-brand-name">
              Exam<span>Pro</span>
            </span>
          </a>

          <span className="auth-step-label">
            {mode === "login"
              ? "WELCOME BACK"
              : "JOIN EXAMPRO"}
          </span>

          <h2>
            {mode === "login"
              ? "Sign in to your space."
              : "Create your account."}
          </h2>

          <p className="auth-description">
            {mode === "login"
              ? "Pick up your learning journey right where you left off."
              : "Your next step toward smarter exam preparation starts here."}
          </p>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            {mode === "register" && (
              <label>
                Full name

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password

              <span className="auth-password-wrap">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  name="password"
                  placeholder={
                    mode === "register"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={
                    mode === "register" ? 8 : undefined
                  }
                  maxLength={72}
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-eye"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </span>
            </label>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? "New to ExamPro?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {mode === "login"
                ? "Create an account"
                : "Sign in instead"}
            </button>
          </div>

          <div className="auth-security">
            <ShieldCheck size={15} />
            Your password is securely hashed by the backend.
          </div>
        </motion.div>

        <footer className="auth-footer">
          © 2026 ExamPro · Online Examination System
        </footer>
      </section>
    </main>
  );
}
