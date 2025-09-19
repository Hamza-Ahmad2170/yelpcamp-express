class ApiError extends Error {
  statusCode: number;
  data?: unknown;
  isOperational: boolean;
  status: 'fail' | 'error';

  constructor(
    statusCode: number = 500,
    message: string = 'Something went wrong',
    data?: any,
    stack?: string,
    isOperational: boolean = true
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    // Fix: Validate statusCode first, then set status
    if (statusCode < 400) {
      statusCode = 500; // Force invalid status codes to 500
    }

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.data = data;

    // Operational errors = expected (e.g., validation, auth)
    // Non-operational = unexpected (bugs, DB crashes, etc.)
    this.isOperational = statusCode < 500 ? true : isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;

// 🔹 fail

// Used for client errors (HTTP 4xx status codes).

// Means: the request was understood, but the client did something wrong.

// Example cases:

// 400 Bad Request → invalid data shape.

// 401 Unauthorized → missing/invalid token.

// 404 Not Found → resource doesn’t exist.

// error

// Used for server errors (HTTP 5xx status codes).

// Means: the client did everything right, but the server messed up.

// Example cases:

// 500 Internal Server Error → unhandled exception.

// 502 Bad Gateway → upstream service failed.

// 503 Service Unavailable → database down.

// isOperational = true → The error is safe to expose (client mistake, validation fail, expired token, duplicate email, etc.).

// isOperational = false → The error is a bug or system failure (null pointer, DB crash, coding issue) — not safe to expose.
