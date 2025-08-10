import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const AnonymousUser = createParamDecorator((data: never, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request?.anonymous_user ?? null;
});
