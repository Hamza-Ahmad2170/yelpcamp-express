declare global {
  namespace Express {
    interface Request {
      sub: string; // User ID
    }
  }
}

export {};
