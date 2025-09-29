import { env } from '@/lib/env.js';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { Schema, model, type Model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import argon2 from 'argon2';
import { argonOptions } from '@/lib/config.js';

// Type definitions
interface RefreshToken {
  jti: string;
  expiresAt: Date;
  createdAt: Date;
}

interface UserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): {
    refreshToken: string;
    jti: string;
  };
  removeExpiredRefreshTokens(): Promise<void>;
}

interface UserVirtuals {
  fullName: string;
}

interface UserStatics {
  authenticateUser(email: string, password: string): Promise<UserDoc | false>;
}

// Schema definition
const refreshTokenSchema = new Schema({
  jti: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [1, 'Email is required'],
      maxlength: [255, 'Email must be less than 255 characters'],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least 8 characters'],
      maxlength: [255, 'Password must be less than 255 characters'],
      trim: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'First name is required'],
      maxlength: [255, 'First name must be less than 255 characters'],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Last name is required'],
      maxlength: [255, 'Last name must be less than 255 characters'],
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual properties
userSchema.virtual('fullName').get(function (this: UserDoc) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Instance methods
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return argon2.verify(this.password, password, argonOptions);
};

userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign({ sub: this._id }, env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

userSchema.methods.generateRefreshToken = function (): { refreshToken: string; jti: string } {
  const jti = randomUUID();

  const refreshToken = jwt.sign({ sub: this._id, jti }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });

  return { refreshToken, jti };
};

userSchema.methods.removeExpiredRefreshTokens = async function (): Promise<void> {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((token: RefreshToken) => token.expiresAt > now);
  await this.save();
};

// Static methods
userSchema.statics.authenticateUser = async function (
  email: string,
  password: string,
): Promise<UserDoc | false> {
  const user = await this.findOne({ email }).select('+password');

  if (!user) {
    // Dummy verification to prevent timing attacks
    await argon2.verify(
      '$argon2id$v=19$m=65536,t=3,p=4$8HPvhA==$/+rE7qMxh8Zl7ZJRxj3eZm6+4sCBAEjvN08pVxHg1v8',
      password,
    );
    return false;
  }

  const isValid = await user.comparePassword(password);
  return isValid ? user : false;
};

// Pre-save middleware
userSchema.pre<UserDoc>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await argon2.hash(this.password, argonOptions);
  next();
});

// Type exports
type User = InferSchemaType<typeof userSchema>;
type UserDoc = HydratedDocument<User, UserMethods & UserVirtuals>;
interface UserModel
  extends Model<User, {}, UserMethods & UserVirtuals, UserVirtuals>,
    UserStatics {}

// Model creation and export
const User = model<User, UserModel>('User', userSchema);

export { User, type UserDoc, type UserMethods, type UserVirtuals };
