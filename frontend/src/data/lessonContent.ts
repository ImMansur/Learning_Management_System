export interface LessonContent {
  videoUrl: string;
  transcript: string;
  aiSummary: string;
  blobUrl?: string; // Azure blob URL for transcription
  lastUpdated?: string;
}

// Mock content keyed by lessonId
export const lessonContent: Record<string, LessonContent> = {
  l1: {
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    blobUrl: "https://aiprogstorage01.blob.core.windows.net/video/videos/sample_video.mp4",
    transcript: `Welcome to this lesson on Artificial Intelligence. AI refers to the simulation of human intelligence in machines programmed to think and learn like humans. The term was first coined in 1956 at the Dartmouth Conference.
AI systems can be categorized into narrow AI, which is designed for specific tasks like voice recognition, and general AI, which would possess the ability to understand and learn any intellectual task that a human can.
Today, AI is used extensively in healthcare for diagnosis, in finance for fraud detection, in transportation for autonomous vehicles, and in customer service through chatbots. Machine learning, a subset of AI, enables systems to learn from data without being explicitly programmed.
Deep learning, which uses neural networks with many layers, has been particularly transformative in areas like image and speech recognition. As we move forward, understanding these foundational concepts will be crucial for working with modern AI systems.`,
    aiSummary: `**Key Takeaways:**
- AI simulates human intelligence in machines, coined in 1956
- Two categories: Narrow AI (specific tasks) vs General AI (any intellectual task)
- Core applications: healthcare diagnosis, fraud detection, autonomous vehicles, chatbots
- Machine Learning enables learning from data without explicit programming
- Deep Learning uses multi-layer neural networks for image/speech recognition
**Important Concepts:** Narrow vs General AI, Machine Learning as a subset, Deep Learning's role in modern applications.`,
  },
  l2: {
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    transcript: `The history of artificial intelligence stretches back to ancient myths and stories of artificial beings. However, the formal field began in 1956 when John McCarthy organized the Dartmouth Conference.
In the 1960s and 70s, early AI programs could solve algebra problems and prove theorems. The first AI winter occurred in the 1970s when funding was cut due to unmet expectations. A resurgence happened in the 1980s with expert systems, followed by another winter in the late 80s.
The modern era of AI began in the 1990s with the focus on machine learning and statistical approaches. IBM's Deep Blue defeated chess champion Garry Kasparov in 1997. The 2010s saw the deep learning revolution, powered by GPUs and big data, leading to breakthroughs in image recognition, natural language processing, and game playing.`,
    aiSummary: `**Key Takeaways:**
- AI's formal beginning: Dartmouth Conference, 1956
- Two "AI Winters" occurred due to unmet expectations (1970s, late 1980s)
- Expert systems drove the 1980s resurgence
- Modern AI focuses on statistical and ML approaches
- Milestones: Deep Blue (1997), Deep Learning revolution (2010s)
**Timeline:** Myths → 1956 Dartmouth → Early programs → AI Winter 1 → Expert Systems → AI Winter 2 → ML era → Deep Learning revolution`,
  },
  l3: {
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    transcript: `Machine learning can be broadly categorized into three main types: supervised learning, unsupervised learning, and reinforcement learning.
Supervised learning uses labeled data to train models. The algorithm learns a mapping from inputs to outputs. Common examples include classification (spam detection, image recognition) and regression (price prediction, temperature forecasting).
Unsupervised learning works with unlabeled data to find hidden patterns. Clustering algorithms group similar data points together, while dimensionality reduction techniques simplify complex datasets. Applications include customer segmentation and anomaly detection.
Reinforcement learning involves an agent learning to make decisions by interacting with an environment. The agent receives rewards or penalties for its actions and learns to maximize cumulative reward. This approach powers game-playing AI and robotics.`,
    aiSummary: `**Key Takeaways:**
- Three types: Supervised, Unsupervised, Reinforcement Learning
- Supervised: labeled data → classification & regression tasks
- Unsupervised: unlabeled data → clustering & dimensionality reduction
- Reinforcement: agent-environment interaction with reward signals
- Applications span spam detection, customer segmentation, robotics, and game AI
**Core Distinction:** Labeled data (supervised) vs unlabeled (unsupervised) vs reward-based (reinforcement).`,
  },
  l4: {
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    transcript: `In this hands-on exercise, you'll build your first machine learning model using Python and scikit-learn. We'll work with the classic Iris dataset to create a classification model.
First, we import the necessary libraries and load the dataset. The Iris dataset contains 150 samples of iris flowers with four features: sepal length, sepal width, petal length, and petal width. Each sample belongs to one of three species.
We split the data into training and testing sets, then create a Decision Tree classifier. After training the model on the training data, we evaluate its performance on the test set. You'll learn about accuracy metrics, confusion matrices, and how to interpret your model's predictions.`,
    aiSummary: `**Key Takeaways:**
- Hands-on ML with Python and scikit-learn
- Uses Iris dataset: 150 samples, 4 features, 3 classes
- Workflow: Load data → Split → Train → Evaluate
- Decision Tree classifier for multi-class classification
- Evaluation: accuracy metrics and confusion matrices
**Skills Practiced:** Data splitting, model training, performance evaluation, result interpretation.`,
  },
  l5: {
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    transcript: `Neural networks are computing systems inspired by biological neural networks in the human brain. They consist of interconnected nodes organized in layers: an input layer, one or more hidden layers, and an output layer.
Each connection between neurons has a weight that adjusts during training. When data passes through the network, each neuron applies an activation function to determine its output. Common activation functions include ReLU, sigmoid, and tanh.
The architecture of a neural network—the number of layers, neurons per layer, and connections—determines what the network can learn. Shallow networks with one hidden layer can approximate any continuous function, but deep networks with multiple layers can learn hierarchical representations more efficiently.`,
    aiSummary: `**Key Takeaways:**
- Neural networks: inspired by biological brains, organized in layers
- Structure: Input → Hidden layer(s) → Output layer
- Weights adjust during training; activation functions determine outputs
- Common activations: ReLU, sigmoid, tanh
- Deep networks learn hierarchical representations more efficiently than shallow ones
**Architecture Insight:** Depth enables efficient learning of complex, hierarchical features.`,
  },
};

// Fallback content for lessons without specific content
export const defaultLessonContent: LessonContent = {
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  transcript: "Transcript for this lesson is being prepared. Please check back soon for the full transcript of this lesson's content.",
  aiSummary: "**AI Summary:** This lesson's AI-generated summary is currently being processed. Key concepts and takeaways will appear here once the content analysis is complete.",
};

/**
 * Get lesson content by ID with fallback
 * @param lessonId - The lesson ID
 * @returns Lesson content
 */
export function getLessonContent(lessonId: string): LessonContent {
  return lessonContent[lessonId] || defaultLessonContent;
}
