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

function registerSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const error = form.querySelector(".error");
  if (!data.name || !data.email || !data.password || !data.question || !data.answer) return error.textContent = "Please complete every required field.";
  if (passwordScore(data.password) < 3) return error.textContent = "Use 8+ characters with mixed case, number, and symbol.";
  const users = RS.getUsers();
  if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) return error.textContent = "An account already exists for this email.";
  const user = {
    id: RS.uid(),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    question: data.question,
    answer: data.answer.trim().toLowerCase(),
    status: "Active",
    createdAt: new Date().toISOString()
  };
  RS.setUsers([...users, user]);
  RS.setSession({ email: user.email, remember: Boolean(data.remember), loginAt: Date.now() });
  RS.write(RS.LS.profile + ":" + user.email, { phone: "", location: "Bengaluru", bio: "Career intelligence user building a personalized growth path with CogniPath." });
  RS.toast("Account created. Welcome to CogniPath.");
  setTimeout(() => location.href = "dashboard.html", 550);
}

function loginSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const error = form.querySelector(".error");
  const user = RS.getUsers().find(u => u.email === String(data.email).toLowerCase());
  if (!user || user.password !== data.password) return error.textContent = "Invalid email or password.";
  RS.setSession({ email: user.email, remember: Boolean(data.remember), loginAt: Date.now() });
  RS.toast("Signed in.");
  setTimeout(() => location.href = "dashboard.html", 450);
}

function forgotSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const error = form.querySelector(".error");
  const user = RS.getUsers().find(u => u.email === String(data.email).toLowerCase());
  if (!user) return error.textContent = "No account found for this email.";
  if (user.answer !== String(data.answer).trim().toLowerCase()) return error.textContent = "Security answer does not match.";
  if (passwordScore(data.password) < 3) return error.textContent = "Choose a stronger new password.";
  user.password = data.password;
  RS.setUsers(RS.getUsers().map(u => u.email === user.email ? user : u));
  RS.toast("Password reset. You can sign in now.");
  setTimeout(() => location.href = "login.html", 700);
}

document.addEventListener("DOMContentLoaded", () => {
  bindPasswordMeter();
  bindLoginControls();
  document.querySelector("[data-register-form]")?.addEventListener("submit", registerSubmit);
  document.querySelector("[data-login-form]")?.addEventListener("submit", loginSubmit);
  document.querySelector("[data-forgot-form]")?.addEventListener("submit", forgotSubmit);
});
