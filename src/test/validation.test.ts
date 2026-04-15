import { describe, it, expect } from 'vitest'
import { 
  schemas, 
  validate, 
  sanitize, 
  fileValidation,
  formatValidationError 
} from '../lib/validation'
import { z } from 'zod'

describe('Validation Schemas', () => {
  describe('email schema', () => {
    it('should validate correct email formats', () => {
      expect(() => schemas.email.parse('test@example.com')).not.toThrow()
      expect(() => schemas.email.parse('user.name+tag@domain.co.uk')).not.toThrow()
    })

    it('should reject invalid email formats', () => {
      expect(() => schemas.email.parse('invalid')).toThrow()
      expect(() => schemas.email.parse('@domain.com')).toThrow()
      expect(() => schemas.email.parse('user@')).toThrow()
    })
  })

  describe('name schema', () => {
    it('should validate correct names', () => {
      expect(() => schemas.name.parse('John Doe')).not.toThrow()
      expect(() => schemas.name.parse('Mary-Jane O\'Connor')).not.toThrow()
      expect(() => schemas.name.parse('Dr. Smith Jr.')).not.toThrow()
    })

    it('should reject invalid names', () => {
      expect(() => schemas.name.parse('J')).toThrow()
      expect(() => schemas.name.parse('A'.repeat(101))).toThrow()
      expect(() => schemas.name.parse('John123')).toThrow()
    })
  })

  describe('employee schema', () => {
    it('should validate complete employee data', () => {
      const validEmployee = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        department: 'IT' as const,
        position: 'Developer',
        salary: 75000,
        join_date: '2024-01-15',
        status: 'Active' as const,
      }
      expect(() => employeeSchema.parse(validEmployee)).not.toThrow()
    })

    it('should reject invalid employee data', () => {
      const invalidEmployee = {
        name: 'J',
        email: 'invalid',
        phone: '123',
        department: 'Invalid',
        position: '',
        salary: -1000,
        join_date: 'invalid-date',
        status: 'Invalid',
      }
      expect(() => employeeSchema.parse(invalidEmployee)).toThrow()
    })
  })
})

describe('Validation Functions', () => {
  describe('validate.email', () => {
    it('should return true for valid emails', () => {
      expect(validate.email('test@example.com')).toBe(true)
      expect(validate.email('user.name@domain.co.uk')).toBe(true)
    })

    it('should return false for invalid emails', () => {
      expect(validate.email('invalid')).toBe(false)
      expect(validate.email('@domain.com')).toBe(false)
      expect(validate.email('user@')).toBe(false)
    })
  })

  describe('validate.phone', () => {
    it('should return true for valid phone numbers', () => {
      expect(validate.phone('+1-555-123-4567')).toBe(true)
      expect(validate.phone('555.123.4567')).toBe(true)
      expect(validate.phone('(555) 123-4567')).toBe(true)
    })

    it('should return false for invalid phone numbers', () => {
      expect(validate.phone('123')).toBe(false)
      expect(validate.phone('abc')).toBe(false)
    })
  })

  describe('validate.employeeId', () => {
    it('should return true for valid employee IDs', () => {
      expect(validate.employeeId('EMP001')).toBe(true)
      expect(validate.employeeId('HR1234')).toBe(true)
      expect(validate.employeeId('IT00001')).toBe(true)
    })

    it('should return false for invalid employee IDs', () => {
      expect(validate.employeeId('emp001')).toBe(false)
      expect(validate.employeeId('EMP')).toBe(false)
      expect(validate.employeeId('123')).toBe(false)
    })
  })
})

describe('Sanitization Functions', () => {
  describe('sanitize.text', () => {
    it('should remove HTML tags', () => {
      expect(sanitize.text('<script>alert("xss")</script>Hello')).toBe('Hello')
      expect(sanitize.text('<p>Hello <b>world</b></p>')).toBe('Hello world')
    })

    it('should remove dangerous characters', () => {
      expect(sanitize.text('Hello < > world')).toBe('Hello  world')
    })
  })

  describe('sanitize.email', () => {
    it('should normalize email', () => {
      expect(sanitize.email('John.Doe@EXAMPLE.COM')).toBe('john.doe@example.com')
      expect(sanitize.email('  user@domain.com  ')).toBe('user@domain.com')
    })
  })

  describe('sanitize.phone', () => {
    it('should clean phone number', () => {
      expect(sanitize.phone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567')
      expect(sanitize.phone('555.123.4567 ext. 123')).toBe('555.123.4567 ext. 123')
    })
  })

  describe('sanitize.name', () => {
    it('should clean name', () => {
      expect(sanitize.name('John Doe Jr.')).toBe('John Doe Jr.')
      expect(sanitize.name('Mary@Jane')).toBe('MaryJane')
    })
  })

  describe('sanitize.number', () => {
    it('should parse number from string', () => {
      expect(sanitize.number('123.45')).toBe(123.45)
      expect(sanitize.number('$1,000')).toBe(1000)
      expect(sanitize.number('invalid')).toBe(0)
    })
  })

  describe('sanitize.date', () => {
    it('should parse valid date', () => {
      const result = sanitize.date('2024-01-15')
      expect(result).toBe('2024-01-15')
    })

    it('should return today for invalid date', () => {
      const result = sanitize.date('invalid-date')
      const today = new Date().toISOString().split('T')[0]
      expect(result).toBe(today)
    })
  })
})

describe('File Validation', () => {
  describe('fileValidation.validate', () => {
    it('should validate valid file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
      
      const result = fileValidation.validate(file)
      expect(result.valid).toBe(true)
    })

    it('should reject file that is too large', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }) // 10MB
      
      const result = fileValidation.validate(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('File size must be less than 5MB')
    })

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/exe' })
      
      const result = fileValidation.validate(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('File type not allowed')
    })
  })

  describe('fileValidation.sanitizeFileName', () => {
    it('should sanitize file name', () => {
      expect(fileValidation.sanitizeFileName('My File Name.jpg')).toBe('my_file_name.jpg')
      expect(fileValidation.sanitizeFileName('file@name#$.pdf')).toBe('file_name_.pdf')
    })
  })
})

describe('Error Formatting', () => {
  describe('formatValidationError', () => {
    it('should format zod error', () => {
      const error = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_string,
          path: ['email'],
          message: 'Invalid email',
        },
        {
          code: z.ZodIssueCode.too_small,
          path: ['name'],
          message: 'Name too short',
        },
      ])
      
      const result = formatValidationError(error)
      expect(result).toBe('Invalid email, Name too short')
    })

    it('should format generic error', () => {
      const error = new Error('Something went wrong')
      const result = formatValidationError(error)
      expect(result).toBe('Something went wrong')
    })
  })
})
