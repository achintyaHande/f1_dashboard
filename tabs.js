// tabs.js
// Job: show one panel at a time and highlight the matching tab button.
// It doesn't fetch anything. The other scripts load their data in the background
// at page load, so switching tabs is instant.

// Every tab button, and every panel (a querySelectorAll result is a list we can loop over).
const tabButtons = document.querySelectorAll('[role="tab"]');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');

// name is one of: "next", "results", "drivers", "constructors"
function showTab(name) {
  // Mark exactly one button as selected. The CSS styles the selected one.
  tabButtons.forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.tab === name);
  });

  // Show the panel whose id is "panel-" + name, hide every other panel.
  // The "hidden" property is the same thing as the hidden attribute in the HTML.
  tabPanels.forEach((panel) => {
    panel.hidden = panel.id !== "panel-" + name;
  });
}

// When a button is clicked, show the tab named in its data-tab attribute.
tabButtons.forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});