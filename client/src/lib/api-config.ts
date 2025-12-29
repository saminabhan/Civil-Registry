// API Configuration - automatically detects environment
export function getApiBaseUrl(): string {
  // Check if running on production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const origin = window.location.origin;
    
    // Production domain - check for infinet.ps in hostname
    if (hostname === 'civil.infinet.ps' || hostname.endsWith('.infinet.ps')) {
      const apiUrl = `${origin}/api`;
      console.log('[API Config] Using production API:', apiUrl);
      return apiUrl;
    }
    
    // If we're on HTTPS, use the same origin for API
    if (protocol === 'https:') {
      const apiUrl = `${origin}/api`;
      console.log('[API Config] Using HTTPS API (same origin):', apiUrl);
      return apiUrl;
    }
    
    // Localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API Config] Using localhost API:', 'http://127.0.0.1:8000/api');
      return 'http://127.0.0.1:8000/api';
    }
  }
  
  // Default to localhost for development
  console.log('[API Config] Using default localhost API:', 'http://127.0.0.1:8000/api');
  return 'http://127.0.0.1:8000/api';
}

// Export as function to ensure it's called dynamically
export const API_BASE_URL = getApiBaseUrl();

