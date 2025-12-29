// API Configuration - automatically detects environment
export function getApiBaseUrl(): string {
  // Check if running on production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Production domain
    if (hostname === 'civil.infinet.ps' || hostname.includes('infinet.ps')) {
      return 'https://civil.infinet.ps/api';
    }
    
    // Localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
  }
  
  // Default to localhost for development
  return 'http://127.0.0.1:8000/api';
}

// Export as function to ensure it's called dynamically
export const API_BASE_URL = getApiBaseUrl();

