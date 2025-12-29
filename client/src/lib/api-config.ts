/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - civil.infinet.ps → http://civil.idap.aiocp.org/api
 * - civil.idap.aiocp.org → http://civil.idap.aiocp.org/api
 */
export function getApiBaseUrl(): string {
  // التحقق من الـ hostname الحالي أولاً (يعمل في المتصفح)
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const hostname = window.location.hostname.toLowerCase();
    
    // إذا كان localhost أو 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const url = "http://127.0.0.1:8000/api";
      console.log("[API Config] Using localhost URL:", url);
      return url;
    }
    
    // إذا كان civil.infinet.ps أو civil.idap.aiocp.org
    if (hostname === "civil.infinet.ps" || hostname === "civil.idap.aiocp.org") {
      const url = "http://civil.idap.aiocp.org/api";
      console.log("[API Config] Using production URL:", url, "for hostname:", hostname);
      return url;
    }
    
    // إذا كان أي hostname آخر في الإنتاج، استخدم الإنتاج
    const url = "http://civil.idap.aiocp.org/api";
    console.log("[API Config] Using default production URL:", url, "for hostname:", hostname);
    return url;
  }

  // في حالة التطوير المحلي (عند البناء فقط)
  if (import.meta.env.MODE === "development") {
    const url = "http://127.0.0.1:8000/api";
    console.log("[API Config] Using development URL:", url);
    return url;
  }

  // القيمة الافتراضية للإنتاج
  const url = "http://civil.idap.aiocp.org/api";
  console.log("[API Config] Using fallback production URL:", url);
  return url;
}

// تصدير getter function للاستخدام الديناميكي
export const API_BASE_URL = () => getApiBaseUrl();

