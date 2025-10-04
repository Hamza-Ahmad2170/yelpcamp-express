class ApiResponse<T = unknown> {
  status: 'success';
  statusCode: number;
  data: T;
  message?: string;

  constructor(statusCode: number, data: T, message?: string) {
    this.status = 'success';
    this.statusCode = statusCode;
    this.data = data;
    if (message) this.message = message;
  }
}

export default ApiResponse;
