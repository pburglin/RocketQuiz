/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#FF6347', // Tomato Red
        'secondary': '#FFD700', // Gold
        'accent': '#1E90FF', // Dodger Blue
        'neutral': '#F5F5F5', // White Smoke
        'base-100': '#FFFFFF', // White
        'info': '#20B2AA', // Light Sea Green
        'success': '#32CD32', // Lime Green
        'warning': '#FFA500', // Orange
        'error': '#FF4136', // Red
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
