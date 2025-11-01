import { queryOptions } from "@tanstack/react-query";

import { getCtfDetail, getCtfs } from "@/libs/api";

export const ctfsQueryKeys = {
  all: ["ctfs"] as const,
  detail: (ctfId: number) => ["ctfs", ctfId] as const,
};

export const ctfDetailQueryOptions = (ctfId: number) =>
  queryOptions({
    queryKey: ctfsQueryKeys.detail(ctfId),
    queryFn: () => getCtfDetail(ctfId),
  });

export const ctfsQueryOptions = () =>
  queryOptions({
    queryKey: ctfsQueryKeys.all,
    queryFn: () => getCtfs({}),
  });
