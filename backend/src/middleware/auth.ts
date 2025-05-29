import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { asyncHandler, createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw createError('Not authorized to access this route', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthRequest).user = await User.findById(decoded.id);
    
    if (!(req as AuthRequest).user) {
      throw createError('No user found with this id', 404);
    }
    
    next();
  } catch (error) {
    throw createError('Not authorized to access this route', 401);
  }
});

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      throw createError('User not found', 404);
    }

    if (!roles.includes(authReq.user.role)) {
      throw createError(`User role ${authReq.user.role} is not authorized to access this route`, 403);
    }
    
    next();
  };
}; 