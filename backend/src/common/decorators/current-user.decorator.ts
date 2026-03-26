import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Décorateur pour accéder à l'utilisateur courant depuis une requête
 * Utilisé sur les contrôleurs avec JWT auth
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
