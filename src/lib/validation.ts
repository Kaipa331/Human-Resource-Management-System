// Input validation and sanitization utilities
import { z } from 'zod';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation (international format)
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,}$/;

// Employee ID validation
const EMPLOYEE_ID_REGEX = /^[A-Z]{2,4}\d{3,6}$/;

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email format'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  phone: z.string()
    .regex(PHONE_REGEX, 'Invalid phone number format')
    .optional(),
  employeeId: z.string()
    .regex(EMPLOYEE_ID_REGEX, 'Employee ID must be in format like EMP001'),
  department: z.enum(['IT', 'HR', 'Finance', 'Sales', 'Marketing', 'Operations', 'Management']),
  position: z.string()
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must be less than 100 characters'),
  salary: z.number()
    .min(0, 'Salary must be positive')
    .max(10000000, 'Salary seems too high'),
  date: z.string().refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }, 'Invalid date format'),
  text: z.string().max(1000, 'Text must be less than 1000 characters'),
  description: z.string().max(5000, 'Description must be less than 5000 characters'),
};

// Employee validation schema
export const employeeSchema = z.object({
  name: schemas.name,
  email: schemas.email,
  phone: schemas.phone,
  department: schemas.department,
  position: schemas.position,
  salary: schemas.salary,
  join_date: schemas.date,
  status: z.enum(['Active', 'Inactive', 'On Leave']),
});

// Leave request validation schema
export const leaveRequestSchema = z.object({
  employee_id: z.string().uuid(),
  type: z.enum(['Sick', 'Vacation', 'Personal', 'Maternity', 'Paternity', 'Bereavement']),
  start_date: schemas.date,
  end_date: schemas.date,
  reason: schemas.text.optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end >= start;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// Attendance validation schema
export const attendanceSchema = z.object({
  employee_id: z.string().uuid(),
  clock_in: schemas.date.optional(),
  clock_out: schemas.date.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: schemas.text.optional(),
  status: z.enum(['Present', 'Absent', 'Late', 'Needs Review', 'Correction Pending']),
});

// Performance review validation schema
export const performanceReviewSchema = z.object({
  employee_id: z.string().uuid(),
  period: schemas.text,
  reviewer: schemas.name,
  overall_rating: z.number().min(1).max(5),
  goals: z.number().min(0),
  achieved_goals: z.number().min(0),
}).refine((data) => {
  return data.achieved_goals <= data.goals;
}, {
  message: 'Achieved goals cannot exceed total goals',
  path: ['achieved_goals'],
});

// Training course validation schema
export const trainingCourseSchema = z.object({
  title: schemas.name,
  category: z.enum(['Technical Skills', 'Leadership', 'Compliance', 'Soft Skills', 'Safety']),
  duration_hours: z.number().min(1).max(1000),
  provider: schemas.name,
  price: z.number().min(0),
  description: schemas.description.optional(),
});

// Job posting validation schema
export const jobPostingSchema = z.object({
  title: schemas.name,
  department: schemas.department,
  location: schemas.text,
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary']),
  description: schemas.description,
});

// Input sanitization functions
export const sanitize = {
  // Remove HTML tags and dangerous characters
  text: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove remaining brackets
      .trim();
  },
  
  // Sanitize email
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },
  
  // Sanitize phone number
  phone: (input: string): string => {
    return input.replace(/[^\d\+\-\(\)\s]/g, '').trim();
  },
  
  // Sanitize name
  name: (input: string): string => {
    return input
      .replace(/[^\w\s\-'\.]/g, '') // Allow only letters, numbers, spaces, hyphens, apostrophes, periods
      .trim();
  },
  
  // Sanitize numeric input
  number: (input: string): number => {
    const num = parseFloat(input.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  },
  
  // Sanitize date
  date: (input: string): string => {
    const date = new Date(input);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  },
};

// Validation functions
export const validate = {
  email: (email: string): boolean => EMAIL_REGEX.test(email),
  phone: (phone: string): boolean => PHONE_REGEX.test(phone),
  employeeId: (id: string): boolean => EMPLOYEE_ID_REGEX.test(id),
  name: (name: string): boolean => schemas.name.safeParse(name).success,
  salary: (salary: number): boolean => salary > 0 && salary <= 10000000,
};

// Rate limiting for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

// CSRF protection utilities
export const csrf = {
  generateToken: (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
  
  validateToken: (token: string, storedToken: string): boolean => {
    return token === storedToken;
  },
  
  getTokenFromStorage: (): string | null => {
    return sessionStorage.getItem('csrf_token');
  },
  
  setTokenInStorage: (token: string): void => {
    sessionStorage.setItem('csrf_token', token);
  },
};

// XSS protection
export const xss = {
  escape: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },
  
  sanitizeHtml: (input: string): string => {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  },
};

// File upload validation
export const fileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'],
  
  validate: (file: File): { valid: boolean; error?: string } => {
    if (file.size > fileValidation.maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    
    if (!fileValidation.allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }
    
    return { valid: true };
  },
  
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
      .toLowerCase();
  },
};

// Export validation error helper
export const formatValidationError = (error: any): string => {
  if (error.errors) {
    return error.errors.map((e: any) => e.message).join(', ');
  }
  return error.message || 'Validation failed';
};
