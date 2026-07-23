const API_BASE = "http://127.0.0.1:8000";

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.detail || result.error || "Request failed");
  }
  return result;
}

function saveAuthenticatedUser(user, password) {
  const normalized = {
    ...user,
    password,
    createdAt: user.createdAt || new Date().toISOString(),
    status: user.status || "Active"
  };
  const users = RS.getUsers().filter(existing => existing.email !== normalized.email);
  RS.setUsers([normalized, ...users]);
  RS.setSession({ email: normalized.email });
}

function passwordScore(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

function bindPasswordMeter() {
  const input = document.querySelector("[data-password]");
  const meter = document.querySelector(".password-meter");
  if (!input || !meter) return;
  input.addEventListener("input", () => meter.dataset.score = String(passwordScore(input.value)));
}

function bindLoginControls() {
  const toggle = document.querySelector("[data-toggle-password]");
  const password = document.querySelector("#login-password");
  if (toggle && password) {
    toggle.addEventListener("click", () => {
      const isHidden = password.type === "password";
      password.type = isHidden ? "text" : "password";
      toggle.textContent = isHidden ? "Hide" : "Show";
      toggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  }

  document.querySelector("[data-google-login]")?.addEventListener("click", () => {
    RS.toast("Google sign-in is ready for backend integration.");
  });
}

async function registerSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const error = form.querySelector(".error");

    error.textContent = "";

    if (!data.name || !data.email || !data.password || !data.question || !data.answer) {
        error.textContent = "Please fill all required fields.";
        return;
    }

    try {
        const result = await postJson("/api/auth/register", {
            name: data.name,
            email: data.email,
            password: data.password,
            question: data.question,
            answer: data.answer,
            remember: data.remember === "on"
        });

        saveAuthenticatedUser(result.user, data.password);
        alert("Registration Successful!");
        window.location.href = data.remember === "on" ? "dashboard.html" : "login.html";

    } catch (err) {
        error.textContent = err.message || "Cannot connect to backend.";
    }
}

async function loginSubmit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const error = form.querySelector(".error");

    error.textContent = "";

    try {

        const result = await postJson("/api/auth/login", {
            email: data.email,
            password: data.password
        });

        saveAuthenticatedUser(result.user, data.password);
        alert("Login Successful!");
        window.location.href = "dashboard.html";

    } catch (err) {

        error.textContent = err.message || "Cannot connect to backend.";

    }
}

async function forgotSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const error = form.querySelector(".error");
  error.textContent = "";
  if (passwordScore(data.password) < 3) return error.textContent = "Choose a stronger new password.";
  try {
    await postJson("/api/auth/forgot-password", {
      email: data.email,
      answer: data.answer,
      password: data.password
    });
    RS.setUsers(RS.getUsers().map(u => u.email === String(data.email).toLowerCase() ? { ...u, password: data.password } : u));
    RS.toast("Password reset. You can sign in now.");
    setTimeout(() => location.href = "login.html", 700);
  } catch (err) {
    error.textContent = err.message || "Password reset failed.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindPasswordMeter();
  bindLoginControls();
  document.querySelector("[data-register-form]")?.addEventListener("submit", registerSubmit);
  document.querySelector("[data-login-form]")?.addEventListener("submit", loginSubmit);
  document.querySelector("[data-forgot-form]")?.addEventListener("submit", forgotSubmit);
});
