import { hcWithType } from "@kakiage/server/rpc";

type RpcCall = (...args: any[]) => any;
type FirstArg<F extends RpcCall> = F extends (arg: infer A, ...rest: any[]) => any ? A : never;
type ApiRequest<F extends RpcCall> =
  FirstArg<F> extends { json?: infer J } ? J :
  FirstArg<F> extends { body?: infer B } ? B :
  FirstArg<F> extends { form?: infer Fm } ? Fm :
  FirstArg<F>;

/* client */

export const apiClient = hcWithType(import.meta.env.API_URL || "");

/* auth */

export const getLoginLink = () => apiClient.api.v1.auth.login.$url();

/* categories */

export const getCategories = () => apiClient.api.v1.categories.$get();
export const createCategory = (
  payload: ApiRequest<typeof apiClient.api.v1.categories.$post>
) => apiClient.api.v1.categories.$post({ json: payload });
export const updateCategory = (
  id: string,
  payload: ApiRequest<typeof apiClient.api.v1.categories[':id']['$patch']>
) => apiClient.api.v1.categories[':id'].$patch({ param: { id }, json: payload });
export const deleteCategory = (
  id: string
) => apiClient.api.v1.categories[':id'].$delete({ param: { id } });

/* ctfs */

export const getCtfs = () => apiClient.api.v1.ctfs.$get();
export const getCtfDetail = (
  id: string
) => apiClient.api.v1.ctfs[':id'].$get({ param: { id } });
export const createCtf = (
  payload: ApiRequest<typeof apiClient.api.v1.ctfs.$post>
) => apiClient.api.v1.ctfs.$post({ json: payload });
export const updateCtf = (
  id: string,
  payload: ApiRequest<typeof apiClient.api.v1.ctfs[':id']['$patch']>
) => apiClient.api.v1.ctfs[':id'].$patch({ param: { id }, json: payload });
export const deleteCtf = (
  id: string
) => apiClient.api.v1.ctfs[':id'].$delete({ param: { id } });

/* images */

export const uploadImage = (
  payload: ApiRequest<typeof apiClient.api.v1.images.upload.$post>
) => apiClient.api.v1.images.upload.$post({ form: payload });
export const getImageUrl = (
  id: string
) => apiClient.api.v1.images[":id"].$url({ param: { id } });

/* tags */

export const getTags = () => apiClient.api.v1.tags.$get();

/* users */

export const getLoggedInUser = () => apiClient.api.v1.users.me.$get();
