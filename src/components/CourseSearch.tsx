'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, BookOpen, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
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

type SearchStatus = 'idle' | 'searching' | 'success' | 'error';

export default function CourseSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const searchIdRef = useRef(0);
  const searchStartTimeRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<SearchStatus>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingQueryRef = useRef<string>('');
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const accessLevel = user?.access_level || 1;
  const canSearch = accessLevel === 1 || accessLevel === 2 || accessLevel === 3;

  const performSearch = useCallback(async (searchQuery: string, searchId: number) => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    pendingQueryRef.current = searchQuery;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      if (signal.aborted || searchIdRef.current !== searchId) {
        return;
      }

      if (!accessToken) {
        if (searchIdRef.current === searchId) {
          setStatus('error');
          setErrorMessage('Authentication error. Please refresh the page.');
          searchStartTimeRef.current = null;
        }
        return;
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal
      });

      if (signal.aborted || searchIdRef.current !== searchId) {
        return;
      }

      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data.results || []);
        setStatus('success');
        pendingQueryRef.current = '';
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Search failed' }));
        setStatus('error');
        setErrorMessage(errorData.error || 'Search failed. Please try again.');
      }
    } catch (error: any) {
      if (signal.aborted) {
        return;
      }
      if (searchIdRef.current !== searchId) {
        return;
      }
      
      if (error.name === 'AbortError') {
        return;
      }
      
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      if (!signal.aborted && searchIdRef.current === searchId) {
        searchStartTimeRef.current = null;
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!canSearch) return;

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      setResults([]);
      setStatus('idle');
      setErrorMessage('');
      setIsOpen(false);
      searchStartTimeRef.current = null;
      return;
    }

    if (trimmedQuery.length >= 1) {
      setIsOpen(true);
    }

    if (trimmedQuery.length < 2) {
      setResults([]);
      setStatus('idle');
      searchStartTimeRef.current = null;
      return;
    }

    searchIdRef.current += 1;
    const currentSearchId = searchIdRef.current;
    
    searchStartTimeRef.current = Date.now();
    setStatus('searching');
    setErrorMessage('');

    const debounceTimer = setTimeout(() => {
      performSearch(trimmedQuery, currentSearchId);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [query, canSearch, performSearch]);

  useEffect(() => {
    if (status !== 'searching') return;

    const hardTimeout = setTimeout(() => {
      if (statusRef.current === 'searching') {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setStatus('error');
        setErrorMessage('Search took too long. Please try again.');
        searchStartTimeRef.current = null;
      }
    }, 15000);

    return () => clearTimeout(hardTimeout);
  }, [status]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (!document.hidden && statusRef.current === 'searching' && pendingQueryRef.current) {
        const startTime = searchStartTimeRef.current;
        const elapsed = startTime ? Date.now() - startTime : 0;
        
        if (elapsed > 3000) {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }
          searchIdRef.current += 1;
          const currentSearchId = searchIdRef.current;
          searchStartTimeRef.current = Date.now();
          performSearch(pendingQueryRef.current, currentSearchId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [performSearch]);

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

  const handleClear = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    searchIdRef.current += 1;
    searchStartTimeRef.current = null;
    pendingQueryRef.current = '';
    setQuery('');
    setResults([]);
    setStatus('idle');
    setErrorMessage('');
    setIsOpen(false);
  }, []);

  const handleResultClick = useCallback((lessonId: string) => {
    handleClear();
    router.push(`/lesson/${lessonId}`);
  }, [handleClear, router]);

  const handleRetry = useCallback(() => {
    if (query.trim().length >= 2) {
      searchIdRef.current += 1;
      const currentSearchId = searchIdRef.current;
      searchStartTimeRef.current = Date.now();
      pendingQueryRef.current = query.trim();
      setStatus('searching');
      setErrorMessage('');
      performSearch(query.trim(), currentSearchId);
    }
  }, [query, performSearch]);

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

  const trimmedQuery = query.trim();

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
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (trimmedQuery.length >= 1) {
              setIsOpen(true);
            }
          }}
          placeholder="Search course content..."
          className="text-sm w-full bg-[#0f1012] hover:bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 px-10 py-2.5 pr-10 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && trimmedQuery.length >= 1 && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[300px] max-w-[calc(100vw-2rem)] bg-[#0f1012] border border-gray-700 rounded-lg shadow-2xl z-[9999]">
          <div className="max-h-96 overflow-y-auto">
            
            {trimmedQuery.length < 2 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                Enter at least 2 characters to search...
              </div>
            )}
            
            {trimmedQuery.length >= 2 && status === 'searching' && (
              <div className="p-4 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {trimmedQuery.length >= 2 && status === 'error' && (
              <div className="p-4 text-center">
                <div className="text-red-400 mb-3">{errorMessage}</div>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try again
                </button>
              </div>
            )}

            {trimmedQuery.length >= 2 && status === 'success' && (
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
                        {result.matches && result.matches.length > 0 && result.matches[0] && (
                          <div className="mt-2 text-xs text-gray-300 line-clamp-2">
                            {result.matches[0].text?.substring(0, 150)}
                            {result.matches[0].text?.length > 150 ? '...' : ''}
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
