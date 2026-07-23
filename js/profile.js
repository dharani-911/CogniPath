document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-profile-form]");
  if (!form) return;
  const user = RS.currentUser();
  const profileKey = RS.LS.profile + ":" + user.email;
  const profile = RS.read(profileKey, {});
  form.name.value = user.name;
  form.email.value = user.email;
  form.phone.value = profile.phone || "";
  form.location.value = profile.location || "";
  form.bio.value = profile.bio || "";
  const completed = ["name","email","phone","location","bio"].filter(k => form[k].value).length;
  document.querySelector("[data-completion]").style.width = Math.round(completed / 5 * 100) + "%";
  document.querySelector("[data-completion-text]").textContent = Math.round(completed / 5 * 100) + "% complete";
  form.addEventListener("submit", e => {
    e.preventDefault();
    const users = RS.getUsers().map(u => u.email === user.email ? { ...u, name: form.name.value } : u);
    RS.setUsers(users);
    RS.write(profileKey, { phone: form.phone.value, location: form.location.value, bio: form.bio.value });
    RS.toast("Profile updated.");
  });
  document.querySelector("[data-change-password]").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (user.password !== f.current.value) return RS.toast("Current password is incorrect.");
    if (f.next.value.length < 8) return RS.toast("New password must be at least 8 characters.");
    RS.setUsers(RS.getUsers().map(u => u.email === user.email ? { ...u, password: f.next.value } : u));
    f.reset();
    RS.toast("Password changed.");
  });
});
