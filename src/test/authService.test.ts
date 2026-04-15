import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  generateTemporaryPassword,
  createEmployeeAccount,
  createEmployeeAccountWithCredentials,
  resetEmployeePassword,
  disableEmployeeAccount,
  getEmployeeProfile
} from '../lib/authService'

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateTemporaryPassword', () => {
    it('should generate a password with required complexity', () => {
      const password = generateTemporaryPassword()
      
      expect(password).toMatch(/[A-Z]/) // At least one uppercase
      expect(password).toMatch(/[a-z]/) // At least one lowercase
      expect(password).toMatch(/[0-9]/) // At least one number
      expect(password).toMatch(/[!@#$%^&*]/) // At least one special character
      expect(password.length).toBeGreaterThanOrEqual(12) // Minimum length
    })

    it('should generate different passwords each time', () => {
      const password1 = generateTemporaryPassword()
      const password2 = generateTemporaryPassword()
      
      expect(password1).not.toBe(password2)
    })
  })

  describe('createEmployeeAccount', () => {
    it('should create employee account successfully', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      })
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          error: null
        })
      })

      const result = await createEmployeeAccount('test@example.com', 'John Doe', 'Employee')

      expect(result).toEqual({
        userId: 'user-123',
        tempPassword: expect.any(String)
      })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: expect.any(String),
        options: {
          emailRedirectTo: 'http://localhost:3000/login?confirmed=true',
          data: {
            name: 'John Doe',
            role: 'Employee'
          }
        }
      })
    })

    it('should return null if profile already exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ 
              data: { id: 'existing-profile' }
            })
          })
        })
      })

      const result = await createEmployeeAccount('test@example.com', 'John Doe')

      expect(result).toBeNull()
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should return null if signup fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      })
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already exists' }
      })

      const result = await createEmployeeAccount('test@example.com', 'John Doe')

      expect(result).toBeNull()
    })
  })

  describe('createEmployeeAccountWithCredentials', () => {
    it('should create account with valid data', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      })
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          error: null
        })
      })

      const result = await createEmployeeAccountWithCredentials(
        'test@example.com',
        'John Doe',
        'Employee'
      )

      expect(result).toEqual({
        success: true,
        userId: 'user-123',
        tempPassword: expect.any(String),
        email: 'test@example.com'
      })
    })

    it('should return error for invalid email', async () => {
      const result = await createEmployeeAccountWithCredentials(
        'invalid-email',
        'John Doe'
      )

      expect(result).toEqual({
        success: false,
        email: 'invalid-email',
        error: 'Invalid email format'
      })
    })

    it('should return error if profile already exists', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ 
              data: { id: 'existing-profile' }
            })
          })
        })
      })

      const result = await createEmployeeAccountWithCredentials(
        'test@example.com',
        'John Doe'
      )

      expect(result).toEqual({
        success: false,
        email: 'test@example.com',
        error: 'Account already exists for this email'
      })
    })
  })

  describe('resetEmployeePassword', () => {
    it('should send password reset email successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      })

      const result = await resetEmployeePassword('test@example.com')

      expect(result).toEqual({ success: true })
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/password-reset'
        }
      )
    })

    it('should return error for invalid email', async () => {
      const result = await resetEmployeePassword('invalid-email')

      expect(result).toEqual({
        success: false,
        error: 'Invalid email format. Please enter a valid email address.'
      })
    })

    it('should handle rate limit errors', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limit exceeded' }
      })

      const result = await resetEmployeePassword('test@example.com')

      expect(result).toEqual({
        success: false,
        error: 'Password reset request limit reached. Please wait a few minutes before trying again.'
      })
    })
  })

  describe('disableEmployeeAccount', () => {
    it('should disable account successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })

      const result = await disableEmployeeAccount('user-123')

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ role: 'Inactive' })
    })

    it('should return false on error', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
        })
      })

      const result = await disableEmployeeAccount('user-123')

      expect(result).toBe(false)
    })
  })

  describe('getEmployeeProfile', () => {
    it('should get employee profile successfully', async () => {
      const mockProfile = { id: 'profile-123', email: 'test@example.com', role: 'Employee' }
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile })
          })
        })
      })

      const result = await getEmployeeProfile('test@example.com')

      expect(result).toEqual(mockProfile)
    })

    it('should return null on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ error: { message: 'Not found' } })
          })
        })
      })

      const result = await getEmployeeProfile('test@example.com')

      expect(result).toBeNull()
    })
  })
})
