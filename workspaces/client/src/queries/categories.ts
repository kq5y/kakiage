import { queryOptions } from "@tanstack/react-query";

import { getCategories } from "@/libs/api";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
};

export type CategoryListItem = Awaited<ReturnType<typeof getCategories>>[number];

export const categoriesQueryOptions = queryOptions({
  queryKey: categoriesQueryKeys.all,
  queryFn: getCategories,
});
