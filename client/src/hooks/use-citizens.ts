import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCitizen } from "@shared/routes";
import axios from "axios";
import apiClient from "@/lib/axios";
import { getApiBaseUrl } from "@/lib/api-config";

const EXTERNAL_API_BASE_URL = "https://dgapi.eservice.aiocp.org/api";

// Normalize Arabic characters - convert all forms of Alef (أ، إ، آ، ا) to ا
function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';
  
  const textStr = String(text).trim();
  if (!textStr) return '';
  
  return textStr;
}

// API Response Types
interface ExternalCitizenData {
  CI_ID_NUM: number;
  CI_FIRST_ARB: string;
  CI_FATHER_ARB: string;
  CI_GRAND_FATHER_ARB: string;
  CI_FAMILY_ARB: string;
  CI_MOTHER_ARB: string;
  FULL_NAME: string;
  CI_BIRTH_DT: string;
  CI_SEX_CD: number;
  CI_SEX_CD_NAME: string;
  CI_PERSONAL_CD: number;
  CI_PERSONAL_CD_NAME: string;
  CI_RELIGION_CD: number;
  CI_RELIGION_CD_NAME: string;
  CI_REGION_CD: number;
  CI_REGION_CD_NAME: string;
  CI_CITY_CD: number;
  CI_QUARTER: number;
  CI_HOUSE_NO: number;
  CI_STREET_ARB: string;
  CI_DEAD_DT: string | null;
  CI_DEAD_DT_NAME: string;
}

interface ExternalApiResponse {
  Success: boolean;
  Message: string;
  ErrorCode: number;
  Data: ExternalCitizenData | ExternalCitizenData[];
  ErrorDetail: any;
}

// API Response Types for 2023 Registry
interface ExternalCitizenData2023 {
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
  F_ID: number;
  M_ID: string | number;
  REGION: string;
  CITY: string;
  MO_ID: number;
}

interface ExternalApiResponse2023 {
  Success: boolean;
  Message: string;
  ErrorCode: number;
  Data: ExternalCitizenData2023 | ExternalCitizenData2023[];
  ErrorDetail: any;
}

// Calculate age from birth date (and death date if provided)
function calculateAge(birthDate: string, deathDate: string | null = null): number {
  if (!birthDate) return 0;
  
  try {
    // Parse birth date from "YYYY-MM-DD HH:mm:ss" format
    const birthDateStr = birthDate.split(' ')[0]; // "1989-10-25"
    const birthDateParts = birthDateStr.split('-');
    
    if (birthDateParts.length === 3) {
      const birthYear = parseInt(birthDateParts[0], 10);
      const birthMonth = parseInt(birthDateParts[1], 10) - 1; // JS Date months are 0-indexed
      const birthDay = parseInt(birthDateParts[2], 10);
      
      const birthDateObj = new Date(birthYear, birthMonth, birthDay);
      
      // Use death date if provided, otherwise use today
      let endDate: Date;
      if (deathDate) {
        const deathDateStr = deathDate.split(' ')[0];
        const deathDateParts = deathDateStr.split('-');
        if (deathDateParts.length === 3) {
          const deathYear = parseInt(deathDateParts[0], 10);
          const deathMonth = parseInt(deathDateParts[1], 10) - 1;
          const deathDay = parseInt(deathDateParts[2], 10);
          endDate = new Date(deathYear, deathMonth, deathDay);
        } else {
          endDate = new Date();
        }
      } else {
        endDate = new Date();
      }
      
      if (!isNaN(birthDateObj.getTime()) && !isNaN(endDate.getTime())) {
        let age = endDate.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = endDate.getMonth() - birthDateObj.getMonth();
        
        // If birthday hasn't occurred this year yet, subtract one year
        if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDateObj.getDate())) {
          age--;
        }
        
        return age;
      }
    }
  } catch (error) {
    // If calculation fails, return 0
  }
  
  return 0;
}

// Convert external API data to internal format
function convertExternalCitizen(data: ExternalCitizenData) {
  // Remove time from date (format: "1989-10-25 00:00:00" -> "1989-10-25")
  let dateOnly = null;
  let dobISO = null;
  
  if (data.CI_BIRTH_DT) {
    dateOnly = data.CI_BIRTH_DT.split(' ')[0]; // "1989-10-25"
    
    // Convert date from "YYYY-MM-DD" to ISO format safely
    try {
      const dateParts = dateOnly.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // JS Date months are 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        // Create date object
        const dateObj = new Date(year, month, day);
        
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
  
  // Process death date
  let deathDateOnly = null;
  let deathDateISO = null;
  const isDead = data.CI_DEAD_DT !== null && data.CI_DEAD_DT !== undefined && data.CI_DEAD_DT !== '';
  
  if (isDead && data.CI_DEAD_DT) {
    deathDateOnly = data.CI_DEAD_DT.split(' ')[0]; // "2003-06-09"
    
    // Convert death date to ISO format
    try {
      const dateParts = deathDateOnly.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        
        const dateObj = new Date(year, month, day);
        if (!isNaN(dateObj.getTime())) {
          deathDateISO = dateObj.toISOString();
        }
      }
    } catch (error) {
      // Silently handle date conversion errors
    }
  }
  
  // Calculate age - use death date if dead, otherwise use current age
  const age = calculateAge(data.CI_BIRTH_DT, data.CI_DEAD_DT);
  
  // Build address from available fields
  const addressParts: string[] = [];
  if (data.CI_STREET_ARB) addressParts.push(data.CI_STREET_ARB);
  if (data.CI_QUARTER) addressParts.push(`حي ${data.CI_QUARTER}`);
  if (data.CI_HOUSE_NO) addressParts.push(`رقم ${data.CI_HOUSE_NO}`);
  if (data.CI_REGION_CD_NAME) addressParts.push(data.CI_REGION_CD_NAME);
  const address = addressParts.length > 0 ? addressParts.join(', ') : '';
  
  return {
    id: data.CI_ID_NUM,
    nationalId: data.CI_ID_NUM.toString(),
    registryYear: 2019, // Mark as 2019 registry
    firstName: data.CI_FIRST_ARB,
    fatherName: data.CI_FATHER_ARB,
    grandfatherName: data.CI_GRAND_FATHER_ARB,
    lastName: data.CI_FAMILY_ARB,
    fullName: data.FULL_NAME,
    gender: data.CI_SEX_CD_NAME === "ذكر" ? "male" : "female",
    genderText: data.CI_SEX_CD_NAME,
    dob: dobISO,
    dobText: dateOnly,
    age: age,
    socialStatus: data.CI_PERSONAL_CD_NAME,
    socialStatusCode: data.CI_PERSONAL_CD,
    fatherId: null, // Not available in new API
    motherId: null, // Not available in new API
    region: data.CI_REGION_CD_NAME,
    city: null, // CI_CITY_CD is a number, city name not directly available
    motherIdNumber: null, // Not available in new API
    address: address,
    motherName: data.CI_MOTHER_ARB,
    isDead: isDead,
    deathStatus: data.CI_DEAD_DT_NAME || (isDead ? "متوفي" : "حي"),
    deathDate: deathDateISO,
    deathDateText: deathDateOnly,
  };
}

// Calculate age from 2023 date format (M/D/YYYY)
function calculateAgeFrom2023Date(birthDate: string): number {
  if (!birthDate) return 0;
  
  try {
    // Format: "9/6/2003 0:00:00" -> calculate age
    const dateStr = birthDate.split(' ')[0]; // "9/6/2003"
    const dateParts = dateStr.split('/');
    
    if (dateParts.length === 3) {
      const month = parseInt(dateParts[0], 10);
      const day = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);
      
      const birthDateObj = new Date(year, month - 1, day); // month is 0-indexed
      const today = new Date();
      
      if (!isNaN(birthDateObj.getTime())) {
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        
        // If birthday hasn't occurred this year yet, subtract one year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
          age--;
        }
        
        return age;
      }
    }
  } catch (error) {
    // If calculation fails, return 0
  }
  
  return 0;
}

// Convert 2023 API data to internal format
function convertExternalCitizen2023(data: ExternalCitizenData2023) {
  // Parse birth date from "9/6/2003 0:00:00" format
  let dateOnly = null;
  let dobISO = null;
  
  if (data.BDATE) {
    try {
      // Format: "9/6/2003 0:00:00" -> "2003-06-09"
      // Note: Format is M/D/YYYY (month/day/year)
      const dateStr = data.BDATE.split(' ')[0]; // "9/6/2003"
      const dateParts = dateStr.split('/');
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[0], 10);
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        
        // Format as YYYY-MM-DD
        dateOnly = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Convert to ISO (month is 0-indexed in JS Date)
        const dateObj = new Date(year, month - 1, day);
        if (!isNaN(dateObj.getTime())) {
          dobISO = dateObj.toISOString();
        }
      }
    } catch (error) {
      // Silently handle date conversion errors
    }
  }
  
  // Calculate age from birth date instead of using API value
  const calculatedAge = calculateAgeFrom2023Date(data.BDATE);
  
  return {
    id: data.ID,
    nationalId: data.ID.toString(),
    registryYear: 2023, // Mark as 2023 registry
    firstName: data.FNAME,
    fatherName: data.SNAME,
    grandfatherName: data.TNAME,
    lastName: data.LNAME,
    fullName: data.FULL_NAME,
    gender: data.SEX === "ذكر" ? "male" : "female",
    genderText: data.SEX,
    dob: dobISO,
    dobText: dateOnly,
    age: calculatedAge, // Use calculated age instead of data.AGE
    socialStatus: data.SOCIALST,
    socialStatusCode: data.SOCIAL_STATUS,
    fatherId: data.F_ID,
    motherId: data.M_ID?.toString(),
    region: data.REGION,
    city: data.CITY,
    motherIdNumber: data.MO_ID?.toString(),
    address: null,
    motherName: null,
    isDead: false, // 2023 registry doesn't have death information
    deathStatus: "حي", // Always alive in 2023 registry
    deathDate: null,
    deathDateText: null,
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
  const registryYear = params?.registryYear || 2019; // Default to 2019
  
  // For name search, at least firstName and lastName are required
  const isNameSearchValid = hasFirstName && hasLastName;
  const isEnabled = hasNationalId || isNameSearchValid;

  return useQuery<{ citizens: any[]; message: string; count: number }>({
    queryKey: ["external-citizens-search", params],
    queryFn: async () => {
      if (!isEnabled) return { citizens: [], message: "", count: 0 };

      // Use 2023 API if registryYear is 2023
      if (registryYear === 2023) {
        return await searchCitizens2023(params, hasNationalId, hasFirstName, hasLastName);
      }

      // Otherwise use 2019 API
      let response: ExternalApiResponse;

      if (hasNationalId) {
        // Search by ID - 2019
        try {
          const id = String(params.nationalId).trim();
          const apiResponse = await axios.get<ExternalApiResponse>(
            `${EXTERNAL_API_BASE_URL}/Users/by-id2019/${id}`
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
          
          // Build URL with query parameters manually to ensure proper encoding - 2019
          const url = new URL(`${EXTERNAL_API_BASE_URL}/Users/by-name2019`);
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

// Search citizens in 2023 registry
async function searchCitizens2023(
  params: Record<string, any>,
  hasNationalId: boolean,
  hasFirstName: boolean,
  hasLastName: boolean
): Promise<{ citizens: any[]; message: string; count: number }> {
  try {
    if (hasNationalId) {
      // Search by ID - 2023
      const id = String(params.nationalId).trim();
      const apiResponse = await axios.get<ExternalApiResponse2023>(
        `${EXTERNAL_API_BASE_URL}/Users/by-id/${id}`
      );
      const response = apiResponse.data;
      
      if (!response.Success) {
        return { citizens: [], message: response.Message || "فشل البحث", count: 0 };
      }
      
      if (!response.Data) {
        return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
      }
      
      // Convert single object to array
      const data = Array.isArray(response.Data) ? response.Data : [response.Data];
      const citizens = data.map(convertExternalCitizen2023);
      
      // Log search action
      try {
        await apiClient.post(api.logs.create.path, {
          action: "SEARCH",
          details: `Search by id (2023): ${JSON.stringify({ nationalId: id })}`
        });
      } catch (logError) {
        // Silently fail logging
      }
      
      return {
        citizens,
        message: response.Message || "",
        count: citizens.length
      };
    } else {
      // Search by name - 2023
      // API 2023 expects firstName and lastName (not FNAME, LNAME) based on error message
      const queryParams: Record<string, string> = {};
      
      if (hasFirstName) {
        queryParams.firstName = String(params.firstName).trim();
      }
      if (hasLastName) {
        queryParams.lastName = String(params.lastName).trim();
      }
      if (params?.fatherName) {
        const original = String(params.fatherName).trim();
        if (original.length > 0) {
          queryParams.fatherName = original;
        }
      }
      if (params?.grandfatherName) {
        const original = String(params.grandfatherName).trim();
        if (original.length > 0) {
          queryParams.grandfatherName = original;
        }
      }
      
      // Validate that we have at least firstName and lastName
      if (!queryParams.firstName || !queryParams.lastName) {
        throw new Error("يجب إدخال الاسم الأول واسم العائلة على الأقل");
      }
      
      // Build URL with query parameters - API 2023 uses GET method
      const url = new URL(`${EXTERNAL_API_BASE_URL}/Users/by-name`);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value && value.trim().length > 0) {
          url.searchParams.append(key, value);
        }
      });
      
      const apiResponse = await axios.get<ExternalApiResponse2023>(url.toString(), {
        timeout: 30000,
      });
      const response = apiResponse.data;
      
      if (!response.Success) {
        throw new Error(response.Message || "فشل البحث");
      }
      
      if (!response.Data) {
        return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
      }
      
      // Data is always an array for name search
      const dataArray = Array.isArray(response.Data) ? response.Data : [response.Data];
      
      if (dataArray.length === 0) {
        return { citizens: [], message: response.Message || "لا توجد نتائج", count: 0 };
      }
      
      // Convert data
      const citizens = dataArray
        .map((item) => {
          try {
            return convertExternalCitizen2023(item);
          } catch (error) {
            return null;
          }
        })
        .filter((citizen) => citizen !== null) as any[];
      
      // Log search action
      try {
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
          details: `Search by name (2023): ${JSON.stringify(searchParams)}`
        });
      } catch (logError) {
        // Silently fail logging
      }
      
      return {
        citizens,
        message: response.Message || "",
        count: citizens.length
      };
    }
  } catch (error: any) {
    let errorMessage = "حدث خطأ أثناء البحث";
    
    if (error?.response?.data) {
      if (error.response.data.Message) {
        errorMessage = error.response.data.Message;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
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
      
      const res = await fetch(`${getApiBaseUrl()}${api.citizens.create.path}`, {
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
