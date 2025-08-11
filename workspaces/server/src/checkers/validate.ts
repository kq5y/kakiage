import type { Context, Input } from 'hono';
import { getCookie } from 'hono/cookie';
import type { ValidationTargets } from 'hono/types';

import type { ZodType } from 'zod';
import z from 'zod';

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

type V<T extends ZodType, Target extends keyof ValidationTargets> = {
  in: { [K in Target]: z.input<T> };
  out: { [K in Target]: z.output<T> };
};
type SchemaMap = {
  [K in keyof ValidationTargets]?: ZodType;
};
type Intersect<T> = (T extends any ? (x: T) => void : never) extends (x: infer R) => void ? R : never;
type InferInputFromSchemaMap<S extends SchemaMap> = Intersect<{
  [K in keyof S]: S[K] extends ZodType ? V<S[K], K & keyof ValidationTargets> : never
}[keyof S]>;

export class ValidateError extends Error {
  constructor(public message: string, public statusCode: 400) {
    super(message);
    this.name = 'ValidateError';
  }
}

export async function checkValidates<
  E extends Env,
  P extends string,
  I extends Input,
  S extends SchemaMap,
>(
  c: Context<E, P, I>,
  schemas: S
): Promise<Context<E, P, I & InferInputFromSchemaMap<S>>> {
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
          throw new ValidateError('Malformed JSON', 400);
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
            throw new ValidateError('Malformed form data', 400);
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
      throw new ValidateError('Invalid input', 400);
    }

    c.req.addValidatedData(target as keyof ValidationTargets, result.data as any);
  }

  return c as unknown as Context<E, P, I & InferInputFromSchemaMap<S>>;
}
