// theme.js
// Job: switch between light and dark mode.
// The look itself lives in style.css. This file only sets data-theme="light" or
// data-theme="dark" on the <html> element, and the CSS does the rest.
//
// This file is loaded in the <head>, so the theme is applied BEFORE the page is drawn.
// If it were loaded at the bottom, you'd see a flash of the wrong theme on every refresh.

// localStorage keeps a small piece of text in your browser, even after you close the tab.
// It's wrapped in try/catch because some browser settings block it.
function getSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch (error) {
    // Not being able to save is fine; the toggle still works for this visit.
  }
}

// Sets the theme and updates the button text (the button shows the mode you'd switch TO).
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const button = document.getElementById("theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }
}

// Pick the starting theme: your saved choice if there is one, otherwise whatever your
// operating system is set to (matchMedia asks the browser about that setting).
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(getSavedTheme() || (systemPrefersDark ? "dark" : "light"));

// The button doesn't exist yet while we're in the <head>, so wait until the page's
// HTML has been read, then sync the button text and hook up the click.
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("theme-toggle");

  applyTheme(document.documentElement.dataset.theme);

  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  });
});