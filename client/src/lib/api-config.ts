/**
 * تحديد API Base URL بناءً على الـ hostname الحالي
 * يدعم:
 * - localhost / 127.0.0.1 → http://127.0.0.1:8000/api
 * - civil.infinet.ps → http://civil.idap.aiocp.org/api
 * - civil.idap.aiocp.org → http://civil.idap.aiocp.org/api
 */
export function getApiBaseUrl(): string {
  // دائماً نعتمد على window.location.hostname في وقت التشغيل
  try {
    if (typeof window !== "undefined" && window.location) {
      const hostname = (window.location.hostname || "").toLowerCase().trim();
      const origin = (window.location.origin || "").toLowerCase();
      
      console.log("[API Config] Detected - hostname:", hostname, "origin:", origin);
      
      // إذا كان localhost أو 127.0.0.1 أو فارغ
      if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
        const url = "http://127.0.0.1:8000/api";
        console.log("[API Config] ✅ Using LOCALHOST URL:", url);
        return url;
      }
      
      // إذا كان civil.infinet.ps أو civil.idap.aiocp.org أو يحتوي على هذه النطاقات
      if (
        hostname === "civil.infinet.ps" || 
        hostname === "civil.idap.aiocp.org" || 
        hostname.includes("infinet.ps") || 
        hostname.includes("idap.aiocp.org") ||
        origin.includes("civil.infinet.ps") ||
        origin.includes("civil.idap.aiocp.org")
      ) {
        const url = "http://civil.idap.aiocp.org/api";
        console.log("[API Config] ✅ Using PRODUCTION URL:", url, "for hostname:", hostname);
        return url;
      }
      
      // إذا كان أي hostname آخر (ليس localhost)، استخدم الإنتاج كافتراضي
      const url = "http://civil.idap.aiocp.org/api";
      console.log("[API Config] ✅ Using DEFAULT PRODUCTION URL:", url, "for hostname:", hostname);
      return url;
    }
  } catch (error) {
    console.error("[API Config] Error getting hostname:", error);
  }

  // Fallback: إذا لم يكن window متاحاً (SSR أو وقت البناء)
  // في الإنتاج، نستخدم الإنتاج كقيمة افتراضية
  const url = "http://civil.idap.aiocp.org/api";
  console.warn("[API Config] ⚠️ Window not available, using fallback production URL:", url);
  return url;
}

// تصدير getter function للاستخدام الديناميكي
export const API_BASE_URL = () => getApiBaseUrl();

