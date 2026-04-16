export const MOCK_TRANSCRIPT =
  "HTML is the structure of web pages. Forms collect user input using input elements. Validation helps ensure correctness.";

export const MOCK_CONCEPT_MAP = {
  nodes: [
    { id: "1", label: "HTML Structure", description: "Basic document structure" },
    { id: "2", label: "Forms", description: "Collecting user input" },
    { id: "3", label: "Input Types", description: "text, email, password, etc" },
    { id: "4", label: "Validation", description: "required, minlength, pattern" },
  ],
  edges: [
    { source: "1", target: "2", label: "contains" },
    { source: "2", target: "3", label: "uses" },
    { source: "3", target: "4", label: "enables" },
  ],
};

export const MOCK_ASSIGNMENT = {
  title: "Build a User Registration Form",
  description: "Create a complete HTML registration form with basic validation and styling.",
  requirements: [
    "Form has name, email, password, and confirm password fields",
    "All fields include proper validation attributes",
    "Form has a submit button with hover state",
    "Basic CSS styling is applied",
  ],
  hint: "Start with semantic form markup and labels first.",
  topic: "HTML Forms",
};

export const MOCK_ASSESSMENT = {
  score: 87,
  passed: true,
  checklist: [
    { requirement: "Form has name, email, password, and confirm password fields", met: true, comment: "All required fields are present." },
    { requirement: "All fields include proper validation attributes", met: true, comment: "Validation attributes are used correctly." },
    { requirement: "Form has a submit button with hover state", met: true, comment: "Submit button includes visible hover feedback." },
    { requirement: "Basic CSS styling is applied", met: false, comment: "Styling exists but is minimal." },
  ],
  strengths: ["Clear semantic structure", "Good validation basics"],
  gaps: ["Limited feedback messages", "Weak visual hierarchy"],
  nextTopic: "JavaScript Form Validation",
  overallFeedback: "Strong start with the right structure and validation. Improve UX feedback and polish to pass confidently.",
};
