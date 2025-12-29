/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - civil.infinet.ps → https://civil.infinet.ps/api (نفس النطاق)
 * - أي hostname آخر → https://civil.infinet.ps/api
 */
export function getApiBaseUrl(): string {
    // دائماً نعتمد على window.location في وقت التشغيل
    if (typeof window !== "undefined" && window.location) {
      const hostname = window.location.hostname.toLowerCase().trim();
      const protocol = window.location.protocol; // http: أو https:
      
      // إذا كان localhost أو 127.0.0.1 فقط، استخدم localhost
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://127.0.0.1:8000/api";
      }
      
      // لأي hostname آخر (بما في ذلك civil.infinet.ps)، استخدم نفس النطاق مع البروتوكول الحالي
      // هذا يضمن أن API يكون على نفس النطاق مثل Frontend
      return `${protocol}//${hostname}/api`;
    }
  
    // Fallback: إذا لم يكن window متاحاً (SSR)، استخدم الإنتاج كافتراضي
    return "https://civil.infinet.ps/api";
  }
  
  // تصدير getter function للاستخدام الديناميكي
  export const API_BASE_URL = () => getApiBaseUrl();
  
  