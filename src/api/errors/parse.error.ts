interface ErrorInfo {
  code: string
  message: string
  type:
    | 'ValidationError'
    | 'ConstraintError'
    | 'SyntaxError'
    | 'NotFoundError'
    | 'Unknown'
}

export function parseOracleError(error: unknown): ErrorInfo | null {
  if (typeof error !== 'object' || !error || !('message' in error)) return null

  const message = (error as any).message as string
  const match = message.match(/ORA-(\d{5}):\s?(.*)/)

  if (!match) return null

  const [, code, description] = match

  let type: ErrorInfo['type'] = 'Unknown'

  switch (code) {
    case '00001': // unique constraint
    case '02291': // integrity constraint - parent key not found
    case '02292': // integrity constraint - child record found
      type = 'ConstraintError'
      break

    case '01400': // cannot insert NULL
    case '01438': // value larger than specified precision
      type = 'ValidationError'
      break

    case '00904': // invalid identifier
    case '00932': // inconsistent datatypes
    case '00933': // SQL command not properly ended
    case '01722': // invalid number
    case '00936': // missing expression
      type = 'SyntaxError'
      break

    case '01403': // no data found
      type = 'NotFoundError'
      break

    default:
      type = 'Unknown'
  }

  return {
    code: `ORA-${code}`,
    message: description.trim(),
    type,
  }
}

export function parsePostgresError(error: unknown): ErrorInfo | null {
  if (
    typeof error !== 'object' ||
    !error ||
    !('code' in error) ||
    !('message' in error)
  ) {
    return null
  }

  const code = (error as any).code as string
  const message = (error as any).message as string

  let type: ErrorInfo['type'] = 'Unknown'

  switch (code) {
    /** Constraint violations */
    case '23505': // unique_violation
    case '23503': // foreign_key_violation
    case '23502': // not_null_violation
      type = 'ConstraintError'
      break

    /** Validation errors */
    case '22001': // string_data_right_truncation
    case '22003': // numeric_value_out_of_range
    case '22P02': // invalid_text_representation (ej: "invalid input syntax for type integer")
      type = 'ValidationError'
      break

    /** Syntax errors */
    case '42601': // syntax_error
    case '42883': // undefined_function
    case '42703': // undefined_column
    case '42P01': // undefined_table
      type = 'SyntaxError'
      break

    /** Not found */
    case '02000': // no_data
      type = 'NotFoundError'
      break

    default:
      type = 'Unknown'
  }

  return {
    code,
    message: message.trim(),
    type,
  }
}
