import { Request, Response, NextFunction } from 'express';
import { auth, adminAuth, AuthRequest } from '../src/middlewares/auth';
import { validate } from '../src/middlewares/validator';
import { errorHandler, createError } from '../src/middlewares/errorHandler';
import { body } from 'express-validator';
import * as jwt from '../src/utils/jwt';

// Mock JWT utilities
jest.mock('../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
}));

describe('Middleware Tests', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Auth Middleware', () => {
    describe('auth middleware', () => {
      it('should authenticate with valid token', () => {
        const mockPayload = {
          userId: '123',
          email: 'test@example.com',
          role: 'USER',
        };

        (jwt.verifyToken as jest.Mock).mockReturnValue(mockPayload);

        mockRequest.headers = {
          authorization: 'Bearer valid-token',
        };

        auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockRequest.user).toEqual(mockPayload);
        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should reject request without token', () => {
        mockRequest.headers = {};

        auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'No token provided',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request with malformed token', () => {
        mockRequest.headers = {
          authorization: 'InvalidFormat token',
        };

        auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'No token provided',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request with invalid token', () => {
        (jwt.verifyToken as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid token');
        });

        mockRequest.headers = {
          authorization: 'Bearer invalid-token',
        };

        auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Invalid or expired token',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request with expired token', () => {
        (jwt.verifyToken as jest.Mock).mockImplementation(() => {
          throw new Error('Token expired');
        });

        mockRequest.headers = {
          authorization: 'Bearer expired-token',
        };

        auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('adminAuth middleware', () => {
      it('should allow admin user', () => {
        mockRequest.user = {
          userId: '123',
          email: 'admin@example.com',
          role: 'ADMIN',
        };

        adminAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
      });

      it('should reject non-admin user', () => {
        mockRequest.user = {
          userId: '123',
          email: 'user@example.com',
          role: 'USER',
        };

        adminAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Access denied. Admin privileges required.',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject request without user', () => {
        mockRequest.user = undefined;

        adminAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Unauthorized',
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Validation Middleware', () => {
    it('should pass validation with valid data', async () => {
      const validations = [
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
      ];

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email', async () => {
      const validations = [body('email').isEmail()];

      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with short password', async () => {
      const validations = [body('password').isLength({ min: 6 })];

      mockRequest.body = {
        password: '123',
      };

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation with missing required field', async () => {
      const validations = [body('email').notEmpty().isEmail()];

      mockRequest.body = {};

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate multiple fields', async () => {
      const validations = [
        body('email').isEmail(),
        body('username').isLength({ min: 3 }),
        body('password').isLength({ min: 6 }),
      ];

      mockRequest.body = {
        email: 'test@example.com',
        username: 'usr',
        password: 'pass123',
      };

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return all validation errors', async () => {
      const validations = [
        body('email').isEmail(),
        body('password').isLength({ min: 6 }),
      ];

      mockRequest.body = {
        email: 'invalid',
        password: '123',
      };

      const middleware = validate(validations);
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
            }),
            expect.objectContaining({
              field: 'password',
            }),
          ]),
        })
      );
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle error with status code', () => {
      const error = createError('Test error', 404);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
        })
      );
    });

    it('should handle error without status code (default to 500)', () => {
      const error = new Error('Internal error') as any;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal error',
        })
      );
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = createError('Test error', 500);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error',
          stack: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createError('Test error', 500);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle operational errors', () => {
      const error = createError('Operational error', 400);

      expect(error.isOperational).toBe(true);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('createError should create error with correct properties', () => {
      const error = createError('Custom error', 403);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('createError should default to 500 status code', () => {
      const error = createError('Error without status');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('Middleware Integration', () => {
    it('should chain auth and adminAuth middleware', () => {
      const mockPayload = {
        userId: '123',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      (jwt.verifyToken as jest.Mock).mockReturnValue(mockPayload);

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // First middleware: auth
      auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockRequest.user).toEqual(mockPayload);

      // Second middleware: adminAuth
      adminAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('should stop chain if auth fails', () => {
      (jwt.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      auth(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();

      // adminAuth should not be called in real scenario
      // but if it were, it should also fail
      const nextMock = mockNext as jest.Mock;
      if (nextMock.mock.calls.length === 0) {
        adminAuth(mockRequest as AuthRequest, mockResponse as Response, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
      }
    });
  });
});
