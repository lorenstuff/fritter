//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateResult =
{
	execute: FritterMiddlewareFunction<MiddlewareFritterContext>;
};

export function create(): CreateResult
{
	return {
		execute: async (context, next) =>
		{
			context.fritterResponse.setHeaderValue("X-Frame-Options", "SAMEORIGIN");

			await next();
		},
	};
}