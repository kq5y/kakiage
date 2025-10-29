import { queryOptions } from '@tanstack/react-query';

import { getCtfDetail, getCtfs } from '@/libs/api';

export const ctfDetailQueryOptions = (ctfId: number) => queryOptions({
  queryKey: ['ctfs', ctfId],
  queryFn: () => getCtfDetail(ctfId),
});

export const ctfsQueryOptions = () => queryOptions({
  queryKey: ['ctfs'],
  queryFn: () => getCtfs({}),
});
