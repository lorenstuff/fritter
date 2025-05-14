//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	allowCredentialsOrigins?: string[];
};

export type CreateResult =
{
	allowCredentialsOrigins: string[];
	execute: FritterMiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const corsMiddleware: CreateResult =
	{
		allowCredentialsOrigins: options.allowCredentialsOrigins ?? [],
		
		execute: async (context, next) =>
		{
			const origin = context.fritterRequest.getHeaderValue("Origin");

			context.fritterResponse.appendVaryHeaderName("Origin");

			if (origin != null && corsMiddleware.allowCredentialsOrigins.includes(origin))
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Credentials", "true");
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Origin", origin);
			}
			else
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Credentials", "false");
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Origin", "*");
			}

			if (context.fritterRequest.getHttpMethod() == "OPTIONS")
			{
				context.fritterResponse.setHeaderValue("Access-Control-Allow-Headers", context.fritterRequest.getHeaderValue("Access-Control-Request-Headers") ?? "");
				context.fritterResponse.setStatusCode(204);

				return;
			}

			await next();
		},
	};

	return corsMiddleware;
}