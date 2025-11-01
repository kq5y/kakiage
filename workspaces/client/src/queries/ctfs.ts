import { queryOptions } from "@tanstack/react-query";

import { getCtfDetail, getCtfs } from "@/libs/api";

export const ctfsQueryKeys = {
  all: ["ctfs"] as const,
  detail: (ctfId: number) => ["ctfs", ctfId] as const,
};

export type CtfDetail = Awaited<ReturnType<typeof getCtfDetail>>;
export type CtfListItem = Awaited<ReturnType<typeof getCtfs>>[number];

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
