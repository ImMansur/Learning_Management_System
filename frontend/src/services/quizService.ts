/**
 * Module Quiz Service
 * Manages quiz questions per module and tracks pass/fail status in localStorage.
 */

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 0-based
}

export interface ModuleQuizData {
  moduleId: string;
  questions: QuizQuestion[];
}

const QUIZ_PASS_KEY = "ltc_quiz_passed";

/* ── default questions per static module ─────────────────────────── */

const defaultQuizBank: Record<string, QuizQuestion[]> = {
  // AI & ML → Introduction to AI (m1)
  "ai-ml-fundamentals__m1": [
    { id: 1, question: "What year was the term 'Artificial Intelligence' first coined?", options: ["1943", "1956", "1965", "1997"], correctIndex: 1 },
    { id: 2, question: "Which type of AI is designed for a specific task?", options: ["General AI", "Super AI", "Narrow AI", "Broad AI"], correctIndex: 2 },
    { id: 3, question: "Machine Learning is a subset of:", options: ["Data Science", "Artificial Intelligence", "Robotics", "Statistics"], correctIndex: 1 },
    { id: 4, question: "Which technique uses multi-layer neural networks?", options: ["Regression", "Clustering", "Deep Learning", "Bayesian inference"], correctIndex: 2 },
    { id: 5, question: "Which is NOT an application of AI mentioned in the course?", options: ["Healthcare diagnosis", "Autonomous vehicles", "Weather control", "Fraud detection"], correctIndex: 2 },
  ],
  // AI & ML → Deep Learning (m2)
  "ai-ml-fundamentals__m2": [
    { id: 1, question: "What does CNN stand for?", options: ["Central Neural Network", "Convolutional Neural Network", "Connected Node Network", "Cascading Neural Network"], correctIndex: 1 },
    { id: 2, question: "Which activation function outputs values between 0 and 1?", options: ["ReLU", "tanh", "sigmoid", "Leaky ReLU"], correctIndex: 2 },
    { id: 3, question: "Backpropagation is used to:", options: ["Generate data", "Adjust weights", "Split data", "Visualise layers"], correctIndex: 1 },
    { id: 4, question: "A neural network with many hidden layers is called:", options: ["Wide network", "Shallow network", "Deep network", "Flat network"], correctIndex: 2 },
    { id: 5, question: "Neural networks are inspired by:", options: ["Computer circuits", "Biological brains", "Quantum physics", "Database tables"], correctIndex: 1 },
  ],
  // AI & ML → Transformers & LLMs (m3)
  "ai-ml-fundamentals__m3": [
    { id: 1, question: "The landmark Transformer paper is titled:", options: ["Deep Learning Revisited", "Attention Is All You Need", "Neural Nets Today", "Learning to Predict"], correctIndex: 1 },
    { id: 2, question: "LLM stands for:", options: ["Long Learning Model", "Large Language Model", "Linear Logic Module", "Layered Learning Machine"], correctIndex: 1 },
    { id: 3, question: "Transformers heavily rely on which mechanism?", options: ["Backprop", "Attention", "Pooling", "Convolution"], correctIndex: 1 },
    { id: 4, question: "Which is an example of working with LLM APIs?", options: ["Training a CNN", "Building a chatbot with GPT", "SQL queries", "Image segmentation"], correctIndex: 1 },
    { id: 5, question: "Transformers were introduced in which year?", options: ["2012", "2015", "2017", "2020"], correctIndex: 2 },
  ],
  // Data Engineering → Data Foundations (m1)
  "data-engineering__m1": [
    { id: 1, question: "ETL stands for:", options: ["Extract, Transform, Load", "Enter, Test, Launch", "Encode, Transfer, Log", "Export, Train, Learn"], correctIndex: 0 },
    { id: 2, question: "Which is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"], correctIndex: 2 },
    { id: 3, question: "SQL is used for:", options: ["Styling web pages", "Querying relational databases", "Training AI models", "Creating APIs"], correctIndex: 1 },
    { id: 4, question: "Data architecture focuses on:", options: ["UI design", "Structuring data systems", "Marketing", "Network security"], correctIndex: 1 },
    { id: 5, question: "Which is a benefit of data pipelines?", options: ["Manual processing", "Automated data flow", "Higher latency", "Data loss"], correctIndex: 1 },
  ],
  // Cloud Computing → Cloud Fundamentals (m1)
  "cloud-computing__m1": [
    { id: 1, question: "IaaS stands for:", options: ["Internet as a Service", "Infrastructure as a Service", "Integration as a Software", "Input as a System"], correctIndex: 1 },
    { id: 2, question: "Which is a PaaS example?", options: ["AWS EC2", "Heroku", "Dropbox", "Gmail"], correctIndex: 1 },
    { id: 3, question: "SaaS is used directly by:", options: ["Developers only", "System admins", "End users", "Network engineers"], correctIndex: 2 },
    { id: 4, question: "Cloud computing provides:", options: ["On-demand resources", "Only local storage", "Hardware delivery", "Physical servers"], correctIndex: 0 },
    { id: 5, question: "Which is a cloud provider?", options: ["Adobe Photoshop", "Microsoft Azure", "Slack", "Zoom"], correctIndex: 1 },
  ],
  // DevOps → DevOps Culture (m1)
  "devops-practices__m1": [
    { id: 1, question: "CI/CD stands for:", options: ["Code Integration / Code Delivery", "Continuous Integration / Continuous Deployment", "Central Info / Central Data", "Cloud Instance / Cloud Deploy"], correctIndex: 1 },
    { id: 2, question: "DevOps bridges which two teams?", options: ["Sales and Marketing", "Development and Operations", "HR and Finance", "Design and QA"], correctIndex: 1 },
    { id: 3, question: "Infrastructure as Code means:", options: ["Writing code on servers", "Managing infrastructure through code/config files", "Coding without a computer", "Using code as documentation"], correctIndex: 1 },
    { id: 4, question: "Which tool is commonly used for CI/CD?", options: ["Photoshop", "Jenkins", "Excel", "Slack"], correctIndex: 1 },
    { id: 5, question: "Benefit of DevOps:", options: ["Slower releases", "Faster, reliable deployments", "More manual work", "Less collaboration"], correctIndex: 1 },
  ],
};

/* ── helpers ─────────────────────────────────────────────────────── */

function quizKey(courseId: string, moduleId: string): string {
  return `${courseId}__${moduleId}`;
}

/**
 * Get quiz questions for a module. Falls back to generic questions when none
 * are defined (e.g. for user-created courses).
 */
export function getModuleQuiz(courseId: string, moduleId: string): QuizQuestion[] {
  const key = quizKey(courseId, moduleId);
  if (defaultQuizBank[key]) return defaultQuizBank[key];

  // Generic fallback for any module without curated questions
  return [
    { id: 1, question: "Did you review all the lesson materials in this module?", options: ["Yes", "No"], correctIndex: 0 },
    { id: 2, question: "Do you feel confident about the topics covered?", options: ["Yes", "No"], correctIndex: 0 },
    { id: 3, question: "Are you ready to proceed to the next module?", options: ["Yes", "No"], correctIndex: 0 },
  ];
}

/**
 * Mark a module quiz as passed (persists in localStorage)
 */
export function markQuizPassed(courseId: string, moduleId: string): void {
  const passed = getPassedQuizzes();
  passed.add(quizKey(courseId, moduleId));
  localStorage.setItem(QUIZ_PASS_KEY, JSON.stringify([...passed]));
}

/**
 * Check whether the quiz for a module has been passed
 */
export function isQuizPassed(courseId: string, moduleId: string): boolean {
  return getPassedQuizzes().has(quizKey(courseId, moduleId));
}

function getPassedQuizzes(): Set<string> {
  const stored = localStorage.getItem(QUIZ_PASS_KEY);
  if (!stored) return new Set();
  try {
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}
