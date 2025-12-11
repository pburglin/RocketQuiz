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

- [DONE] **LLM error handling**
  - when creating new quizzes, sometimes I see message "LLM API error: (status 429)". lets replace this with a more user-friendly message, noting this is rate-limited by the LLM and suggesting the user to try again in a minute. also, sometimes I get JSON parsing erros with the response, if this happens lets suggest the user click the "Generate with AI" button again, this often fixes the problem.
  - Updated LLM error handling in CreateQuiz.tsx to provide user-friendly error messages
  - For status 429 errors: "The AI service is temporarily rate-limited. Please wait about a minute and try again."
  - For JSON parsing errors: "There was an issue parsing the AI response. Please try clicking the 'Generate with AI' button again."
  - Applied same user-friendly messaging to all JSON parsing fallback scenarios
  - Successfully tested - build completes without errors

- [DONE] **Tune AI Image Prompt**
  - in CreateQuiz.tsx, sometimes the LLM result for "Image Description (for AI generation)" does not generate a working image. to mitigate these errors, lets change the LLM prompt to request this field should only have alphanumeric and space characters, no punctuation or other special characters.
  - Updated LLM system prompt in CreateQuiz.tsx to constrain image descriptions to only lowercase alphanumeric characters and spaces
  - Added explicit instruction: "IMPORTANT: All 'imageDescription' fields should only contain lowercase alphanumeric characters (lowercase letters and numbers) and spaces. Do not use uppercase letters, punctuation, special characters, or symbols in image descriptions."
  - Updated prompt to exclude 'image' fields with URLs from LLM response to prevent automatic filling of Image URL fields
  - Added instruction: "Do NOT include 'image' fields with URLs in your response."
  - Added console logging to track JSON objects received from LLM for debugging purposes
  - Logging includes: raw API response data, LLM content response, parsed quiz object, and JSON extraction status
  - Added concrete JSON example to LLM prompt to reduce parsing errors and provide clear template
  - Example includes proper structure with title, description, language, tags, imageDescription, and questions array
  - Build completed successfully with no errors

- [DONE] in CreateQuiz.tsx for the quiz and for each question we show 2 image fields: image URL and image description. User is supposed to enter value only for one of them, which makes the user experience unnecessary complicated and counterintuitive. Instead, lets consolidate these 2 fields into a single optional "Image" field, with a subtitle that tells user to enter either an image URL or an image description. If value starts with HTTP, we handle it as an image URL. If not, we handle as an image description and use the existing Pollinations.ai implementation to generate the image URL. We simplify percistency logic by storing only one field for the image URL, either the one the user provided, or the one we generated for Pollinations.ai.
  - Consolidated dual image fields into single smart "Image" field that detects URL vs description
  - Updated Question interface to use single image field instead of separate URL/description fields
  - Implemented intelligent handling: URLs (starting with HTTP) are validated, descriptions generate AI images
  - Simplified persistence by storing only final image URL (user URL or generated URL)
  - Updated UI with clear placeholder text and combined validation/generation indicators
  - Build completed successfully with no TypeScript errors

- [OPEN] the Firebase Firestore database shows increased number of database reads. this happened in a period when we had larger number of concurrent users playing a quiz. to avoid scalability issues and Firestorm service outages, lets review the quiz logic, and identify opportunities to reduce database reads with more aggressive caching while being very careful not to break existing multiplayer quiz functionality.

- [OPEN] implement WebGL animation effect during the quiz with movement in sync with the song beat. Change the color of the WebGL effect from green, to orange to red the closer we are for the timer to end.

- [DONE] in README.md and About screen, credit "Suno.com" for the music. "Pollinations.ai" for image generation. "Netlify.com" for hosting the app. Google Firebase for persistence.
   - Added comprehensive credits section to README.md under "Credits" heading
   - Added "Credits" section to About.tsx with formatted text for all four services
   - Credits include: Suno.com (music), Pollinations.ai (image generation), Netlify.com (hosting), Google Firebase (persistence)
   - Both files now properly acknowledge the services used in the project

- [OPEN] in multiplayer quizzes, lets implement a control to let quiz host user turn music volume down for all quiz players. show the music controls in the quiz lobby and during the quiz, but only for the quiz host user. the quiz host user can lower the volume all the way down to zero, completely turning off the music. as the volume is changed, all players registered for the multiplayer quiz also have their music volume updated to match the configuration set by the quiz host user.

- [HALT] **Private Quizzes**
  - Allow users to create private quizzes. This is disabled by default, but if enabled only the user who created the quiz can see and play it.