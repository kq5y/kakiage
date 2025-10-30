import type { Input } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Env, ValidationTargets } from "hono/types";
import type { BodyData } from "hono/utils/body";
import type { ZodType } from "zod";
import z from "zod";

import { error, type JsonErrorResponse, type RedirectResponse } from "../libs/response.js";

// ----- from hono -----

// https://github.com/honojs/hono/blob/main/src/validator/validator.ts
const jsonRegex = /^application\/([a-z-.]+\+)?json(;\s*[a-zA-Z0-9-]+=([^;]+))*$/;
const multipartRegex = /^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
const urlencodedRegex = /^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9-]+=([^;]+))*$/;

// https://github.com/honojs/hono/blob/main/src/utils/buffer.ts
var bufferToFormData = (arrayBuffer: ArrayBuffer, contentType: string): Promise<FormData> => {
  const response = new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType,
    },
  });
  return response.formData();
};

// ---------------------

type V<T extends ZodType, Target extends keyof ValidationTargets> = {
  in: { [K in Target]: z.input<T> };
  out: { [K in Target]: z.output<T> };
};
type SchemaMap = {
  [K in keyof ValidationTargets]?: ZodType;
};
type Intersect<T> = (T extends unknown ? (x: T) => void : never) extends (x: infer R) => void ? R : never;
type InferInputFromSchemaMap<S extends SchemaMap> = Intersect<
  {
    [K in keyof S]: S[K] extends ZodType ? V<S[K], K & keyof ValidationTargets> : never;
  }[keyof S]
>;

type withValidatesErrorResponse<R> = R extends (error?: string) => string
  ? RedirectResponse<302>
  : JsonErrorResponse<400>;
type withValidatesResponse<R> = withValidatesErrorResponse<R> | undefined;

export function withValidates<
  E extends Env,
  P extends string,
  S extends SchemaMap,
  // biome-ignore lint/complexity/noBannedTypes: from hono
  I extends Input = {},
  R extends ((error?: string) => string) | undefined = undefined,
>(schemas: S, redirectUrlFn?: R) {
  return createMiddleware<E, P, I & InferInputFromSchemaMap<S>, withValidatesResponse<R>>(async (c, next) => {
    const makeResponse = (message: string) => {
      if (redirectUrlFn) {
        return c.redirect(redirectUrlFn(message));
      }
      return c.json(error(message), 400);
    };

    const targets = Object.keys(schemas) as (keyof S)[];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      let value: unknown = {};
      const contentType = c.req.header("Content-Type");

      switch (target) {
        case "json": {
          if (!contentType || !jsonRegex.test(contentType)) {
            break;
          }
          try {
            value = await c.req.json();
          } catch (_err) {
            return makeResponse("Malformed JSON");
          }
          break;
        }
        case "form": {
          if (!contentType || !(multipartRegex.test(contentType) || urlencodedRegex.test(contentType))) {
            break;
          }
          let formData: FormData;
          if (c.req.bodyCache.formData) {
            formData = await c.req.bodyCache.formData;
          } else {
            try {
              const arrayBuffer = await c.req.arrayBuffer();
              formData = await bufferToFormData(arrayBuffer, contentType);
              c.req.bodyCache.formData = formData;
            } catch (_err) {
              return makeResponse("Malformed form data");
            }
          }
          const form: BodyData<{ all: true }> = {};
          formData.forEach((value2, key) => {
            if (key.endsWith("[]")) {
              // biome-ignore lint/suspicious/noAssignInExpressions: from hono
              ((form[key] ??= []) as unknown[]).push(value2);
            } else if (Array.isArray(form[key])) {
              (form[key] as unknown[]).push(value2);
            } else if (key in form) {
              form[key] = [form[key], value2];
            } else {
              form[key] = value2;
            }
          });
          value = form;
          break;
        }
        case "query": {
          value = Object.fromEntries(
            Object.entries(c.req.queries()).map(([k, v]) => {
              return v.length === 1 ? [k, v[0]] : [k, v];
            }),
          );
          break;
        }
        case "param": {
          value = c.req.param();
          break;
        }
        case "header": {
          value = c.req.header();
          break;
        }
        case "cookie": {
          value = getCookie(c);
          break;
        }
      }

      if (target === "header" && schema instanceof z.ZodObject) {
        const schemaKeys = Object.keys(schema.shape);
        const caseInsensitiveKeymap = Object.fromEntries(schemaKeys.map(key => [key.toLowerCase(), key]));
        const headerValue = value as Record<string, string>;
        value = Object.fromEntries(
          Object.entries(headerValue).map(([key, value2]) => [caseInsensitiveKeymap[key] || key, value2]),
        );
      }

      // @ts-expect-error
      const result = await schema.safeParseAsync(value);

      if (!result.success) {
        return makeResponse("Invalid input");
      }

      c.req.addValidatedData(target as keyof ValidationTargets, result.data as never);
    }

    await next();
  });
}
