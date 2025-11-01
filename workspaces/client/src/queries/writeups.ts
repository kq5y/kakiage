import { queryOptions } from "@tanstack/react-query";

import { getWriteup, getWriteupContent, getWriteups, getWriteupTags } from "@/libs/api";

export const writeupsQueryKeys = {
  all: ["writeups"] as const,
  detail: (writeupId: number, includeContent: boolean = false) => ["writeups", writeupId, ...(includeContent ? ["with-content"] : [])] as const,
  tags: (writeupId: number) => ["writeups", writeupId, "tags"] as const,
  content: (writeupId: number) => ["writeups", writeupId, "content"] as const,
};

export const writeupsQueryOptions = () =>
  queryOptions({
    queryKey: writeupsQueryKeys.all,
    queryFn: () => getWriteups({}),
  });

export const writeupQueryOptions = (writeupId: number, includeContent: boolean) =>
  queryOptions({
    queryKey: writeupsQueryKeys.detail(writeupId, includeContent),
    queryFn: () => getWriteup(writeupId, includeContent),
  });

export const writeupTagsQueryOptions = (writeupId: number) =>
  queryOptions({
    queryKey: writeupsQueryKeys.tags(writeupId),
    queryFn: () => getWriteupTags(writeupId),
  });

export const writeupContentQueryOptions = (writeupId: number) =>
  queryOptions({
    queryKey: writeupsQueryKeys.content(writeupId),
    queryFn: () => getWriteupContent(writeupId),
  });
