// Result type for functional error handling

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Ok = <T>(data: T): Result<T> => ({ success: true, data });
export const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Result utility functions
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  return result.success ? Ok(fn(result.data)) : result;
};

export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return result.success ? fn(result.data) : result;
};

export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  return result.success ? result : Err(fn(result.error));
};

export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.success) {
    return result.data;
  }
  throw result.error;
};

export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.success ? result.data : defaultValue;
};

export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success;
};

export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};