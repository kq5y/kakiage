import { hcWithType, type InferRequestType } from "@kakiage/server/rpc";

class ApiError extends Error {
  status?: number;
  body?: unknown;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/* client */

export const apiClient = hcWithType(import.meta.env.PUBLIC_API_URL || "");

/* auth */

export const getLoginLink = () => "/api/v1/auth/login";

export const getLogoutLink = () => "/api/v1/auth/logout";

/* categories */

export const getCategories = async () => {
  const res = await apiClient.api.v1.categories.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return data.data.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  throw new ApiError("Failed to fetch", res.status);
};

export const createCategory = async (payload: InferRequestType<typeof apiClient.api.v1.categories.$post>["json"]) => {
  const res = await apiClient.api.v1.categories.$post({ json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const updateCategory = async (
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.categories)[":id"]["$patch"]>["json"],
) => {
  const res = await apiClient.api.v1.categories[":id"].$patch({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const deleteCategory = async (id: number) => {
  const res = await apiClient.api.v1.categories[":id"].$delete({ param: { id: id.toString() } });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* ctfs */

export const getCtfs = async (query: InferRequestType<typeof apiClient.api.v1.ctfs.$get>["query"]) => {
  const res = await apiClient.api.v1.ctfs.$get({ query });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return data.data.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      startAt: new Date(item.startAt),
      endAt: new Date(item.endAt),
    }));
  throw new ApiError("Failed to fetch", res.status);
};

export const getCtfDetail = async (id: number) => {
  const res = await apiClient.api.v1.ctfs[":id"].$get({ param: { id: id.toString() } });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
      startAt: new Date(data.data.startAt),
      endAt: new Date(data.data.endAt),
      writeups: (data.data.writeups ?? []).map(w => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
        tags: (w.tags ?? []).map(wt => ({
          ...wt,
          createdAt: new Date(wt.createdAt),
          updatedAt: new Date(wt.updatedAt),
        })),
        category: {
          ...w.category,
          createdAt: new Date(w.category.createdAt),
          updatedAt: new Date(w.category.updatedAt),
        },
        createdByUser: {
          ...w.createdByUser,
          createdAt: new Date(w.createdByUser.createdAt),
          updatedAt: new Date(w.createdByUser.updatedAt),
        },
      })),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const createCtf = async (payload: InferRequestType<typeof apiClient.api.v1.ctfs.$post>["json"]) => {
  const res = await apiClient.api.v1.ctfs.$post({ json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return {
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
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.ctfs)[":id"]["$patch"]>["json"],
) => {
  const res = await apiClient.api.v1.ctfs[":id"].$patch({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
      startAt: new Date(data.data.startAt),
      endAt: new Date(data.data.endAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const deleteCtf = async (id: number) => {
  const res = await apiClient.api.v1.ctfs[":id"].$delete({ param: { id: id.toString() } });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* images */

export const getImageUploadSign = async () => {
  const res = await apiClient.api.v1.images.sign.$get();
  const data = await res.json();
  if (res.ok && data.success) return data.data;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* tags */

export const getTags = async () => {
  const res = await apiClient.api.v1.tags.$get();
  const data = await res.json();
  // TODO: replace zod parse
  if (res.ok && data.success)
    return data.data.map(item => ({
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
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

/* writeups */

export const getWriteups = async (query: InferRequestType<typeof apiClient.api.v1.writeups.$get>["query"]) => {
  const res = await apiClient.api.v1.writeups.$get({ query });
  const data = await res.json();
  if (res.ok && data.success)
    return data.data.map(w => ({
      ...w,
      createdAt: new Date(w.createdAt),
      updatedAt: new Date(w.updatedAt),
      tags: (w.tags ?? []).map(wt => ({
        ...wt,
        createdAt: new Date(wt.createdAt),
        updatedAt: new Date(wt.updatedAt),
      })),
      category: {
        ...w.category,
        createdAt: new Date(w.category.createdAt),
        updatedAt: new Date(w.category.updatedAt),
      },
      createdByUser: {
        ...w.createdByUser,
        createdAt: new Date(w.createdByUser.createdAt),
        updatedAt: new Date(w.createdByUser.updatedAt),
      },
    }));
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const createWriteup = async (payload: InferRequestType<typeof apiClient.api.v1.writeups.$post>["json"]) => {
  const res = await apiClient.api.v1.writeups.$post({ json: payload });
  const data = await res.json();
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const getWriteup = async (id: number, includeContent: boolean = false) => {
  const res = await apiClient.api.v1.writeups[":id"].$get({
    param: { id: id.toString() },
    query: { content: includeContent ? "true" : undefined },
  });
  const data = await res.json();
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
      tags: (data.data.tags ?? []).map(wt => ({
        ...wt,
        createdAt: new Date(wt.createdAt),
        updatedAt: new Date(wt.updatedAt),
      })),
      category: {
        ...data.data.category,
        createdAt: new Date(data.data.category.createdAt),
        updatedAt: new Date(data.data.category.updatedAt),
      },
      createdByUser: {
        ...data.data.createdByUser,
        createdAt: new Date(data.data.createdByUser.createdAt),
        updatedAt: new Date(data.data.createdByUser.updatedAt),
      },
      ctf: {
        ...data.data.ctf,
        createdAt: new Date(data.data.ctf.createdAt),
        updatedAt: new Date(data.data.ctf.updatedAt),
      },
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const getWriteupTags = async (id: number) => {
  const res = await apiClient.api.v1.writeups[":id"].tags.$get({ param: { id: id.toString() } });
  const data = await res.json();
  if (res.ok && data.success)
    return data.data.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const addWriteupTag = async (
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.writeups)[":id"]["tags"]["$post"]>["json"],
) => {
  const res = await apiClient.api.v1.writeups[":id"].tags.$post({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const removeWriteupTag = async (
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.writeups)[":id"]["tags"]["$delete"]>["json"],
) => {
  const res = await apiClient.api.v1.writeups[":id"].tags.$delete({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const getWriteupContent = async (id: number, password?: string) => {
  const res = await apiClient.api.v1.writeups[":id"].content.$get({
    param: { id: id.toString() },
    header: { "x-password": password },
  });
  const data = await res.json();
  if (res.ok && data.success) return data.data;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const updateWriteup = async (
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.writeups)[":id"]["$patch"]>["json"],
) => {
  const res = await apiClient.api.v1.writeups[":id"].$patch({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const updateWriteupContent = async (
  id: number,
  payload: InferRequestType<(typeof apiClient.api.v1.writeups)[":id"]["content"]["$patch"]>["json"],
) => {
  const res = await apiClient.api.v1.writeups[":id"].content.$patch({ param: { id: id.toString() }, json: payload });
  const data = await res.json();
  if (res.ok && data.success)
    return {
      ...data.data,
      createdAt: new Date(data.data.createdAt),
      updatedAt: new Date(data.data.updatedAt),
    };
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};

export const deleteWriteup = async (id: number) => {
  const res = await apiClient.api.v1.writeups[":id"].$delete({ param: { id: id.toString() } });
  const data = await res.json();
  if (res.ok && data.success) return data.success;
  if (!data.success && data.message) throw new ApiError(data.message, res.status);
  throw new ApiError("Failed to fetch", res.status);
};
