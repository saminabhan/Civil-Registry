import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCitizen } from "@shared/routes";
import axios from "axios";
import apiClient from "@/lib/axios";

const EXTERNAL_API_BASE_URL = "https://dgapi.eservice.aiocp.org/api";
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Normalize Arabic characters - convert all forms of Alef (أ، إ، آ، ا) to ا
function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  
  const textStr = String(text).trim();
  if (!textStr) return '';
  

}

// API Response Types
interface ExternalCitizenData {
  ID: number;
  FNAME: string;
  SNAME: string;
  TNAME: string;
  LNAME: string;
  FULL_NAME: string;
  SEX: string;
  GENDER: number;
  BDATE: string;
  AGE: number;
  SOCIALST: string;
  SOCIAL_STATUS: number;
  F_ID: number | null;
  M_ID: string;
  REGION: string;
  CITY: string;
  MO_ID: number;
}

interface ExternalApiResponse {
  Success: boolean;
  Message: string;
  ErrorCode: number;
  Data: ExternalCitizenData | ExternalCitizenData[];
  ErrorDetail: any;
}

// Convert external API data to internal format
function convertExternalCitizen(data: ExternalCitizenData) {
  // Remove time from date (format: "9/6/2003 0:00:00" -> "9/6/2003")
  let dateOnly = null;
  let dobISO = null;
  
  if (data.BDATE) {
    dateOnly = data.BDATE.split(' ')[0]; // "9/6/2003"
    
    // Convert date from "M/D/YYYY" to ISO format safely
    try {
      const dateParts = dateOnly.split('/');
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[0], 10);
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        
        // Create date object (month is 0-indexed in JS Date)
        const dateObj = new Date(year, month - 1, day);
        
        // Check if date is valid
        if (!isNaN(dateObj.getTime())) {
          dobISO = dateObj.toISOString();
        }
      }
    } catch (error) {
      // If date conversion fails, just keep the text version
      // Silently handle date conversion errors
    }
  }
  
  return {
    id: data.ID,
    nationalId: data.ID.toString(),
    firstName: data.FNAME,
    fatherName: data.SNAME,
    grandfatherName: data.TNAME,
    lastName: data.LNAME,
    fullName: data.FULL_NAME,
    gender: data.SEX === "ذكر" ? "male" : "female",
    genderText: data.SEX,
    dob: dobISO,
    dobText: dateOnly,
    age: data.AGE,
    socialStatus: data.SOCIALST,
    socialStatusCode: data.SOCIAL_STATUS,
    fatherId: data.F_ID,
    motherId: data.M_ID,
    region: data.REGION,
    city: data.CITY,
    motherIdNumber: data.MO_ID,
    address: `${data.CITY}, ${data.REGION}`,
    motherName: null, // Not available in API
  };
}

export function useGetCitizens() {
  return useQuery({
    queryKey: [api.citizens.list.path],
    queryFn: async () => {
      const response = await axios.get(api.citizens.list.path);
      return api.citizens.list.responses[200].parse(response.data);
    },
  });
}

export function useSearchCitizens(params?: Record<string, any>) {
  const hasNationalId = params?.nationalId && String(params.nationalId).trim().length > 0;
  const hasFirstName = params?.firstName && String(params.firstName).trim().length > 0;
  const hasLastName = params?.lastName && String(params.lastName).trim().length > 0;
  
  // For name search, at least firstName and lastName are required
  const isNameSearchValid = hasFirstName && hasLastName;
  const isEnabled = hasNationalId || isNameSearchValid;

  return useQuery<{ citizens: any[]; message: string; count: number }>({
    queryKey: ["external-citizens-search", params],
    queryFn: async () => {
      if (!isEnabled) return { citizens: [], message: "", count: 0 };

      let response: ExternalApiResponse;

      if (hasNationalId) {
        // Search by ID
        try {
          const id = String(params.nationalId).trim();
          const apiResponse = await axios.get<ExternalApiResponse>(
            `${EXTERNAL_API_BASE_URL}/Users/by-id/${id}`
          );
          response = apiResponse.data;
          
          if (!response.Success) {
            return { citizens: [], message: response.Message || "فشل البحث", count: 0 };
          }
          
          if (!response.Data) {
            return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
          }
          
          // Convert single object to array - always ensure it's an array
          const data = Array.isArray(response.Data) ? response.Data : [response.Data];
          const citizens = data.map(convertExternalCitizen);
          
          // Log search action to audit logs with actual search value
          try {
            await apiClient.post(api.logs.create.path, {
              action: "SEARCH",
              details: `Search by id: ${JSON.stringify({ nationalId: id })}`
            });
          } catch (logError) {
            // Silently fail logging - don't break the search
          }
          
          return {
            citizens,
            message: response.Message || "",
            count: citizens.length
          };
        } catch (error: any) {
          // Handle different types of errors
          let errorMessage = "حدث خطأ أثناء البحث";
          
          if (error?.response?.data) {
            // API returned an error response
            if (error.response.data.Message) {
              errorMessage = error.response.data.Message;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            }
          } else if (error?.message) {
            // Network or other error
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }
      } else {
        // Search by name
        const queryParams: Record<string, string> = {};
        
        // Normalize and add firstName - use original if normalization fails
        if (hasFirstName) {
          const original = String(params.firstName).trim();
          const normalized = normalizeArabic(original);
          queryParams.firstName = normalized || original; // Fallback to original if normalized is empty
        }
        
        // Normalize and add lastName - use original if normalization fails
        if (hasLastName) {
          const original = String(params.lastName).trim();
          const normalized = normalizeArabic(original);
          queryParams.lastName = normalized || original; // Fallback to original if normalized is empty
        }
        
        // Normalize and add grandfatherName if provided
        if (params?.grandfatherName) {
          const original = String(params.grandfatherName).trim();
          if (original.length > 0) {
            const normalized = normalizeArabic(original);
            if (normalized) {
              queryParams.grandFatherName = normalized;
            }
          }
        }
        
        // Normalize and add fatherName if provided
        if (params?.fatherName) {
          const original = String(params.fatherName).trim();
          if (original.length > 0) {
            const normalized = normalizeArabic(original);
            if (normalized) {
              queryParams.fatherName = normalized;
            }
          }
        }

        try {
          // Validate that we have at least firstName and lastName
          if (!queryParams.firstName || !queryParams.lastName) {
            throw new Error("يجب إدخال الاسم الأول واسم العائلة على الأقل");
          }
          
          // Build URL with query parameters manually to ensure proper encoding
          const url = new URL(`${EXTERNAL_API_BASE_URL}/Users/by-name`);
          Object.entries(queryParams).forEach(([key, value]) => {
            if (value && value.trim().length > 0) {
              url.searchParams.append(key, value);
            }
          });
          
          const apiResponse = await axios.get<ExternalApiResponse>(url.toString(), {
            timeout: 30000, // 30 seconds timeout
          });
          response = apiResponse.data;
          
          // Check if response is successful
          if (!response.Success) {
            throw new Error(response.Message || "فشل البحث");
          }
          
          // Check if Data exists and is not empty
          if (!response.Data) {
            return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
          }
          
          // Data is always an array for name search, but ensure it's an array
          const dataArray = Array.isArray(response.Data) ? response.Data : [response.Data];
          
          // Check if array is empty
          if (dataArray.length === 0) {
            return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
          }
          
          // Convert data safely, catching any conversion errors
          const citizens = dataArray
            .map((item) => {
              try {
                return convertExternalCitizen(item);
              } catch (error) {
                // Return null for failed conversions, we'll filter them out
                return null;
              }
            })
            .filter((citizen) => citizen !== null) as any[];
          
          // Log search action to audit logs with actual search values
          try {
            // Build search params object for logging with original values (before normalization)
            const searchParams: Record<string, string> = {};
            if (hasFirstName) searchParams.firstName = String(params.firstName).trim();
            if (hasLastName) searchParams.lastName = String(params.lastName).trim();
            if (params?.grandfatherName && String(params.grandfatherName).trim().length > 0) {
              searchParams.grandfatherName = String(params.grandfatherName).trim();
            }
            if (params?.fatherName && String(params.fatherName).trim().length > 0) {
              searchParams.fatherName = String(params.fatherName).trim();
            }
            
            await apiClient.post(api.logs.create.path, {
              action: "SEARCH",
              details: `Search by name: ${JSON.stringify(searchParams)}`
            });
          } catch (logError) {
            // Silently fail logging - don't break the search
          }
          
          return {
            citizens,
            message: response.Message || "",
            count: citizens.length
          };
        } catch (error: any) {
          // Handle different types of errors
          let errorMessage = "حدث خطأ أثناء البحث";
          
          if (error?.response?.data) {
            // API returned an error response
            if (error.response.data.Message) {
              errorMessage = error.response.data.Message;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            }
          } else if (error?.message) {
            // Network or other error
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }
      }
    },
    enabled: !!isEnabled,
  });
}

export function useCreateCitizen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCitizen) => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}${api.citizens.create.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل إنشاء السجل");
      return api.citizens.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate search queries potentially
      queryClient.invalidateQueries({ queryKey: [api.citizens.search.path] });
    }
  });
}
