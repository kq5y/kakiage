import { queryOptions } from "@tanstack/react-query";

import { getCategories } from "@/libs/api";

export const categoriesQueryOptions = queryOptions({
  queryKey: ["categories"],
  queryFn: getCategories,
});
