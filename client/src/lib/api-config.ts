/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - أي hostname آخر → http://civil.idap.aiocp.org/api
 */
export function getApiBaseUrl(): string {
    // دائماً نعتمد على window.location.hostname في وقت التشغيل
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
      const hostname = window.location.hostname.toLowerCase().trim();
      
      // إذا كان localhost أو 127.0.0.1 فقط، استخدم localhost
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://127.0.0.1:8000/api";
      }
      
      // أي hostname آخر (بما في ذلك civil.infinet.ps) → استخدم الإنتاج
      return "http://civil.idap.aiocp.org/api";
    }
  
    // Fallback: إذا لم يكن window متاحاً، استخدم الإنتاج كافتراضي
    return "http://civil.idap.aiocp.org/api";
  }
  
  // تصدير getter function للاستخدام الديناميكي
  export const API_BASE_URL = () => getApiBaseUrl();
  
  