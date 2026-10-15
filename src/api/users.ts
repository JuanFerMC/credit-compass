import { authApi } from "@/api/auth";
import { createUsersApi } from "@/api/users-client";

export const usersApi = createUsersApi(authApi.request);
