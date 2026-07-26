import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const {
    login,
    register,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [mode, setMode] =
    useState("login");

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "visitor",
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );

    setError("");
  };

  const validateForm = () => {
    if (
      mode === "register" &&
      !form.name.trim()
    ) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email.";
    }

    if (!form.password) {
      return "Please enter your password.";
    }

    if (
      mode === "register" &&
      form.password.length < 6
    ) {
      return "Password must contain at least 6 characters.";
    }

    return "";
  };

  const getDestination = (
    authenticatedUser
  ) => {
    const stateDestination =
      location.state?.from;

    if (
      typeof stateDestination ===
        "string" &&
      stateDestination.startsWith("/")
    ) {
      return stateDestination;
    }

    const storedDestination =
      sessionStorage.getItem(
        "artvault_return_path"
      );

    if (
      storedDestination &&
      storedDestination.startsWith("/")
    ) {
      sessionStorage.removeItem(
        "artvault_return_path"
      );

      return storedDestination;
    }

    const role =
      String(
        authenticatedUser?.role ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      role === "artist" ||
      role === "curator" ||
      role === "admin"
    ) {
      return "/dashboard";
    }

    return "/";
  };

  const submit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    try {
      setLoading(true);

      let result;

      if (mode === "login") {
        result = await login(
          form.email.trim(),
          form.password
        );
      } else {
        result =
          await register({
            name:
              form.name.trim(),
            email:
              form.email.trim(),
            password:
              form.password,
            role:
              form.role,
          });
      }

      console.log(
        "Authentication successful:",
        result
      );

      /*
        AuthContext is responsible for
        storing access_token and user.
      */
      const token =
        result?.token ||
        result?.access_token ||
        result?.data
          ?.access_token ||
        localStorage.getItem(
          "access_token"
        );

      const authenticatedUser =
        result?.user ||
        result?.account ||
        result?.data?.user ||
        (() => {
          try {
            const storedUser =
              localStorage.getItem(
                "user"
              );

            return storedUser
              ? JSON.parse(
                  storedUser
                )
              : null;
          } catch {
            return null;
          }
        })();

      if (!token) {
        throw new Error(
          "Authentication succeeded, but no token was saved."
        );
      }

      if (
        !authenticatedUser
      ) {
        throw new Error(
          "Authentication succeeded, but user information was not saved."
        );
      }

      const destination =
        getDestination(
          authenticatedUser
        );

      navigate(
        destination,
        {
          replace: true,
        }
      );
    } catch (requestError) {
      console.error(
        "Authentication error:",
        requestError
      );

      setError(
        requestError.message ||
          "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(
      (currentMode) =>
        currentMode ===
        "login"
          ? "register"
          : "login"
    );

    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
      role: "visitor",
    });
  };

  return (
    <section className="auth">
      <form onSubmit={submit}>
        <p className="eyebrow">
          WELCOME TO ARTVAULT
        </p>

        <h1>
          {mode === "login"
            ? "Sign in"
            : "Create your account"}
        </h1>

        {mode ===
          "register" && (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={
                handleChange
              }
              disabled={loading}
              autoComplete="name"
              required
            />

            <select
              name="role"
              value={form.role}
              onChange={
                handleChange
              }
              disabled={loading}
            >
              <option value="visitor">
                Collector /
                Visitor
              </option>

              <option value="artist">
                Artist
              </option>

              <option value="curator">
                Curator
              </option>
            </select>
          </>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={
            handleChange
          }
          disabled={loading}
          autoComplete="email"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={
            handleChange
          }
          disabled={loading}
          autoComplete={
            mode === "login"
              ? "current-password"
              : "new-password"
          }
          required
        />

        {error && (
          <p
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          className="btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? mode ===
              "login"
              ? "Signing in..."
              : "Creating account..."
            : mode ===
                "login"
              ? "Sign in"
              : "Register"}
        </button>

        <button
          type="button"
          className="switch"
          onClick={switchMode}
          disabled={loading}
        >
          {mode === "login"
            ? "New here? Create account"
            : "Already registered? Sign in"}
        </button>
      </form>
    </section>
  );
}