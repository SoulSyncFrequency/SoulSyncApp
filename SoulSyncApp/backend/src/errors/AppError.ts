export class AppError extends Error {
  code: string
  httpStatus: number
  details?: any

  constructor(code: string, message: string, httpStatus: number=500, details?: any){
    super(message)
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
  }
}
