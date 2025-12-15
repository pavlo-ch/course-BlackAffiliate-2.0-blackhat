import { NextRequest, NextResponse } from 'next/server';
import { courseData } from '@/data/courseData';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

const searchCache = new Map<string, { results: SearchResult[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  console.log('🔍 Search API called');
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    console.log('❌ No auth header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authUser) {
    console.log('❌ Auth error:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(authUser.id);
  
  if (userError || !userData) {
    console.log('❌ User not found');
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const accessLevel = userData.user.user_metadata?.access_level || 1;
  console.log('✅ Access level:', accessLevel);

  if (accessLevel !== 1 && accessLevel !== 2 && accessLevel !== 3) {
    return NextResponse.json({ error: 'Search is only available for Basic, Premium, and VIP users' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters long' }, { status: 400 });
  }

  const searchTerm = query.toLowerCase().trim();
  console.log('🔍 Searching for:', searchTerm);

  // Check cache
  const cached = searchCache.get(searchTerm);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ Returning cached results:', cached.results.length);
    return NextResponse.json({ results: cached.results, query: searchTerm, count: cached.results.length });
  }

  const results: SearchResult[] = [];

  for (const section of courseData) {
    for (const lesson of section.lessons) {
      if (accessLevel === 6 && lesson.id !== 'lesson-4-9') {
        continue;
      }

      if (!lesson.contentPath) {
        continue;
      }

      try {
        const filename = path.basename(lesson.contentPath);
        const filePath = path.join(process.cwd(), 'public', 'lessons', filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath} for lesson ${lesson.id}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes(searchTerm)) {
          const matches: { text: string; context: string }[] = [];
          const lines = content.split('\n');
          
          lines.forEach((line, lineIndex) => {
            const lineLower = line.toLowerCase();
            if (lineLower.includes(searchTerm)) {
              const lineTrimmed = line.trim();
              if (lineTrimmed.length > 10 && !lineTrimmed.startsWith('```')) {
                const matchText = lineTrimmed.replace(/^#+\s*/, '').replace(/[*_`]/g, '').substring(0, 150);
                if (matchText.length > 0 && matches.length < 2) {
                  matches.push({
                    text: matchText,
                    context: matchText
                  });
                }
              }
            }
          });

          if (matches.length > 0) {
            results.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              sectionTitle: section.title,
              sectionId: section.id,
              type: lesson.type,
              matches: matches.slice(0, 3)
            });
          }
        }
      } catch (error) {
        console.error(`Error searching in lesson ${lesson.id}:`, error);
        continue;
      }
    }
  }

  console.log(`✅ Search for "${searchTerm}" found ${results.length} results`);
  
  // Cache results
  searchCache.set(searchTerm, { results, timestamp: Date.now() });
  
  return NextResponse.json({ results, query: searchTerm, count: results.length });
}
