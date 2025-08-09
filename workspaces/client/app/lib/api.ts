import { hcWithType } from "@kakiage/server/rpc";

export const apiClient = hcWithType(import.meta.env.API_URL || "");
