import ApiError from '@/lib/ApiError.js';
import ApiResponse from '@/lib/ApiResponse.js';
import { cookieOptions } from '@/lib/config.js';
import { env } from '@/lib/env.js';
import { userAgent, validate, verifyToken } from '@/lib/utils.js';
import { User } from '@/models/user.model.js';
import { signInSchema, signUpSchema } from '@/schema/auth.schema.js';
import type { RefreshTokenPayload } from '@/types/payload.js';
import { type Request, type Response } from 'express';

export const signup = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = validate(signUpSchema, req.body);
  const user = await User.findOne({ email });

  if (user) {
    throw new ApiError(400, 'User already exists');
  }

  const newUser = new User({
    email,
    password,
    firstName,
    lastName,
  });

  const accessToken = newUser.generateAccessToken();
  const { jti, refreshToken } = newUser.generateRefreshToken();

  newUser.refreshTokens.push({
    jti: jti,
    userAgent: userAgent(req),
  });

  const createdUser = await newUser.save();

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        user: {
          _id: createdUser._id,
          email: createdUser.email,
          fullName: createdUser.fullName,
        },
      },
      'User created successfully',
    ),
  );
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = validate(signInSchema, req.body);

  const user = await User.authenticateUser(email, password);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  await user.removeExpiredRefreshTokens();
  const accessToken = user.generateAccessToken();
  const { jti, refreshToken } = user.generateRefreshToken();

  console.log({
    userAgent: userAgent(req),
  });

  user.refreshTokens.push({
    jti,
    userAgent: userAgent(req),
  });

  const createdUser = await user.save();

  res.cookie('refreshToken', refreshToken, cookieOptions);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        user: {
          _id: createdUser._id,
          email: createdUser.email,
          fullName: createdUser.fullName,
        },
      },
      'User logged in successfully',
    ),
  );
};

export const signout = async (req: Request, res: Response) => {
  const token = req.cookies['refreshToken'];
  if (!token) {
    return res.status(200).json(new ApiResponse(200, 'Logged out'));
  }
  res.clearCookie('refreshToken', cookieOptions);
  const decodedUser = verifyToken<RefreshTokenPayload>(token, env.REFRESH_TOKEN_SECRET);

  if (!decodedUser) {
    return res.status(200).json(new ApiResponse(200, 'Logged out'));
  }

  const foundUser = await User.findOne({
    'refreshTokens.jti': decodedUser.jti,
    'refreshTokens.userAgent': userAgent(req),
  });

  if (!foundUser) {
    return res.status(200).json(new ApiResponse(200, 'Logged out'));
  }

  foundUser.refreshTokens.pull({ jti: decodedUser.jti });

  await foundUser.save();
  return res.status(200).json(new ApiResponse(200, 'Logged out'));
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies['refreshToken'];

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const decodedUser = verifyToken<RefreshTokenPayload>(refreshToken, env.REFRESH_TOKEN_SECRET);

  if (!decodedUser) {
    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Invalid refresh token');
  }

  const foundUser = await User.findOne({
    'refreshTokens.jti': decodedUser.jti,
    'refreshTokens.userAgent': userAgent(req),
  });

  if (!foundUser) {
    const hackedUser = await User.findOne({
      'refreshTokens.jti': decodedUser.jti,
    });

    if (hackedUser) {
      hackedUser.set('refreshTokens', []);
      await hackedUser.save();
    }

    res.clearCookie('refreshToken', cookieOptions);
    throw new ApiError(401, 'Invalid refresh token');
  }

  foundUser.refreshTokens.pull({ jti: decodedUser.jti });

  foundUser.removeExpiredRefreshTokens();
  const accessToken = foundUser.generateAccessToken();
  const { jti: newJti, refreshToken: newRefreshToken } = foundUser.generateRefreshToken();

  // Add new refresh token
  foundUser.refreshTokens.push({
    jti: newJti,
    userAgent: userAgent(req),
  });

  await foundUser.save();

  res.cookie('refreshToken', newRefreshToken, cookieOptions);
  res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, 'Refresh token refreshed successfully'));
};

export const getSession = async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);

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
