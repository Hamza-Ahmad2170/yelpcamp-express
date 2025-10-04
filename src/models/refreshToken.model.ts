import { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jti: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

// TODO: Add device and IP tracking
// {
//     device: { type: String },       // e.g. "Chrome on MacOS"
//     ip: { type: String },           // store IP when created
//     lastUsedAt: { type: Date },     // update whenever the refresh token is used
// }

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model('RefreshToken', refreshTokenSchema);

export { RefreshToken };
