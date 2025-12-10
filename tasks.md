# Project Task List — Rocket Quiz

> Status legend: OPEN / IN_PROGRESS / REVIEW / DONE

## Priority: High

- [DONE] **Holidays Edition**
  - in the landing page: in the top right add a diagonal red ribbon with white font label "Sindhu Edition"; implement a WebGL snow falling effect; control both the ribbon and the snow fall effect via a feature toggle config in .env file.
  - Added feature toggle `VITE_HOLIDAYS_EDITION_ENABLED` to .env and .env.example files
  - Created SnowEffect component with customizable snow particles, wind drift, and sparkle effects
  - Created Ribbon component with diagonal positioning and professional styling
  - Updated Home.tsx to conditionally render holiday features based on environment variable
  - Successfully tested implementation - build completes without errors
  - Both snow effect and ribbon appear on landing page when feature is enabled
  - Fixed ribbon text centering issue - adjusted positioning and added flexbox centering for better text visibility
  - Enhanced ribbon design with angled ends using CSS clip-path for a professional ribbon appearance
  - Applied gradient background and improved shadow effects for visual appeal
  - Implemented text counter-skewing to maintain horizontal text while preserving angled ribbon shape

- [DONE] **Music**
  - play song public/TickTockTrivia.mp3 during the quiz countdown. when the timer is finished, quickly fade out the music then stop playing.
  - Implemented music playback in both single-player and multiplayer modes
  - Music starts when each question timer begins and fades out when timer finishes
  - Added fade-out effect that gradually reduces volume over ~1 second
  - Music also stops when quiz is quit or completed
  - Handles autoplay restrictions gracefully with user interaction

- [DONE] **Confetti**
  - in all the quiz results pages, show a WebGL confetti effect falling from the top of the screen.
  - Implemented a WebGL Canvas-based confetti component with customizable particles
  - Added confetti animation to ResultsPage.tsx for both single-player and multiplayer games
  - Confetti features: 200 particles, 7 vibrant colors, 6-second duration with gravity and rotation
  - Component includes proper cleanup and performance optimization
  - Successfully tested and built without errors

- [DONE] **Images**
  - in CreateQuiz.tsx, we now have both "Quiz Image URL (optional)" and "Quiz Image Description" fields. Users can provide either none, an image URL, or an image description for both the quiz and each question. If both URL and description are provided, the URL takes priority. If none are provided, no image is shown (solid color background). We use the pollinations.ai service as the default for generating images from descriptions: https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?nologo=true&private=true
  - The Question Image URL fields remain as override options for users who want to provide their own specific images.
  - Updated AI generation prompts to request image descriptions instead of image URLs.
  - Added comprehensive validation and user feedback for both URL validation and image generation status.
  - Fixed AI prompt to include image descriptions for questions (previously only quiz level had image descriptions).

- [HALT] **Private Quizzes**
  - Allow users to create private quizzes. This is disabled by default, but if enabled only the user who created the quiz can see and play it.