import { queryOptions } from '@tanstack/react-query';

import { getWriteup, getWriteupContent, getWriteups, getWriteupTags } from '@/libs/api';

export const writeupsQueryOptions = () => queryOptions({
  queryKey: ['writeups'],
  queryFn: () => getWriteups({}),
});

export const writeupQueryOptions = (writeupId: number, includeContent: boolean) => queryOptions({
  queryKey: ['writeups', writeupId, { includeContent }],
  queryFn: () => getWriteup(writeupId),
});

export const writeupTagsQueryOptions = (writeupId: number) => queryOptions({
  queryKey: ['writeups', writeupId, 'tags'],
  queryFn: () => getWriteupTags(writeupId),
});

export const writeupContentQueryOptions = (writeupId: number) => queryOptions({
  queryKey: ['writeups', writeupId, 'content'],
  queryFn: () => getWriteupContent(writeupId),
});
