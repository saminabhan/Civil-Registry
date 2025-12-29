/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - civil.infinet.ps → http://civil.idap.aiocp.org/api
 * - civil.idap.aiocp.org → http://civil.idap.aiocp.org/api
 */
export function getApiBaseUrl(): string {
  // دائماً نعتمد على window.location.hostname في وقت التشغيل
  if (typeof window !== "undefined" && window.location) {
    const hostname = (window.location.hostname || "").toLowerCase();
    const origin = window.location.origin || "";
    
    console.log("[API Config] Current hostname:", hostname, "Origin:", origin);
    
    // إذا كان localhost أو 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "") {
      const url = "http://127.0.0.1:8000/api";
      console.log("[API Config] Using localhost URL:", url);
      return url;
    }
    
    // إذا كان civil.infinet.ps أو civil.idap.aiocp.org
    if (hostname === "civil.infinet.ps" || hostname === "civil.idap.aiocp.org" || hostname.includes("infinet.ps") || hostname.includes("idap.aiocp.org")) {
      const url = "http://civil.idap.aiocp.org/api";
      console.log("[API Config] Using production URL:", url, "for hostname:", hostname);
      return url;
    }
    
    // إذا كان أي hostname آخر (ليس localhost)، استخدم الإنتاج
    const url = "http://civil.idap.aiocp.org/api";
    console.log("[API Config] Using default production URL:", url, "for hostname:", hostname);
    return url;
  }

  // Fallback: إذا لم يكن window متاحاً (SSR أو وقت البناء)
  // في الإنتاج، نستخدم الإنتاج كقيمة افتراضية
  const url = "http://civil.idap.aiocp.org/api";
  console.warn("[API Config] Window not available, using fallback production URL:", url);
  return url;
}

// تصدير getter function للاستخدام الديناميكي
export const API_BASE_URL = () => getApiBaseUrl();

