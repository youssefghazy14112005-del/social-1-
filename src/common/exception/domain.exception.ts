export class ApplicationException extends Error {
  constructor(message: string, public readonly status = 500, options?: ErrorOptions) {
    super(message, options); this.name = new.target.name;
  }
}
export class BadRequestException extends ApplicationException { constructor(message = 'Bad request') { super(message, 400); } }
export class UnauthorizedException extends ApplicationException { constructor(message = 'Unauthorized') { super(message, 401); } }
export class ForbiddenException extends ApplicationException { constructor(message = 'Forbidden') { super(message, 403); } }
export class NotFoundException extends ApplicationException { constructor(message = 'Not found') { super(message, 404); } }
export class ConflictException extends ApplicationException { constructor(message = 'Conflict') { super(message, 409); } }
