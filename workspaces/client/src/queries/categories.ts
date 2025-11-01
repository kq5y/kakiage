import { queryOptions } from "@tanstack/react-query";

import { getCategories } from "@/libs/api";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
}

export const categoriesQueryOptions = queryOptions({
  queryKey: categoriesQueryKeys.all,
  queryFn: getCategories,
});
