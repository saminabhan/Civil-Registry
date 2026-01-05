import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PHONE_API_URL = "https://e-gaza.com/api";
const PHONE_API_TOKEN_KEY = "phone_api_token";

// Get or set token from localStorage
export function getPhoneApiToken(): string | null {
  return localStorage.getItem(PHONE_API_TOKEN_KEY);
}

export function setPhoneApiToken(token: string): void {
  localStorage.setItem(PHONE_API_TOKEN_KEY, token);
}

// Login to phone API
export async function loginToPhoneAPI(username: string, password: string): Promise<string> {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${PHONE_API_URL}/login`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`فشل تسجيل الدخول إلى API الهاتف: ${response.status} ${errorText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    // If response is not JSON, try to get token from response text
    const text = await response.text();
    if (text) {
      setPhoneApiToken(text.trim());
      return text.trim();
    }
    throw new Error("استجابة غير صحيحة من API");
  }
  
  // Extract token from response (adjust based on actual response structure)
  const token = data.token || data.access_token || data.data?.token || data.accessToken;
  
  if (!token) {
    // Log the response for debugging
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

// Fetch phone number and location data by national ID
export async function fetchPhoneByNationalId(
  nationalId: string, 
  signal?: AbortSignal
): Promise<PhoneApiData> {
  let token = getPhoneApiToken();

  // If no token, try to login first
  if (!token) {
    // You might want to get these from environment variables or config
    const username = "moi2"; // Default username from Postman
    const password = "moi1234455123"; // Default password from Postman
    
    try {
      token = await loginToPhoneAPI(username, password);
    } catch (error) {
      throw new Error("فشل تسجيل الدخول. يرجى المحاولة لاحقاً");
    }
  }

  try {
    // Create timeout controller (15 seconds timeout)
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 15000);
    
    // Use provided signal or create a new one, combine with timeout
    const requestSignal = signal || new AbortController().signal;
    const combinedController = new AbortController();
    
    // Listen to both signals
    requestSignal.addEventListener('abort', () => combinedController.abort());
    timeoutController.signal.addEventListener('abort', () => combinedController.abort());

    const response = await fetch(`${PHONE_API_URL}/fetch-by-id/${nationalId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      signal: combinedController.signal,
    });
    
    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Token expired, try to login again
      const username = "moi2";
      const password = "moi1234455123";
      token = await loginToPhoneAPI(username, password);
      
      // Retry the request with timeout
      const retryTimeoutController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryTimeoutController.abort(), 15000);
      
      const retryRequestSignal = signal || new AbortController().signal;
      const retryCombinedController = new AbortController();
      
      retryRequestSignal.addEventListener('abort', () => retryCombinedController.abort());
      retryTimeoutController.signal.addEventListener('abort', () => retryCombinedController.abort());
      
      const retryResponse = await fetch(`${PHONE_API_URL}/fetch-by-id/${nationalId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        signal: retryCombinedController.signal,
      });
      
      clearTimeout(retryTimeoutId);

      if (!retryResponse.ok) {
        throw new Error("فشل جلب رقم الهاتف");
      }

      const retryData = await retryResponse.json();
      return extractPhoneData(retryData);
    }

    if (!response.ok) {
      throw new Error("فشل جلب البيانات");
    }

    const data = await response.json();
    return extractPhoneData(data);
  } catch (error: any) {
    // Handle abort errors gracefully
    if (error.name === 'AbortError' || signal?.aborted) {
      throw new Error("تم إلغاء الطلب");
    }
    console.error("Error fetching phone data:", error);
    throw error;
  }
}

// Extract phone and location data from API response
function extractPhoneData(data: any): PhoneApiData {
  const result: PhoneApiData = {
    mobile: null,
    city: null,
    area: null,
    governorate: null,
  };

  // Check if data has the expected structure: { status, code, message, data: { mobile, city, area, governorate } }
  if (data && typeof data === "object") {
    // Try direct data object first
    let dataObj = data.data || data;
    
    if (dataObj && typeof dataObj === "object") {
      if (dataObj.mobile) result.mobile = String(dataObj.mobile).trim() || null;
      if (dataObj.city) result.city = String(dataObj.city).trim() || null;
      if (dataObj.area) result.area = String(dataObj.area).trim() || null;
      if (dataObj.governorate) result.governorate = String(dataObj.governorate).trim() || null;
    }
  }

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

