import { hcWithType, type InferRequestType } from "@kakiage/server/rpc";

class ApiError extends Error {
  status?: number;
  body?: any;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/* client */

export const apiClient = hcWithType(import.meta.env.API_URL || "");

/* auth */

export const getLoginLink = () => "/api/v1/auth/login";

export const getLogoutLink = () => "/api/v1/auth/logout";

/* categories */

export const getCategories = async () => {
  const res = await apiClient.api.v1.categories.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return data.data.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  throw new ApiError("Failed to fetch", res.status);
};

export const createCategory = async (
  payload: InferRequestType<typeof apiClient.api.v1.categories.$post>['json']
) => {
  const res = await apiClient.api.v1.categories.$post({ json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const updateCategory = async (
  id: string,
  payload: InferRequestType<typeof apiClient.api.v1.categories[':id']['$patch']>['json']
) => {
  const res = await apiClient.api.v1.categories[':id'].$patch({ param: { id }, json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const deleteCategory = async (
  id: string
) => {
  const res = await apiClient.api.v1.categories[':id'].$delete({ param: { id } });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* ctfs */

export const getCtfs = async () => {
  const res = await apiClient.api.v1.ctfs.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return data.data.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    startAt: new Date(item.startAt),
    endAt: new Date(item.endAt),
  }));
  throw new ApiError("Failed to fetch", res.status);
};

export const getCtfDetail = async (
  id: string
) => {
  const res = await apiClient.api.v1.ctfs[':id'].$get({ param: { id } });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
    startAt: new Date(data.data.startAt),
    endAt: new Date(data.data.endAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const createCtf = async (
  payload: InferRequestType<typeof apiClient.api.v1.ctfs.$post>['json']
) => {
  const res = await apiClient.api.v1.ctfs.$post({ json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
    startAt: new Date(data.data.startAt),
    endAt: new Date(data.data.endAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const updateCtf = async (
  id: string,
  payload: InferRequestType<typeof apiClient.api.v1.ctfs[':id']['$patch']>['json']
) => {
  const res = await apiClient.api.v1.ctfs[':id'].$patch({ param: { id }, json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
    startAt: new Date(data.data.startAt),
    endAt: new Date(data.data.endAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const deleteCtf = async (
  id: string
) => {
  const res = await apiClient.api.v1.ctfs[':id'].$delete({ param: { id } });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* images */

export const uploadImage = async (
  payload: InferRequestType<typeof apiClient.api.v1.images.upload.$post>['form']
) => {
  const res = await apiClient.api.v1.images.upload.$post({ form: payload });
  const data = await res.json();
  if (res.ok && data.success) return data.data;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const getImageUrl = (id: string) => "/api/v1/images/" + id;

/* tags */

export const getTags = async () => {
  const res = await apiClient.api.v1.tags.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return data.data.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
  throw new ApiError("Failed to fetch", res.status);
};

/* users */

export const getLoggedInUser = async () => {
  const res = await apiClient.api.v1.users.me.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success) return {
    ...data.data,
    createdAt: new Date(data.data.createdAt),
    updatedAt: new Date(data.data.updatedAt),
  };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};
