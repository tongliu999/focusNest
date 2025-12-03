# Focus Flow

Focus Flow is an interactive, AI-powered learning platform designed to help you master new topics through personalized learning journeys. By combining structured learning modules with the Pomodoro technique and gamification elements, Focus Flow makes learning engaging, efficient, and fun.

![Focus Flow Dashboard](./uploaded_image_0_1764734023233.png)

## Features

- **AI-Powered Learning Journeys**: Instantly generate comprehensive learning paths on any topic using Google's Gemini AI.
- **Diverse Learning Modules**:
  - **Learn**: Structured content with key takeaways.
  - **Quiz**: Test your knowledge with interactive questions and immediate feedback.
  - **Matching Game**: Reinforce concepts through memory-matching challenges.
  - **Assignment**: Apply what you've learned with open-ended tasks and get AI feedback.
- **Focus & Productivity**: Built-in Pomodoro timer to manage focus sessions and breaks, rewarding you with coins for staying on task.
- **Gamification**: Earn coins, upgrade your virtual duck companion's stats (Speed, Jump Height), and track your progress.
- **Dashboard**: Manage your active journeys, view history, and start new learning adventures.
- **PDF Export**: Export your assignment answers and learning summaries to PDF for offline review.
- **Responsive Design**: A modern, clean interface that works seamlessly across devices.

## Tech Stack

- **Frontend**: [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (Animations)
- **AI Integration**: [Google Gemini API](https://deepmind.google/technologies/gemini/)
- **Backend / Database**: [Firebase](https://firebase.google.com/) (Firestore)
- **Utilities**: 
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code/text editing
  - [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/) for PDF generation
  - [KaTeX](https://katex.org/) for math rendering

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Firebase project
- A Google Gemini API key

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/focus-nest.git
    cd focus-nest
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Setup:**

    Create a `.env` file in the root directory and add your API keys and configuration. You will likely need:

    ```env
    VITE_FIREBASE_API_KEY=your_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```

    *Note: Verify the exact variable names in `firebaseConfig.ts` and `services/geminiService.ts`.*

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## Usage

1.  **Start a Journey**: On the dashboard, enter a topic you want to learn about (e.g., "World War II", "Calculus", "React Hooks").
2.  **Learn**: Navigate through the generated modules. Read the content, take quizzes, and play games.
3.  **Focus**: Use the timer in the top right to start a focus session. Earn coins for completing sessions.
4.  **Review**: Check your dashboard to see your saved journeys and progress.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
