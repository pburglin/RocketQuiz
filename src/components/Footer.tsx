export default function Footer() {
  return (
    <footer className="w-full bg-white/80 border-t border-gray-200 py-6 mt-16" itemScope itemType="https://schema.org/WPFooter">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} <span itemProp="copyrightHolder">RocketQuiz</span>. All rights reserved.
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-sm">
          <a href="/about" className="hover:text-orange-600 transition" itemProp="relatedLink">About</a>
          <a href="/privacy" className="hover:text-orange-600 transition" itemProp="relatedLink">Privacy</a>
          <a href="/search" className="hover:text-orange-600 transition" itemProp="relatedLink">Search Quizzes</a>
          <a href="/create-quiz" className="hover:text-orange-600 transition" itemProp="relatedLink">Create Quiz</a>
          <a href="/sitemap.xml" className="hover:text-orange-600 transition" rel="nofollow">Sitemap</a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4">
        <div className="text-xs text-gray-400 text-center">
          <p>RocketQuiz is an interactive quiz platform for creating and playing quizzes with friends.</p>
          <p>Create your own quiz or join existing ones for educational fun!</p>
        </div>
      </div>
    </footer>
  );
}
