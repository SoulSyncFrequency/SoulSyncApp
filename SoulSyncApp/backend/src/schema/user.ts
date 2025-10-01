// schema/user.ts
import { z } from "zod";
import { extendZodWithOpenApi, OpenAPIRegistry, generateOpenApiDocument } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const UserCreate = z.object({
  email: z.string().email(),
  name: z.string().min(2),
}).openapi("UserCreate");

export const User = UserCreate.extend({
  id: z.string(),
}).openapi("User");
