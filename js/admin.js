function renderAdmin() {
  const users = RS.getUsers();
  const reports = RS.read(RS.LS.reports, []);
  const s = RS.summarize();
  document.querySelector("[data-admin-stats]").innerHTML = `
    <div class="metric"><b>${users.length}</b><span>Users</span></div>
    <div class="metric"><b>${s.total}</b><span>Career Inputs</span></div>
    <div class="metric"><b>${reports.length}</b><span>Reports</span></div>`;
  document.querySelector("[data-users-body]").innerHTML = users.map(u => `
    <tr><td>${u.name}</td><td>${u.email}</td><td>${new Date(u.createdAt).toLocaleDateString()}</td><td><span class="badge positive">${u.status || "Active"}</span></td><td><button class="btn small danger" data-delete-user="${u.email}">Delete</button></td></tr>
  `).join("");
  document.querySelectorAll("[data-delete-user]").forEach(btn => btn.addEventListener("click", () => {
    if (btn.dataset.deleteUser === RS.currentUser().email) return RS.toast("You cannot delete the signed-in user.");
    RS.setUsers(RS.getUsers().filter(u => u.email !== btn.dataset.deleteUser));
    RS.toast("User deleted.");
    renderAdmin();
  }));
}
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("[data-admin]")) renderAdmin();
});
