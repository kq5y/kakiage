import type { TypedResponse } from "hono";
import type { ContentfulStatusCode, RedirectStatusCode } from "hono/utils/http-status";
import type { InvalidJSONValue, JSONParsed, JSONValue, SimplifyDeepArray } from "hono/utils/types";

export type SuccessResponse<T = undefined> = [T] extends [undefined]
  ? { success: true }
  : { success: true; data: T };

export type ErrorResponse = {
  success: false;
  message: string;
};

type JSONRespondReturn<T extends JSONValue | SimplifyDeepArray<unknown> | InvalidJSONValue, U extends ContentfulStatusCode> = Response & TypedResponse<SimplifyDeepArray<T> extends JSONValue ? JSONValue extends SimplifyDeepArray<T> ? never : JSONParsed<T> : never, U, "json">;
export type JsonErrorResponse<U extends ContentfulStatusCode> = JSONRespondReturn<ErrorResponse, U>

export type RedirectResponse<T extends RedirectStatusCode = 302> = Response & TypedResponse<undefined, T, "redirect">

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function success<T = undefined>(data?: T): SuccessResponse<T> {
  return (data === undefined ? ({ success: true } as SuccessResponse<T>) : ({ success: true, data } as SuccessResponse<T>));
}

export function error(message: string): ErrorResponse {
  return { success: false, message };
}
