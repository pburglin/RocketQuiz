// Quiz data caching utility to reduce Firebase Firestore reads
interface QuizData {
  id: string;
  title: string;
  description?: string;
  image?: string;
  language?: string;
  tags?: string[];
  questions: Question[];
  createdAt?: any;
  updatedAt?: any;
}

interface Question {
  id: string;
  question: string;
  image?: string;
  answers: string[];
  correctAnswerIndex: number;
  time?: number;
}

interface CacheEntry {
  data: QuizData;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class QuizCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly QUIZ_DATA_TTL = 10 * 60 * 1000; // 10 minutes for quiz data

  // Generate cache key
  private getCacheKey(quizId: string): string {
    return `quiz_${quizId}`;
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get quiz data from cache
  getQuiz(quizId: string): QuizData | null {
    const key = this.getCacheKey(quizId);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`[QuizCache] Cache hit for quiz ${quizId}`);
      return entry.data;
    }
    
    console.log(`[QuizCache] Cache miss for quiz ${quizId}`);
    return null;
  }

  // Set quiz data in cache
  setQuiz(quizData: QuizData, customTtl?: number): void {
    const key = this.getCacheKey(quizData.id);
    const ttl = customTtl || this.QUIZ_DATA_TTL;
    
    this.cache.set(key, {
      data: quizData,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`[QuizCache] Cached quiz ${quizData.id} with TTL ${ttl}ms`);
  }

  // Clear specific quiz from cache
  clearQuiz(quizId: string): void {
    const key = this.getCacheKey(quizId);
    this.cache.delete(key);
    console.log(`[QuizCache] Cleared cache for quiz ${quizId}`);
  }

  // Clear all cache entries
  clearAll(): void {
    this.cache.clear();
    console.log('[QuizCache] Cleared all cache entries');
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Clean expired entries
  cleanExpired(): number {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[QuizCache] Cleaned ${cleaned} expired entries`);
    }
    return cleaned;
  }
}

// Create singleton instance
export const quizCache = new QuizCache();

// Helper function to create batch read function for quiz data
export async function fetchQuizWithCache(
  quizId: string,
  fetchFn: () => Promise<QuizData>
): Promise<QuizData> {
  // Try cache first
  const cached = quizCache.getQuiz(quizId);
  if (cached) {
    return cached;
  }

  // Fetch from database
  const data = await fetchFn();
  
  // Cache the result
  quizCache.setQuiz(data);
  
  return data;
}

// Auto-clean expired cache entries every 5 minutes
setInterval(() => {
  quizCache.cleanExpired();
}, 5 * 60 * 1000);