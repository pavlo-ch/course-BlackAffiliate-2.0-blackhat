'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, BookOpen, HelpCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  sectionId: string;
  type: 'lesson' | 'homework' | 'questions';
  matches: {
    text: string;
    context: string;
  }[];
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  count: number;
}

export default function CourseSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  const accessLevel = user?.access_level || 1;
  const canSearch = accessLevel === 1 || accessLevel === 2 || accessLevel === 3;

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setIsOpen(false);
      return;
    }

    if (query.trim().length >= 1) {
      setIsOpen(true);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          console.error('No auth token available for search');
          setResults([]);
          setHasSearched(true);
          setIsSearching(false);
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data: SearchResponse = await response.json();
          setResults(data.results || []);
          setHasSearched(true);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Search API error:', response.status, errorData);
          setResults([]);
          setHasSearched(true);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('Search request timed out');
        } else {
          console.error('Search error:', error);
        }
        setResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, canSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.course-search-container')) {
        if (!query.trim()) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, query]);

  const handleResultClick = (lessonId: string) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    router.push(`/lesson/${lessonId}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-4 h-4" />;
      case 'homework':
        return <FileText className="w-4 h-4" />;
      case 'questions':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!canSearch) {
    return null;
  }

  return (
    <div className="course-search-container relative w-full max-w-md">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          placeholder="Search course content..."
          className="text-sm w-full bg-[#0f1012] hover:bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 px-10 py-2.5 pr-10 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setHasSearched(false);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length >= 1 && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[400px] max-w-[calc(100vw-2rem)] bg-[#0f1012] border border-gray-700 rounded-lg shadow-2xl z-[9999]">
          <div className="p-2 border-b border-gray-700 flex items-center gap-2 text-xs text-gray-400">
            <Search className="w-3 h-3" />
            <span>Search results</span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query.trim().length < 2 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                Enter at least 2 characters to search...
              </div>
            )}
            
            {query.trim().length >= 2 && isSearching && (
              <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {!isSearching && hasSearched && query.trim().length >= 2 && (
              <>
                {results.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="text-gray-400 mb-2">No results found for &quot;{query}&quot;</div>
                    <div className="text-xs text-gray-500">Try different keywords</div>
                  </div>
                ) : (
                  <>
                    <div className="p-2 text-xs text-gray-400 border-b border-gray-700">
                      Found {results.length} {results.length === 1 ? 'result' : 'results'}
                    </div>
                    {results.map((result, index) => (
                      <div
                        key={`${result.lessonId}-${index}`}
                        onClick={() => handleResultClick(result.lessonId)}
                        className="p-3 border-b border-gray-700/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <div className="text-primary mt-0.5">
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {result.lessonTitle}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {result.sectionTitle}
                            </div>
                          </div>
                        </div>
                        {result.matches.length > 0 && (
                          <div className="mt-2 text-xs text-gray-300 line-clamp-2">
                            {result.matches[0].text.substring(0, 150)}
                            {result.matches[0].text.length > 150 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

