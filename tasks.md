# Project Task List — Rocket Quiz

> Status legend: OPEN / IN_PROGRESS / REVIEW / DONE

## Priority: High

- [OPEN] **Holidays Edition**
  - in the landing page: in the top right add a diagonal red ribbon with white font label "Sindhu Edition"; implement a WebGL snow falling effect; control both the ribbon and the snow fall effect via a feature toggle config in .env file.

- [OPEN] **Music**
  - play song public/TickTockTrivia.mp3 during the quiz countdown. when the timer is finished, quickly fade out the music then stop playing.

- [OPEN] **Confetti**
  - in all the quiz results pages, show a WebGL confetti effect falling from the top of the screen.

- [DONE] **Images**
  - in CreateQuiz.tsx, we now have both "Quiz Image URL (optional)" and "Quiz Image Description" fields. Users can provide either none, an image URL, or an image description for both the quiz and each question. If both URL and description are provided, the URL takes priority. If none are provided, no image is shown (solid color background). We use the pollinations.ai service as the default for generating images from descriptions: https://image.pollinations.ai/prompt/${encodeURIComponent(description)}?nologo=true&private=true
  - The Question Image URL fields remain as override options for users who want to provide their own specific images.
  - Updated AI generation prompts to request image descriptions instead of image URLs.
  - Added comprehensive validation and user feedback for both URL validation and image generation status.
  - Fixed AI prompt to include image descriptions for questions (previously only quiz level had image descriptions).