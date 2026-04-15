// Security utilities and middleware
import { rateLimiter } from './validation';

// Content Security Policy
export const csp = {
  // Generate CSP header for production
  getHeader: () => {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
    
    return directives;
  }
};

// Security headers for API requests
export const securityHeaders = {
  // Add security headers to fetch requests
  addHeaders: (headers: Headers = new Headers()) => {
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return headers;
  }
};

// CSRF protection implementation
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token';
  private static readonly HEADER_KEY = 'X-CSRF-Token';
  
  // Generate and store CSRF token
  static generateToken(): string {
    const token = this.generateRandomToken();
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }
  
  // Get stored CSRF token
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }
  
  // Validate CSRF token
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }
  
  // Add CSRF token to headers
  static addToHeaders(headers: Headers = new Headers()): Headers {
    const token = this.getToken();
    if (token) {
      headers.set(this.HEADER_KEY, token);
    }
    return headers;
  }
  
  // Validate request CSRF token
  static validateRequest(request: Request): boolean {
    const token = request.headers.get(this.HEADER_KEY);
    return token ? this.validateToken(token) : false;
  }
  
  // Generate random token
  private static generateRandomToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Clear token
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
  
  // Refresh token
  static refreshToken(): string {
    this.clearToken();
    return this.generateToken();
  }
}

// Enhanced fetch with security features
export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Add rate limiting
  const identifier = `${url}:${options.method || 'GET'}`;
  if (!rateLimiter.isAllowed(identifier)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Add security headers
  const headers = securityHeaders.addHeaders(new Headers(options.headers));
  
  // Add CSRF token for state-changing requests
  if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    CSRFProtection.addToHeaders(headers);
  }
  
  // Add content-type if not present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Validate response for security issues
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
    
    throw new Error('Request failed');
  }
};

// Input sanitization for HTML content
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// URL validation and sanitization
export const sanitizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '#';
    }
    
    // Only allow same-origin or whitelisted domains
    const allowedDomains = [
      window.location.hostname,
      'supabase.co',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      return '#';
    }
    
    return parsedUrl.toString();
  } catch {
    return '#';
  }
};

// File upload security
export const secureFileUpload = {
  // Validate file type
  validateFileType: (file: File): boolean => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedTypes.includes(file.type);
  },
  
  // Validate file size (max 5MB)
  validateFileSize: (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  },
  
  // Sanitize filename
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },
  
  // Validate file content
  validateFileContent: async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as ArrayBuffer;
        
        // Basic content validation
        if (content.byteLength === 0) {
          resolve(false);
          return;
        }
        
        // Check for malicious patterns in text files
        if (file.type.startsWith('text/') || file.type === 'application/json') {
          const text = new TextDecoder().decode(content);
          const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /onload=/i,
            /onerror=/i
          ];
          
          const hasMaliciousContent = maliciousPatterns.some(pattern => 
            pattern.test(text)
          );
          
          resolve(!hasMaliciousContent);
        } else {
          resolve(true);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file);
    });
  },
  
  // Complete file validation
  validateFile: async (file: File): Promise<{ valid: boolean; error?: string }> => {
    if (!this.validateFileType(file)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    if (!this.validateFileSize(file)) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }
    
    const contentValid = await this.validateFileContent(file);
    if (!contentValid) {
      return { valid: false, error: 'File content validation failed' };
    }
    
    return { valid: true };
  }
};

// Session security
export const sessionSecurity = {
  // Check session timeout
  checkSessionTimeout: (maxAge: number = 60 * 60 * 1000): boolean => {
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) {
      return false;
    }
    
    const now = Date.now();
    const lastActivityTime = parseInt(lastActivity);
    
    return (now - lastActivityTime) > maxAge;
  },
  
  // Update last activity
  updateLastActivity: (): void => {
    localStorage.setItem('last_activity', Date.now().toString());
  },
  
  // Clear session
  clearSession: (): void => {
    localStorage.removeItem('last_activity');
    sessionStorage.clear();
    CSRFProtection.clearToken();
  },
  
  // Initialize session monitoring
  initSessionMonitoring: (): void => {
    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      sessionSecurity.updateLastActivity();
    };
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check session timeout periodically
    setInterval(() => {
      if (sessionSecurity.checkSessionTimeout()) {
        sessionSecurity.clearSession();
        window.location.href = '/login?reason=session_expired';
      }
    }, 60000); // Check every minute
  }
};

// Password security
export const passwordSecurity = {
  // Check password strength
  checkStrength: (password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } => {
    const feedback: string[] = [];
    let score = 0;
    
    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one uppercase letter');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one lowercase letter');
    }
    
    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one number');
    }
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include at least one special character');
    }
    
    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];
    
    if (commonPatterns.some(pattern => pattern.test(password))) {
      score -= 1;
      feedback.push('Avoid common patterns or dictionary words');
    }
    
    return {
      score: Math.max(0, Math.min(5, score)),
      feedback,
      isStrong: score >= 4
    };
  },
  
  // Generate secure password
  generateSecurePassword: (length: number = 12): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
};

// Initialize security features
export const initSecurity = (): void => {
  // Generate CSRF token
  CSRFProtection.generateToken();
  
  // Initialize session monitoring
  sessionSecurity.initSessionMonitoring();
  
  // Set up security headers for future requests
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      return secureFetch(input, init);
    }
    return originalFetch(input, init);
  };
};
