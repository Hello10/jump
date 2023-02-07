export const ErrorCode = {
  GqlError: 'GqlError',
  DataTimeout: 'DataTimeout',
  DataConstraint: 'DataConstraint',
  DataFormat: 'DataFormat',
  DataNotFound: 'DataNotFound',
  NotAuthorized: 'NotAuthorized'
}

export class GqlError extends Error {
  constructor ({ code = ErrorCode.GqlError, message = null, extensions = {} } = {}) {
    if (!message) {
      message = code
    }
    super(
      message,
      {
        extensions: {
          code,
          ...extensions
        }
      }
    )
  }
}

export function isPublicError (error) {
  return error instanceof GqlError
}

export class DataTimeoutError extends GqlError {
  constructor (opts = {}) {
    super({ code: ErrorCode.DataTimeout, ...opts })
  }
}

export class DataConstraintError extends GqlError {
  constructor (opts = {}) {
    super({ code: ErrorCode.DataConstraint, ...opts })
  }
}

export class DataFormatError extends GqlError {
  constructor (opts = {}) {
    super({ code: ErrorCode.DataFormat, ...opts })
  }
}

export class DataNotFoundError extends GqlError {
  constructor (opts = {}) {
    super({ code: ErrorCode.DataNotFound, ...opts })
  }
}

export class NotAuthorizedError extends GqlError {
  constructor (opts = {}) {
    super({ code: ErrorCode.NotAuthorized, ...opts })
  }
}
