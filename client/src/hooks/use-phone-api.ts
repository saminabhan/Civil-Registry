import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/api-config";

// الـ API الأصلي (الطلبات تمر عبر البروكسي لتجنب CORS)
const PHONE_API_URL = "https://e-gaza.com/api";
const PHONE_API_TOKEN_KEY = "phone_api_token";

// Base URL for phone API proxy (avoids CORS; backend forwards to e-gaza.com)
function getPhoneProxyUrl(path: string) {
  return `${getApiBaseUrl()}/phone-proxy${path}`;
}

function getAppAuthHeaders(): HeadersInit {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// Get or set token from localStorage
export function getPhoneApiToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem(PHONE_API_TOKEN_KEY) : null;
}

export function setPhoneApiToken(token: string): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(PHONE_API_TOKEN_KEY, token);
}

// Login to phone API via our proxy (e-gaza.com)
export async function loginToPhoneAPI(username: string, password: string): Promise<string> {
  const response = await fetch(getPhoneProxyUrl("/login"), {
    method: "POST",
    headers: getAppAuthHeaders(),
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`فشل تسجيل الدخول إلى API الهاتف: ${response.status} ${errorText}`);
  }

  let data: any;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (text && text.trim()) {
      setPhoneApiToken(text.trim());
      return text.trim();
    }
    throw new Error("استجابة غير صحيحة من API");
  }

  const token =
    data.token ?? data.access_token ?? data.data?.token ?? data.accessToken ?? data.data;
  if (!token || typeof token !== "string") {
    console.error("Unexpected API response structure:", data);
    throw new Error("لم يتم استلام token من API");
  }

  setPhoneApiToken(token);
  return token;
}

// Type for phone API response data
export interface PhoneApiData {
  mobile: string | null;
  city: string | null;
  area: string | null;
  governorate: string | null;
}

// Fetch phone number and location data by national ID (via proxy)
export async function fetchPhoneByNationalId(
  nationalId: string,
  signal?: AbortSignal
): Promise<PhoneApiData> {
  let token = getPhoneApiToken();

  if (!token) {
    const username = "moi2";
    const password = "moi1234455123";
    try {
      token = await loginToPhoneAPI(username, password);
    } catch (error) {
      throw new Error("فشل تسجيل الدخول. يرجى المحاولة لاحقاً");
    }
  }

  const doFetch = async (authToken: string) => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000);
    const requestSignal = signal ?? new AbortController().signal;
    const combined = new AbortController();
    requestSignal.addEventListener("abort", () => combined.abort());
    timeoutController.signal.addEventListener("abort", () => combined.abort());

    const headers: HeadersInit = {
      ...getAppAuthHeaders(),
      "X-Phone-API-Token": authToken,
    };
    delete (headers as Record<string, string>)["Content-Type"];

    const res = await fetch(getPhoneProxyUrl(`/fetch-by-id/${nationalId}`), {
      method: "GET",
      headers,
      credentials: "include",
      signal: combined.signal,
    });
    clearTimeout(timeoutId);
    return res;
  };

  try {
    let response = await doFetch(token);

    if (response.status === 401) {
      token = await loginToPhoneAPI("moi2", "moi1234455123");
      response = await doFetch(token);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(errText || "فشل جلب البيانات");
    }

    const data = await response.json().catch(() => ({}));
    return extractPhoneData(data);
  } catch (error: any) {
    if (error.name === "AbortError" || signal?.aborted) {
      throw new Error("تم إلغاء الطلب");
    }
    console.error("Error fetching phone data:", error);
    throw error;
  }
}

// Extract phone and location data from API response (handles various shapes)
function extractPhoneData(data: any): PhoneApiData {
  const result: PhoneApiData = {
    mobile: null,
    city: null,
    area: null,
    governorate: null,
  };

  if (!data || typeof data !== "object") return result;

  const dataObj = data.data ?? data;
  if (!dataObj || typeof dataObj !== "object") return result;

  const str = (v: unknown): string | null =>
    v != null && String(v).trim() !== "" ? String(v).trim() : null;

  result.mobile =
    str(dataObj.mobile) ??
    str(dataObj.phone) ??
    str(dataObj.Phone) ??
    str(dataObj.Mobile) ??
    str(dataObj.tel) ??
    null;
  result.city = str(dataObj.city) ?? str(dataObj.City) ?? null;
  result.area = str(dataObj.area) ?? str(dataObj.Area) ?? null;
  result.governorate =
    str(dataObj.governorate) ?? str(dataObj.Governorate) ?? str(dataObj.governorate_name) ?? null;

  return result;
}

// Store abort controllers globally to manage them across component re-renders
const activeRequests = new Map<string, AbortController>();

// Hook to use phone API
export function usePhoneAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPhoneData = async (nationalId: string): Promise<PhoneApiData> => {
    // Cancel any existing request for this nationalId
    const existingController = activeRequests.get(nationalId);
    if (existingController && !existingController.signal.aborted) {
      existingController.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    activeRequests.set(nationalId, abortController);
    
    setIsLoading(true);
    try {
      const data = await fetchPhoneByNationalId(nationalId, abortController.signal);
      
      // Remove controller on success (only if it's still the same request)
      if (activeRequests.get(nationalId) === abortController) {
        activeRequests.delete(nationalId);
      }
      
      return data;
    } catch (error: any) {
      // Remove controller on error (only if it's still the same request)
      if (activeRequests.get(nationalId) === abortController) {
        activeRequests.delete(nationalId);
      }
      
      // Don't show error toast for aborted requests or timeout
      if (error.message !== "تم إلغاء الطلب" && error.name !== 'AbortError') {
        toast({
          variant: "destructive",
          title: "خطأ في جلب البيانات",
          description: error.message || "حدث خطأ أثناء جلب البيانات",
        });
      }
      return {
        mobile: null,
        city: null,
        area: null,
        governorate: null,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchPhoneData,
    isLoading,
  };
}

