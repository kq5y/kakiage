import type { Context, Input, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import type { HandlerResponse, ValidationTargets } from 'hono/types';

import type { ZodType } from 'zod';
import z from 'zod';

import { error, JsonErrorResponse } from '@/libs/response';

type V<T extends ZodType, Target extends keyof ValidationTargets> = {
  in: { [K in Target]: z.input<T> };
  out: { [K in Target]: z.output<T> };
};

type AsyncHandler<E extends Env, P extends string, I extends Input, R> =
  (c: Context<E, P, I>, next: Next) => R | Promise<R>;

// ----- from hono -----

var jsonRegex = /^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
var multipartRegex = /^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
var urlencodedRegex = /^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;

var bufferToFormData = (arrayBuffer: ArrayBuffer, contentType: string): Promise<FormData> => {
  const response = new Response(arrayBuffer, {
    headers: {
      "Content-Type": contentType
    }
  });
  return response.formData();
};

// ---------------------

type SchemaMap = {
  [K in keyof ValidationTargets]?: ZodType;
};
type Intersect<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? R : never;
type InferInputFromSchemaMap<S extends SchemaMap> = Intersect<{
  [K in keyof S]: S[K] extends ZodType ? V<S[K], K & keyof ValidationTargets> : never
}[keyof S]>;

export function withValidates<
  S extends SchemaMap,
  I extends Input,
  E extends Env = any,
  P extends string = any,
  R extends HandlerResponse<any> = any
>(
  schemas: S,
  handler: AsyncHandler<E, P, I & InferInputFromSchemaMap<S>, R>,
): AsyncHandler<E, P, I, R | JsonErrorResponse<400>> {
  return async (c, next) => {
    const targets = Object.keys(schemas) as (keyof S)[];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      let value: unknown = {};
      const contentType = c.req.header("Content-Type");

      switch (target) {
        case 'json': {
          if (!contentType || !jsonRegex.test(contentType)) {
            break;
          }
          try {
            value = await c.req.json();
          } catch (err) {
            return c.json(error('Malformed JSON'), 400);
          }
          break;
        }
        case 'form': {
          if (!contentType || !(multipartRegex.test(contentType) || urlencodedRegex.test(contentType))) {
            break;
          }
          let formData;
          if (c.req.bodyCache.formData) {
            formData = await c.req.bodyCache.formData;
          } else {
            try {
              const arrayBuffer = await c.req.arrayBuffer();
              formData = await bufferToFormData(arrayBuffer, contentType);
              c.req.bodyCache.formData = formData;
            } catch (err) {
              return c.json(error('Malformed form data'), 400);
            }
          }
          const form: any = {};
          formData.forEach((value2: any, key: string) => {
            if (key.endsWith("[]")) {
              ;
              (form[key] ??= []).push(value2);
            } else if (Array.isArray(form[key])) {
              ;
              form[key].push(value2);
            } else if (key in form) {
              form[key] = [form[key], value2];
            } else {
              form[key] = value2;
            }
          });
          value = form;
          break;
        }
        case 'query': {
          value = Object.fromEntries(
            Object.entries(c.req.queries()).map(([k, v]) => {
              return v.length === 1 ? [k, v[0]] : [k, v];
            })
          );
          break;
        }
        case 'param': {
          value = c.req.param();
          break;
        }
        case 'header': {
          value = c.req.header();
          break;
        }
        case 'cookie': {
          value = getCookie(c);
          break;
        }
      }

      if (target === 'header' && schema instanceof z.ZodObject) {
        const schemaKeys = Object.keys(schema.shape);
        const caseInsensitiveKeymap = Object.fromEntries(
          schemaKeys.map((key) => [key.toLowerCase(), key])
        );
        const headerValue = value as Record<string, string>;
        value = Object.fromEntries(
          Object.entries(headerValue).map(([key, value2]) => [caseInsensitiveKeymap[key] || key, value2])
        );
      }

      // @ts-expect-error
      const result = await schema.safeParseAsync(value);

      if (!result.success) {
        return c.json(error('Invalid input'), 400);
      }

      c.req.addValidatedData(target as keyof ValidationTargets, result.data as any);
    }

    return handler(c, next);
  };
}
