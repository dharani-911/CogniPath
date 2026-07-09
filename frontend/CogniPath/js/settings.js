document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-settings-form]");
  if (!form) return;
  const settings = RS.read(RS.LS.settings, { theme: "Dark", language: "English", email: true, product: true, privacy: "Standard" });
  form.theme.value = settings.theme;
  form.language.value = settings.language;
  form.email.checked = settings.email;
  form.product.checked = settings.product;
  form.privacy.value = settings.privacy;
  form.addEventListener("submit", e => {
    e.preventDefault();
    RS.write(RS.LS.settings, { theme: form.theme.value, language: form.language.value, email: form.email.checked, product: form.product.checked, privacy: form.privacy.value });
    RS.toast("Settings saved.");
  });
});
