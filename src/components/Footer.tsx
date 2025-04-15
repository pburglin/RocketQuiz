export default function Footer() {
  return (
    <footer className="w-full bg-white/80 border-t border-gray-200 py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} RocketQuiz. All rights reserved.
        </div>
        <div className="flex gap-4 text-gray-400 text-sm">
          <a href="/about" className="hover:text-emerald-600 transition">About</a>
          <a href="/privacy" className="hover:text-emerald-600 transition">Privacy</a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition">Photos: Unsplash</a>
        </div>
      </div>
    </footer>
  );
}
