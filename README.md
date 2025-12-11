# RocketQuiz

RocketQuiz is a modern, production-ready, Kahoot-like quizzer web app built with React, Vite, Tailwind CSS, and Supabase. It supports both anonymous and registered user experiences, real-time multiplayer, and a beautiful, responsive UI.

Check it out here: [https://rocketquiz.us](https://rocketquiz.us)

---

## 🎄 Xmas Release (December 2025)

We're excited to announce our festive **Xmas Release** featuring major enhancements to quiz creation, multiplayer experience, and visual effects!

### 🆕 New Features

#### 🔐 **Private Quiz Functionality**
- **Private Quiz Access:** Users can now create and access private quizzes for exclusive gameplay
- Enhanced quiz privacy controls for content creators

#### 🎵 **Enhanced Audio Experience**
- **Quiz Countdown Music:** Added countdown music with smooth fade-out effects
- **Music Host Controls:** Multiplayer hosts now have complete control over background music
- **Audio Integration:** Seamless audio experience throughout quiz sessions

#### 🎨 **Visual Effects & Animations**
- **WebGL Confetti Effects:** Celebration animations on quiz results pages
- **Answer Explosion Effects:** Dynamic visual feedback for multiplayer quiz answers
- **Snow Effect:** Holiday-themed snow animations for the Sindhu Edition
- **BeatSync Animation:** Enhanced visual synchronization with quiz beats

#### 🖼️ **Smart Image Management**
- **Automatic Image Fallback:** Intelligent handling of blocked networks with fallback images
- **AI Image Optimization:** Enhanced prompts with logging and examples for better image generation
- **Consolidated Image Fields:** Streamlined quiz creation with unified image input
- **Height Parameter Fix:** Prevented vertical cropping during quiz play
- **Alternative Fix Options:** Modal confirmation for incomplete image processing

#### ⚙️ **UI/UX Improvements**
- **Settings Modal Enhancement:** Fixed modal close button colors and added click-outside-to-close functionality
- **Ribbon Repositioning:** Moved red ribbon from top-right to top-left to avoid navigation interference
- **Better Error Handling:** Improved LLM API error messages for enhanced user experience
- **Service Credits:** Added comprehensive service credits to README and About pages

#### 🏆 **Multiplayer Enhancements**
- **Quit Confirmation:** Added confirmation modal for clean multiplayer session exits
- **Real-time Effects:** Enhanced visual feedback for answer selections
- **Host Controls:** Complete music and session management for game hosts

### 🔧 Technical Improvements

- **Enhanced AI Prompts:** Updated CreateQuiz AI prompts to include image descriptions for questions
- **Improved Error Messages:** Better user experience through clearer error communication
- **Database Optimization:** Added question count tracking to quizzes
- **Performance Optimizations:** Streamlined image loading and fallback mechanisms

### 🎅 **Special Holiday Features**

- **Sindhu Edition:** Special holiday theme with music and festive elements
- **Snow Animation:** Seasonal visual effects throughout the application
- **Holiday Ribbon:** Beautiful decorative elements for the festive season

---

## Project Plan

### 1. Features

#### Quiz Discovery & Play
- **Browsing & Searching Quizzes:**  
  - Anonymous users can browse a list of available quizzes.
  - Search screen with filters: language (default English), popularity, tags, keywords.
- **Single-Player Mode:**  
  - Anonymous users can play quizzes solo.
  - After each session: see correct answers, percentage of players per option, and a session-specific leaderboard.

#### Multiplayer Mode
- **Nickname-based Participation:**  
  - Anonymous users join live games with a nickname.
- **Game Session Initiation:**  
  - Registered users can start multiplayer games from existing quizzes.
  - Unique game session URLs for sharing.
- **Real-time Feedback:**  
  - After each question: correct answer, option distribution, and current leaderboard.
- **Final Leaderboard:**  
  - End-of-game leaderboard with top nicknames and scores.

#### User Profile & Registration
- **Anonymous-to-Registered Transition:**  
  - Users can register for a full profile.
  - Registered users can start multiplayer games and create quizzes.

#### Quiz Creation
- **Quiz Content:**  
  - Registered users can create quizzes with title, description, language, and tags.
- **Question Setup:**  
  - Each quiz has one or more questions, each with one correct and several wrong answers.
- **Multimedia Options:**  
  - Optional image URLs for quizzes and questions.

#### Advanced Filtering
- **Search Quiz Screen:**  
  - Filter by language, popularity, tags, and keywords.

---

### 2. User Journeys

#### A. Anonymous User: Single-Player
1. **Landing/Home:**  
   - Greeted by featured/trending quizzes.
2. **Quiz Discovery:**  
   - Search and filter quizzes.
3. **Quiz Engagement:**  
   - Play quiz, answer questions.
4. **Results & Feedback:**  
   - See correct answers, option stats, and leaderboard after each question and at the end.

#### B. Anonymous User: Multiplayer
1. **Joining via URL:**  
   - Click unique session URL.
2. **Nickname Creation:**  
   - Enter nickname before joining.
3. **Game Play:**  
   - Wait in lobby, play quiz, see real-time feedback and leaderboard.
4. **Final Standings:**  
   - View final leaderboard.

#### C. Registered User: Game Initiation & Profile
1. **Registration/Login:**  
   - Register and log in.
2. **Session Creation:**  
   - Start multiplayer game from quiz search.
3. **Sharing Game URL:**  
   - Share unique session URL.
4. **Game Management:**  
   - View real-time feedback and final leaderboard.

#### D. Registered User: Quiz Creation
1. **Access Creation Page:**  
   - Go to “Create Quiz” from dashboard.
2. **Quiz Setup:**  
   - Enter title, description, language, tags.
3. **Question Addition:**  
   - Add questions, correct/wrong answers, optional images.
4. **Publishing & Management:**  
   - Publish quiz, manage from dashboard.

---

### 3. Screen Descriptions & Flows

#### A. Landing/Home Screen
- **Elements:** Navbar, featured quizzes carousel.
- **Purpose:** Gateway for quiz discovery or joining live sessions.

#### B. Search Quiz Screen
- **Elements:** Search bar, filters (language, tags, popularity, keywords), quiz list/grid with thumbnails.
- **Purpose:** Find quizzes by interest.

#### C. Single-Player Quiz Screen
- **Elements:** Progress indicator, question display (text/image), multiple-choice answers, timer.
- **Feedback:** Post-question modal with correct answer, option stats, and leaderboard.

#### D. Multiplayer Lobby & Nickname Screen
- **Elements:** Nickname prompt, waiting area visuals.
- **Purpose:** Manage player identity and game start.

#### E. Multiplayer Play Screen
- **Elements:** Real-time question display, answer buttons, timer.
- **Live Feedback:** Summary panel with correct answer, stats, and live leaderboard.

#### F. Final Leaderboard Screen
- **Elements:** Final scores, top rankings, performance breakdown.
- **Purpose:** Closure and recognition.

#### G. User Registration/Login Screens
- **Elements:** Username, email, password fields, forgot password link.
- **Purpose:** Register and log in.

#### H. User Profile Dashboard & Quiz Creation Screen
- **Profile Dashboard:** User activity, navigation to create/manage quizzes.
- **Quiz Creation:** Form for quiz details, image URLs, dynamic question entry.

---

### Additional Considerations

- **Responsive Design:** All screens adapt to mobile, tablet, and desktop.
- **Real-Time Performance:** Uses WebSocket or similar for multiplayer feedback.
- **Security & Data Integrity:** Secure storage, validation, authentication, and authorization.
- **Analytics & Feedback:** Track quiz plays and user behavior for future improvements.

---

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide React (icons)
- **Backend:** Supabase (SaaS, SQL migrations in `supabase/migrations`)
- **Config:** Environment variables in `.env` (see `.env.example`)
- **Images:** Stock photos from Unsplash (linked, not downloaded)

## Credits

- **Music:** Suno.com - AI music generation
- **Image Generation:** Pollinations.ai - AI image generation
- **Hosting:** Netlify.com - Static site hosting and deployment
- **Persistence:** Google Firebase - Database and authentication

---

## Setup

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in required values.
4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## Directory Structure

- `src/` - React source code
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `supabase/migrations/` - SQL migration files for Supabase
- `.env` - Environment variables (not committed)
- `.env.example` - Example env file with documentation

---

## License

GNU AFFERO GENERAL PUBLIC LICENSE (AGPL) - see LICENSE.txt for more details.
