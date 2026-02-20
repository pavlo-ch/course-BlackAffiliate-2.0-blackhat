import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serverSupabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '';

async function sendTelegramMessage(text: string) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
  return response.ok;
}

async function sendTelegramPhoto(photo: Blob, caption: string) {
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('photo', photo);
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
  return response.ok;
}

async function sendTelegramDocument(doc: Blob, caption: string, filename: string) {
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('document', doc, filename);
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: formData,
  });
  return response.ok;
}

function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract text fields
    const geo = formData.get('geo') as string || '';
    const topGames = formData.get('topGames') as string || '';
    const chosenGames = formData.get('chosenGames') as string || '';
    const cpc = formData.get('cpc') as string || '';
    const cpl = formData.get('cpl') as string || '';
    const cpr = formData.get('cpr') as string || '';
    const cpa = formData.get('cpa') as string || '';
    const splitTest = formData.get('splitTest') as string || '';
    const pwaLink = formData.get('pwaLink') as string || '';
    const negativeComments = formData.get('negativeComments') as string || '';
    const creativesCount = formData.get('creativesCount') as string || '';
    const creativesApproach = formData.get('creativesApproach') as string || '';
    const campaignModel = formData.get('campaignModel') as string || '';
    const campaignModelDetails = formData.get('campaignModelDetails') as string || '';
    const testingStructure = formData.get('testingStructure') as string || '';
    const optimizationStrategy = formData.get('optimizationStrategy') as string || '';
    const userName = formData.get('userName') as string || 'Невідомий';

    // Audiences (dynamic)
    const audiences: string[] = [];
    let i = 0;
    while (formData.get(`audience_${i}`)) {
      audiences.push(formData.get(`audience_${i}`) as string);
      i++;
    }

    // Attempt to get user_id from Authorization header if available
    let userId = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await serverSupabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    // Helper to safely escape HTML for Telegram
    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    if (!userId || !authHeader) {
      throw new Error("Missing user token or ID");
    }
    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Helper to upload file to Supabase Storage and get public URL
    const uploadToStorage = async (file: File, folder: string): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await authClient.storage
          .from('brief_files')
          .upload(fileName, file, { upsert: false });
        
        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          return null;
        }

        const { data: publicUrlData } = authClient.storage
          .from('brief_files')
          .getPublicUrl(fileName);
        
        return publicUrlData.publicUrl;
      } catch (err) {
        console.error(`Failed to process file ${file.name}:`, err);
        return null;
      }
    };

    // Extract files from formData
    const extractFiles = (prefix: string): File[] => {
      const files: File[] = [];
      let idx = 0;
      while (formData.get(`${prefix}_${idx}`)) {
        const f = formData.get(`${prefix}_${idx}`) as File;
        if (f && f.size > 0) files.push(f);
        idx++;
      }
      return files;
    };

    const trafficCalcFiles = extractFiles('trafficCalcFile');
    const fanPageFiles = extractFiles('fanPageScreenshot');
    const creativeFiles = extractFiles('creativeExample');
    const caseFiles = extractFiles('caseScreenshot');

    // Upload files concurrently
    const [trafficCalcUrls, fanPageUrls, creativeUrls, caseUrls] = await Promise.all([
      Promise.all(trafficCalcFiles.map(f => uploadToStorage(f, 'traffic_calcs'))),
      Promise.all(fanPageFiles.map(f => uploadToStorage(f, 'fan_pages'))),
      Promise.all(creativeFiles.map(f => uploadToStorage(f, 'creatives'))),
      Promise.all(caseFiles.map(f => uploadToStorage(f, 'cases'))),
    ]);

    // Save to Database
    const briefData = {
      geo,
      topGames,
      chosenGames,
      cpc,
      cpl,
      cpr,
      cpa,
      splitTest,
      pwaLink,
      negativeComments,
      creativesCount,
      creativesApproach,
      campaignModel,
      campaignModelDetails,
      testingStructure,
      optimizationStrategy,
      audiences,
      files: {
        traffic_calculations: trafficCalcUrls.filter(Boolean),
        fan_pages: fanPageUrls.filter(Boolean),
        creatives: creativeUrls.filter(Boolean),
        cases: caseUrls.filter(Boolean),
      }
    };

    try {
      const { error: dbInsertError } = await authClient.from('submitted_briefs').insert({
        user_id: userId,
        data: briefData
      });

      if (dbInsertError) {
        console.error('Explicit Supabase Insert Error:', dbInsertError);
        throw new Error(`Database insert failed: ${dbInsertError.message}`);
      }
    } catch (dbError: any) {
      console.error('Failed to save brief to database:', dbError);
      // We still want to send the Telegram message even if DB fails,
      // but we should probably inform the client that DB saving failed if it's critical.
      // For now, let's keep it non-blocking but heavily logged.
    }

    // Build message
    const message = `📋 <b>Новий бриф від ${escapeHtml(userName)}</b>

━━━━━━━━━━━━━━━━━━━━
<b>🌍 Блок 1. Гео та оффер</b>
━━━━━━━━━━━━━━━━━━━━

<b>1. GEO:</b> ${escapeHtml(geo)}

<b>2. Топ ігри в SPY сервісах:</b>
${escapeHtml(topGames)}

<b>3. Казино-ігри для тесту:</b>
${escapeHtml(chosenGames)}

<b>4. Спліт тест PWA:</b> ${escapeHtml(splitTest)}
<b>5. Посилання на PWA:</b> ${escapeHtml(pwaLink) || 'Не вказано'}

━━━━━━━━━━━━━━━━━━━━
<b>📄 Блок 2. Fan Page</b>
━━━━━━━━━━━━━━━━━━━━

<b>6. Негативні коментарі:</b>
${escapeHtml(negativeComments)}

━━━━━━━━━━━━━━━━━━━━
<b>🎨 Блок 3. Креативи</b>
━━━━━━━━━━━━━━━━━━━━

<b>7. Протестовано креативів:</b> ${escapeHtml(creativesCount)}
<b>8. Підходи в креативах:</b>
${escapeHtml(creativesApproach)}

━━━━━━━━━━━━━━━━━━━━
<b>📊 Блок 4. Кампанії Facebook</b>
━━━━━━━━━━━━━━━━━━━━

<b>9. Модель:</b> ${escapeHtml(campaignModel)}${campaignModelDetails ? ` (${escapeHtml(campaignModelDetails)})` : ''}
<b>10. Структура тестування:</b> ${escapeHtml(testingStructure)}
<b>11. Аудиторії:</b>
${audiences.length > 0 ? audiences.map((a, idx) => `• Аудиторія ${idx + 1}: ${escapeHtml(a)}`).join('\n') : 'Не вказано'}
<b>12. Стратегія оптимізації:</b>
${escapeHtml(optimizationStrategy)}`;

    // Send main message
    await sendTelegramMessage(message);

    // Handle file uploads - traffic calc files (multiple)
    for (const file of trafficCalcFiles) {
      const caption = `<b>📊 Розрахунки по трафіку</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Fan Page screenshots (multiple)
    for (const file of fanPageFiles) {
      const caption = `<b>📄 Скріншот Fan Page</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Creative examples (multiple files possible)
    for (const file of creativeFiles) {
      const caption = `<b>🎨 Приклад креативу</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Case screenshots (multiple files)
    for (const file of caseFiles) {
      const caption = `<b>📸 Кейс для розбору</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    return NextResponse.json({ success: true, message: 'Brief submitted successfully' });
  } catch (error: any) {
    console.error('Brief submission error details:', error?.message, error?.stack);
    return NextResponse.json(
      { success: false, message: 'Failed to submit brief', error: error?.message },
      { status: 500 }
    );
  }
}
