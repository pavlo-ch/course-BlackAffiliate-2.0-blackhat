export function generateFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const components: string[] = [];

  const ua = navigator.userAgent;
  let browserFamily = 'Unknown';
  if (ua.includes('Firefox/')) browserFamily = 'Firefox';
  else if (ua.includes('Edg/')) browserFamily = 'Edge';
  else if (ua.includes('Chrome/')) browserFamily = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browserFamily = 'Safari';

  components.push(browserFamily);
  components.push(navigator.language);
  
  const screenW = Math.floor(screen.width / 100) * 100;
  const screenH = Math.floor(screen.height / 100) * 100;
  components.push(String(screenW) + 'x' + String(screenH));
  
  components.push(String(screen.colorDepth));
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.maxTouchPoints || 0));
  components.push(navigator.platform || '');

  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

export function getDeviceInfo(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/([\d.]+)/)?.[1] || '';
    browser = 'Firefox ' + version.split('.')[0];
  } else if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/([\d.]+)/)?.[1] || '';
    browser = 'Edge ' + version.split('.')[0];
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    const version = ua.match(/Chrome\/([\d.]+)/)?.[1] || '';
    browser = 'Chrome ' + version.split('.')[0];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    const version = ua.match(/Version\/([\d.]+)/)?.[1] || '';
    browser = 'Safari ' + version.split('.')[0];
  }

  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
    os = 'macOS ' + ver;
  } else if (ua.includes('Android')) {
    os = 'Android ' + (ua.match(/Android ([\d.]+)/)?.[1] || '');
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const ver = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
    os = 'iOS ' + ver;
  } else if (ua.includes('Linux')) os = 'Linux';

  const isMobile = /Mobi|Android|iPhone|iPad/.test(ua);

  return {
    browser,
    os,
    device_type: isMobile ? 'Mobile' : 'Desktop',
    screen: screen.width + 'x' + screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
