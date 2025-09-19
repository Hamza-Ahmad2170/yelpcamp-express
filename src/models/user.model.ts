import { env } from '@/lib/env.js';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { Schema, model, type Model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import argon2 from 'argon2';
import { argonOptions } from '@/lib/config.js';

interface UserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): {
    refreshToken: string;
    jti: string;
  };
  removeExpiredRefreshTokens(): Promise<void>;
}

// Add interface for virtual properties
interface UserVirtuals {
  fullName: string;
}

const refreshTokenSchema = new Schema(
  {
    jti: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    createdAt: { type: Date, default: Date.now },
    userAgent: {
      browser: { type: String, default: 'unknown' },
      os: { type: String, default: 'unknown' },
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxLength: 255,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxLength: 255,
      trim: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxLength: 255,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxLength: 255,
    },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
  },
  {
    methods: {
      async comparePassword(password: string) {
        return argon2.verify(this.password, password, argonOptions);
      },
      generateAccessToken() {
        return jwt.sign(
          {
            sub: this._id,
          },
          env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: '15m',
          },
        );
      },
      generateRefreshToken() {
        const jti = randomUUID();

        const refreshToken = jwt.sign({ sub: this._id, jti }, env.REFRESH_TOKEN_SECRET, {
          expiresIn: '7d',
        });

        return {
          refreshToken,
          jti,
        };
      },
      async removeExpiredRefreshTokens() {
        const now = new Date();

        this.refreshTokens.remove((token: { expiresAt: Date }) => token.expiresAt <= now);

        await this.save();
      },
    },
    statics: {
      async authenticateUser(email: string, password: string) {
        const user = await this.findOne({ email }).select('+password');

        if (!user) {
          // Use a dummy verification to prevent timing attacks
          await argon2.verify(
            '$argon2id$v=19$m=65536,t=3,p=4$8HPvhA==$/+rE7qMxh8Zl7ZJRxj3eZm6+4sCBAEjvN08pVxHg1v8',
            password,
          );
          return false;
        }

        const isValid = await argon2.verify(user.password, password, argonOptions);

        return isValid ? user : false;
      },
    },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Define virtuals directly on the schema
userSchema.virtual('fullName').get(function (this: any) {
  return `${this.firstName} ${this.lastName}`.trim();
});

type User = InferSchemaType<typeof userSchema>;

// Update UserDoc to include virtuals
type UserDoc = HydratedDocument<User, UserMethods & UserVirtuals>;

// Update UserModel to include virtuals
interface UserModel extends Model<User, {}, UserMethods & UserVirtuals> {
  authenticateUser(email: string, password: string): Promise<UserDoc | false>;
}

userSchema.pre<UserDoc>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await argon2.hash(this.password, argonOptions);
  next();
});

const User = model<User, UserModel>('User', userSchema);

export { User, type UserDoc };
