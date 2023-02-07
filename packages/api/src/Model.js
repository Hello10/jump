import {
  DataTimeoutError,
  DataConstraintError,
  DataFormatError,
  DataNotFoundError,
  GqlError
} from '@jump/shared'

function getErrorForPrismaError (error) {
  const { code, meta } = error

  const errorsByCode = {
    P1002: DataTimeoutError,
    P1008: DataTimeoutError,
    P2002: DataConstraintError,
    P2003: DataConstraintError,
    P2004: DataConstraintError,
    P2005: DataFormatError,
    P2006: DataFormatError,
    P2007: DataFormatError,
    P2011: DataConstraintError,
    P2012: DataFormatError,
    P2013: DataFormatError,
    P2014: DataFormatError,
    P2015: DataNotFoundError,
    P2018: DataNotFoundError,
    P2019: DataFormatError,
    P2020: DataFormatError,
    P2022: DataFormatError,
    P2023: DataFormatError,
    P2024: DataTimeoutError,
    P2025: DataNotFoundError,
    P2033: DataFormatError,
    P5009: DataTimeoutError
  }

  let Err = errorsByCode[code] ?? Error
  if (!Err) {
    Err = GqlError
  }

  return new Err({ extensions: meta })
}

export class Model {
  constructor ({ prismaClient }) {
    this.prismaClient = prismaClient
  }

  get table () {
    throw new Error('Child class must implement .table')
  }

  async findById ({ id, assert = false, ...options }) {
    const row = await this.findUnique({
      where: { id },
      ...options
    })
    if (assert && !row) {
      throw new Error('Row not found')
    }
    return row
  }
}

const prismaMethods = [
  'create',
  'update',
  'count',
  'findFirst',
  'findMany',
  'updateMany',
  'findUnique'
]

for (const method of prismaMethods) {
  Model.prototype[method] = async function (args) {
    const { table } = this
    try {
      return await table[method](args)
    } catch (error) {
      const { code, meta } = error
      if (code && meta) {
        throw getErrorForPrismaError(error)
      }
      throw error
    }
  }
}

export default Model
