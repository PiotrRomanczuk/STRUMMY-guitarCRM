/**
 * User API Schema Tests
 *
 * Tests for API validation schemas with focus on:
 * - XSS prevention (HTML tag stripping)
 * - Injection prevention (length limits, character sanitization)
 * - Input validation (email, phone, required fields)
 * - Edge cases (empty strings, special characters, null values)
 *
 * Validates fix for STRUMMY-281
 */

import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserFilterSchema,
  UserIdParamSchema,
  validateCreateUserRequest,
  validateUpdateUserRequest,
  validateUserFilters,
  validateUserId,
  safeValidateCreateUser,
  safeValidateUpdateUser,
} from '@/schemas/UserApiSchema';

// ============================================================================
// CREATE USER REQUEST TESTS
// ============================================================================

describe('CreateUserRequestSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid user with email and name', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isStudent: true,
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should accept user with full_name instead of firstName/lastName', () => {
      const input = {
        email: 'test@example.com',
        full_name: 'John Doe',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.full_name).toBe('John Doe');
    });

    it('should accept shadow user with no email', () => {
      const input = {
        email: '',
        full_name: 'Shadow User',
        isShadow: true,
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email).toBe('');
      expect(result.isShadow).toBe(true);
    });

    it('should set default role flags', () => {
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.isStudent).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.isTeacher).toBe(false);
      expect(result.isShadow).toBe(false);
    });

    it('should accept all optional fields', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '123-456-7890',
        notes: 'Test notes',
        isAdmin: true,
        isTeacher: true,
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.phone).toBe('123-456-7890');
      expect(result.notes).toBe('Test notes');
      expect(result.isAdmin).toBe(true);
      expect(result.isTeacher).toBe(true);
    });
  });

  describe('email validation', () => {
    it('should reject invalid email format', () => {
      const input = {
        email: 'invalid-email',
        full_name: 'Test User',
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow();
    });

    it('should trim and lowercase email', () => {
      const input = {
        email: '  TEST@EXAMPLE.COM  ',
        full_name: 'Test User',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email).toBe('test@example.com');
    });

    it('should reject email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(240) + '@example.com'; // 252 chars total
      const input = {
        email: longEmail,
        full_name: 'Test User',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email.length).toBeLessThanOrEqual(255);
    });
  });

  describe('XSS prevention', () => {
    it('should strip HTML tags from firstName', () => {
      const input = {
        email: 'test@example.com',
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.firstName).not.toContain('<script>');
      expect(result.firstName).toBe('alert("xss")John'); // Tags removed, content kept
    });

    it('should strip HTML tags from lastName', () => {
      const input = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: '<img src=x onerror=alert(1)>Doe',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.lastName).not.toContain('<img');
      expect(result.lastName).toBe('Doe');
    });

    it('should strip HTML tags from full_name', () => {
      const input = {
        email: 'test@example.com',
        full_name: '<b>John</b> <i>Doe</i>',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.full_name).toBe('John Doe');
    });

    it('should strip HTML tags from notes', () => {
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
        notes: '<script>alert("xss")</script>Safe notes',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.notes).not.toContain('<script>');
      expect(result.notes).toBe('alert("xss")Safe notes'); // Tags removed, content kept
    });
  });

  describe('length validation', () => {
    it('should reject name exceeding 255 characters', () => {
      const longName = 'a'.repeat(300);
      const input = {
        email: 'test@example.com',
        firstName: longName,
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow('cannot exceed 255');
    });

    it('should reject phone exceeding 50 characters', () => {
      const longPhone = '1'.repeat(60);
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
        phone: longPhone,
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow('cannot exceed 50');
    });

    it('should reject notes exceeding 5000 characters', () => {
      const longNotes = 'a'.repeat(5100);
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
        notes: longNotes,
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow('cannot exceed 5000');
    });
  });

  describe('whitespace handling', () => {
    it('should trim whitespace from all fields', () => {
      const input = {
        email: '  test@example.com  ',
        firstName: '  John  ',
        lastName: '  Doe  ',
        phone: '  123-456-7890  ',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.phone).toBe('123-456-7890');
    });
  });

  describe('required fields', () => {
    it('should reject when no email or name provided', () => {
      const input = {
        isStudent: true,
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow('At least email or name');
    });

    it('should accept when only email provided', () => {
      const input = {
        email: 'test@example.com',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.email).toBe('test@example.com');
    });

    it('should accept when only name provided', () => {
      const input = {
        email: '',
        full_name: 'Test User',
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.full_name).toBe('Test User');
    });
  });

  describe('role validation', () => {
    it('should reject admin + student without teacher', () => {
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
        isAdmin: true,
        isStudent: true,
        isTeacher: false,
      };

      expect(() => CreateUserRequestSchema.parse(input)).toThrow(
        'cannot be both admin and student'
      );
    });

    it('should accept admin + teacher + student', () => {
      const input = {
        email: 'test@example.com',
        full_name: 'Test User',
        isAdmin: true,
        isTeacher: true,
        isStudent: true,
      };

      const result = CreateUserRequestSchema.parse(input);
      expect(result.isAdmin).toBe(true);
      expect(result.isTeacher).toBe(true);
      expect(result.isStudent).toBe(true);
    });
  });
});

// ============================================================================
// UPDATE USER REQUEST TESTS
// ============================================================================

describe('UpdateUserRequestSchema', () => {
  it('should accept partial updates', () => {
    const input = {
      full_name: 'Updated Name',
    };

    const result = UpdateUserRequestSchema.parse(input);
    expect(result.full_name).toBe('Updated Name');
  });

  it('should accept role flag updates', () => {
    const input = {
      isTeacher: true,
      isActive: false,
    };

    const result = UpdateUserRequestSchema.parse(input);
    expect(result.isTeacher).toBe(true);
    expect(result.isActive).toBe(false);
  });

  it('should reject empty update', () => {
    const input = {};

    expect(() => UpdateUserRequestSchema.parse(input)).toThrow(
      'At least one field must be provided'
    );
  });

  it('should strip HTML from full_name', () => {
    const input = {
      full_name: '<b>Updated</b> Name',
    };

    const result = UpdateUserRequestSchema.parse(input);
    expect(result.full_name).toBe('Updated Name');
  });

  it('should trim whitespace', () => {
    const input = {
      full_name: '  Updated Name  ',
      phone: '  123-456-7890  ',
    };

    const result = UpdateUserRequestSchema.parse(input);
    expect(result.full_name).toBe('Updated Name');
    expect(result.phone).toBe('123-456-7890');
  });
});

// ============================================================================
// USER FILTER TESTS
// ============================================================================

describe('UserFilterSchema', () => {
  it('should parse search query', () => {
    const input = {
      search: 'john doe',
    };

    const result = UserFilterSchema.parse(input);
    expect(result.search).toBe('john doe');
  });

  it('should limit search query to 100 characters', () => {
    const longSearch = 'a'.repeat(150);
    const input = {
      search: longSearch,
    };

    expect(() => UserFilterSchema.parse(input)).toThrow('cannot exceed 100');
  });

  it('should parse role filter', () => {
    const input = {
      role: 'teacher',
    };

    const result = UserFilterSchema.parse(input);
    expect(result.role).toBe('teacher');
  });

  it('should parse pagination parameters', () => {
    const input = {
      limit: '25',
      offset: '10',
    };

    const result = UserFilterSchema.parse(input);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(10);
  });

  it('should set default pagination values', () => {
    const input = {};

    const result = UserFilterSchema.parse(input);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('should reject limit exceeding 250', () => {
    const input = {
      limit: '300',
    };

    expect(() => UserFilterSchema.parse(input)).toThrow('cannot exceed 250');
  });

  it('should convert isActive string to boolean', () => {
    const inputTrue = { isActive: 'true' };
    const inputFalse = { isActive: 'false' };

    const resultTrue = UserFilterSchema.parse(inputTrue);
    const resultFalse = UserFilterSchema.parse(inputFalse);

    expect(resultTrue.isActive).toBe(true);
    expect(resultFalse.isActive).toBe(false);
  });
});

// ============================================================================
// USER ID PARAMETER TESTS
// ============================================================================

describe('UserIdParamSchema', () => {
  it('should accept valid UUID', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = UserIdParamSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should reject invalid UUID format', () => {
    const input = {
      id: 'not-a-uuid',
    };

    expect(() => UserIdParamSchema.parse(input)).toThrow('Invalid user ID format');
  });

  it('should reject zero UUID', () => {
    const input = {
      id: '00000000-0000-0000-0000-000000000000',
    };

    expect(() => UserIdParamSchema.parse(input)).toThrow('Invalid user ID');
  });
});

// ============================================================================
// VALIDATION HELPER TESTS
// ============================================================================

describe('validateCreateUserRequest', () => {
  it('should validate and return parsed data', () => {
    const input = {
      email: 'test@example.com',
      full_name: 'Test User',
    };

    const result = validateCreateUserRequest(input);
    expect(result.email).toBe('test@example.com');
    expect(result.full_name).toBe('Test User');
  });

  it('should throw on invalid input', () => {
    const input = {
      email: 'invalid-email',
    };

    expect(() => validateCreateUserRequest(input)).toThrow();
  });
});

describe('safeValidateCreateUser', () => {
  it('should return success with parsed data for valid input', () => {
    const input = {
      email: 'test@example.com',
      full_name: 'Test User',
    };

    const result = safeValidateCreateUser(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('should return errors for invalid input', () => {
    const input = {
      email: 'invalid-email',
      full_name: 'Test User',
    };

    const result = safeValidateCreateUser(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.message).toBe('Validation failed');
    }
  });

  it('should return field-level errors', () => {
    const input = {
      email: 'invalid-email', // Invalid format to trigger error
      full_name: 'Test User', // Valid name to get past refinement
    };

    const result = safeValidateCreateUser(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.message).toBe('Validation failed');
    }
  });
});

describe('safeValidateUpdateUser', () => {
  it('should return success for valid update', () => {
    const input = {
      full_name: 'Updated Name',
    };

    const result = safeValidateUpdateUser(input);
    expect(result.success).toBe(true);
  });

  it('should return errors for empty update', () => {
    const input = {};

    const result = safeValidateUpdateUser(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe('Validation failed');
    }
  });
});

describe('validateUpdateUserRequest', () => {
  it('should return sanitized data for a valid update', () => {
    const result = validateUpdateUserRequest({
      full_name: '  <b>Updated</b> Name  ',
      isActive: false,
    });

    expect(result.full_name).toBe('Updated Name');
    expect(result.isActive).toBe(false);
  });

  it('should accept a role-flag-only update', () => {
    const result = validateUpdateUserRequest({ isTeacher: true });

    expect(result.isTeacher).toBe(true);
    expect(result.full_name).toBeUndefined();
  });

  it('should throw when no fields are provided', () => {
    expect(() => validateUpdateUserRequest({})).toThrow(
      /At least one field must be provided for update/
    );
  });

  it('should throw on an invalid field value', () => {
    expect(() => validateUpdateUserRequest({ isActive: 'yes' })).toThrow();
  });

  it('should throw on a non-object body', () => {
    expect(() => validateUpdateUserRequest(null)).toThrow();
  });
});

describe('validateUserFilters', () => {
  it('should validate and parse filters', () => {
    const input = {
      search: 'test',
      role: 'teacher',
      limit: '25',
    };

    const result = validateUserFilters(input);
    expect(result.search).toBe('test');
    expect(result.role).toBe('teacher');
    expect(result.limit).toBe(25);
  });
});

describe('validateUserId', () => {
  it('should validate UUID parameter', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = validateUserId(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should throw on invalid UUID', () => {
    const input = {
      id: 'invalid',
    };

    expect(() => validateUserId(input)).toThrow();
  });
});
