interface AccessTokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
}

export type { AccessTokenPayload, RefreshTokenPayload };
