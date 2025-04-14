# PWA Icons for RocketQuiz

This directory contains the icons needed for the Progressive Web App (PWA) functionality of RocketQuiz.

## Generating Icons

Since we can't directly create binary files through the code interface, we've provided a simple HTML generator to create the icons:

1. Open the `generate-icons.html` file in a web browser
2. Click the "Download" buttons to download the 192x192 and 512x512 icons
3. Save the downloaded icons in this directory as:
   - `icon-192x192.png`
   - `icon-512x512.png`

## Icon Requirements

For a complete PWA, you should have the following icons:

- `icon-192x192.png`: Used for Android home screen and app launcher
- `icon-512x512.png`: Used for splash screens and app stores

## Custom Icons

For a production app, you should replace these placeholder icons with custom-designed icons that match your brand. The icons should:

- Be square (1:1 aspect ratio)
- Have a transparent background if you want to support adaptive icons
- Be in PNG format
- Have the appropriate sizes (192x192 and 512x512 pixels)

## Testing PWA Installation

After adding the icons and building the app, you can test the "Add to Home Screen" functionality by:

1. Opening the app in a supported browser (Chrome, Edge, etc.)
2. Using the browser's developer tools to verify the PWA is installable
3. Clicking the "Add to Home Screen" link in the footer