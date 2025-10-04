import ApiError from '@/lib/ApiError.js';
import ApiResponse from '@/lib/ApiResponse.js';
import { cookieOptions } from '@/lib/config.js';
import { env } from '@/lib/env.js';
import { validate, verifyToken } from '@/lib/utils.js';
import { RefreshToken } from '@/models/refreshToken.model.js';
import { User } from '@/models/user.model.js';
import { signInSchema, signUpSchema } from '@/schema/auth.schema.js';
import type { RefreshTokenPayload } from '@/types/payload.js';
import { type Request, type Response } from 'express';

export const signup = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = validate(signUpSchema, req.body);
  const existingUser = await User.findOne({ email });

  if (existingUser) throw new ApiError(400, 'User already exists');

  const newUser = await User.create({
    email,
    password,
    firstName,
    lastName,
  });

  const accessToken = newUser.generateAccessToken();
  const { jti, refreshToken, expiresAt } = newUser.generateRefreshToken();

  await RefreshToken.create({
    userId: newUser._id,
    jti,
    expiresAt,
  });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
      },
      'User created successfully',
    ),
  );
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = validate(signInSchema, req.body);

  const user = await User.authenticateUser(email, password);

  if (!user) throw new ApiError(401, 'Invalid email or password');

  const accessToken = user.generateAccessToken();
  const { jti, refreshToken, expiresAt } = user.generateRefreshToken();

  await RefreshToken.create({
    userId: user._id,
    jti,
    expiresAt,
  });

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
      },
      'User logged in successfully',
    ),
  );
};

export const signout = async (req: Request, res: Response) => {
  const token = req.cookies['refreshToken'];
  if (!token) return res.status(200).json(new ApiResponse(200, 'Logged out'));

  res.clearCookie('refreshToken', cookieOptions);

  const decoded = verifyToken<RefreshTokenPayload>(token, env.REFRESH_TOKEN_SECRET);
  if (!decoded.data) return res.status(200).json(new ApiResponse(200, 'Logged out'));

  await RefreshToken.deleteOne({
    jti: decoded.data.jti,
    userId: decoded.data.sub,
  });

  return res.status(200).json(new ApiResponse(200, 'Logged out'));
};

export const getSession = async (req: Request, res: Response) => {
  const user = await User.findById(req.sub);

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
      },
      'User found successfully',
    ),
  );
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies['refreshToken'];

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const decodedToken = verifyToken<RefreshTokenPayload>(refreshToken, env.REFRESH_TOKEN_SECRET);
  if (!decodedToken.data) {
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Invalid refresh token');
  }

  const { sub: userId, jti } = decodedToken.data;
  const existingToken = await RefreshToken.findOne({ userId, jti });
  console.log({ existingToken });

  if (!existingToken) {
    const userExists = await User.findById(userId);
    if (userExists) {
      // token reuse detected → clear all user's refresh tokens for safety
      await RefreshToken.deleteMany({ userId });

      // TODO: Send security alert email
    }
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Invalid refresh token - please login again');
  }

  await RefreshToken.deleteOne({ userId, jti });

  const user = await User.findById(userId);
  if (!user) {
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'User not found');
  }

  const accessToken = user.generateAccessToken();
  const { jti: newJti, refreshToken: newRefreshToken, expiresAt } = user.generateRefreshToken();

  await RefreshToken.create({
    userId: user._id,
    jti: newJti,
    expiresAt,
  });

  res.cookie('refreshToken', newRefreshToken, cookieOptions);
  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, 'Refresh token refreshed successfully'));
};
