/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - civil.infinet.ps → http://civil.idap.aiocp.org/api
 * - civil.idap.aiocp.org → http://civil.idap.aiocp.org/api
 */
export function getApiBaseUrl(): string {
  // التحقق من الـ hostname الحالي أولاً (يعمل في المتصفح)
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    
    // إذا كان localhost أو 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000/api";
    }
    
    // إذا كان civil.infinet.ps أو civil.idap.aiocp.org
    if (hostname === "civil.infinet.ps" || hostname === "civil.idap.aiocp.org") {
      return "http://civil.idap.aiocp.org/api";
    }
  }

  // في حالة التطوير المحلي (عند البناء فقط)
  if (import.meta.env.MODE === "development") {
    return "http://127.0.0.1:8000/api";
  }

  // القيمة الافتراضية للإنتاج
  return "http://civil.idap.aiocp.org/api";
}

// تصدير getter function للاستخدام الديناميكي
export const API_BASE_URL = () => getApiBaseUrl();

