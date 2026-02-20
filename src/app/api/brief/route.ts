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
      audiences
    };

    try {
      await serverSupabase.from('submitted_briefs').insert({
        user_id: userId,
        data: briefData
      });
    } catch (dbError) {
      console.error('Failed to save brief to database:', dbError);
      // We don't throw here to ensure Telegram notification still goes through even if DB fails
    }

    // Build message
    const message = `📋 <b>Новий бриф від ${userName}</b>

━━━━━━━━━━━━━━━━━━━━
<b>🌍 Блок 1. Гео та оффер</b>
━━━━━━━━━━━━━━━━━━━━

<b>1. GEO:</b> ${geo}

<b>2. Топ ігри в SPY сервісах:</b>
${topGames}

<b>3. Казино-ігри для тесту:</b>
${chosenGames}

<b>4. Розрахунки:</b>
• CPC: ${cpc}
• CPL: ${cpl}
• CPR: ${cpr}
• CPA: ${cpa}

━━━━━━━━━━━━━━━━━━━━
<b>📱 Блок 2. PWA та воронка</b>
━━━━━━━━━━━━━━━━━━━━

<b>5. Спліт тест PWA:</b> ${splitTest}
<b>6. Посилання на PWA:</b> ${pwaLink || 'Не вказано'}

━━━━━━━━━━━━━━━━━━━━
<b>📄 Блок 3. Fan Page</b>
━━━━━━━━━━━━━━━━━━━━

<b>8. Негативні коментарі:</b>
${negativeComments}

━━━━━━━━━━━━━━━━━━━━
<b>🎨 Блок 4. Креативи</b>
━━━━━━━━━━━━━━━━━━━━

<b>9. Протестовано креативів:</b> ${creativesCount}
<b>10. Підходи в креативах:</b>
${creativesApproach}

━━━━━━━━━━━━━━━━━━━━
<b>📊 Блок 5. Кампанії Facebook</b>
━━━━━━━━━━━━━━━━━━━━

<b>11. Модель:</b> ${campaignModel}${campaignModelDetails ? ` (${campaignModelDetails})` : ''}
<b>12. Структура тестування:</b> ${testingStructure}
<b>13. Аудиторії:</b>
${audiences.length > 0 ? audiences.map((a, idx) => `• Аудиторія ${idx + 1}: ${a}`).join('\n') : 'Не вказано'}
<b>14. Стратегія оптимізації:</b>
${optimizationStrategy}`;

    // Send main message
    await sendTelegramMessage(message);

    // Handle file uploads - traffic calc files (multiple)
    const trafficCalcFiles: File[] = [];
    let tci = 0;
    while (formData.get(`trafficCalcFile_${tci}`)) {
      const f = formData.get(`trafficCalcFile_${tci}`) as File;
      if (f && f.size > 0) trafficCalcFiles.push(f);
      tci++;
    }
    for (const file of trafficCalcFiles) {
      const caption = `<b>📊 Розрахунки по трафіку</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Fan Page screenshots (multiple)
    const fanPageFiles: File[] = [];
    let fpi = 0;
    while (formData.get(`fanPageScreenshot_${fpi}`)) {
      const f = formData.get(`fanPageScreenshot_${fpi}`) as File;
      if (f && f.size > 0) fanPageFiles.push(f);
      fpi++;
    }
    for (const file of fanPageFiles) {
      const caption = `<b>📄 Скріншот Fan Page</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Creative examples (multiple files possible)
    const creativeFiles: File[] = [];
    let ci = 0;
    while (formData.get(`creativeExample_${ci}`)) {
      const f = formData.get(`creativeExample_${ci}`) as File;
      if (f && f.size > 0) creativeFiles.push(f);
      ci++;
    }
    for (const file of creativeFiles) {
      const caption = `<b>🎨 Приклад креативу</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    // Case screenshots (multiple files)
    const caseFiles: File[] = [];
    let csi = 0;
    while (formData.get(`caseScreenshot_${csi}`)) {
      const f = formData.get(`caseScreenshot_${csi}`) as File;
      if (f && f.size > 0) caseFiles.push(f);
      csi++;
    }
    for (const file of caseFiles) {
      const caption = `<b>📸 Кейс для розбору</b>\nВід: ${userName}`;
      if (isImageFile(file.name)) {
        await sendTelegramPhoto(file, caption);
      } else {
        await sendTelegramDocument(file, caption, file.name);
      }
    }

    return NextResponse.json({ success: true, message: 'Brief submitted successfully' });
  } catch (error) {
    console.error('Brief submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit brief' },
      { status: 500 }
    );
  }
}
