//
// Imports
//

import { isLocalIpAddress } from "@lorenstuff/universal-utilities";

import { FritterContext } from "../classes/FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	allowInsecureLocalIpAddresses?: boolean;
};

export type CreateResult =
{
	allowInsecureLocalIpAddresses: boolean;
	execute: FritterMiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options?: CreateOptions): CreateResult
{
	const forceSslMiddleware: CreateResult =
	{
		allowInsecureLocalIpAddresses: options?.allowInsecureLocalIpAddresses ?? false,

		execute: async (context, next) =>
		{
			if (context.fritterRequest.isSecure())
			{
				return await next();
			}

			if (forceSslMiddleware.allowInsecureLocalIpAddresses && isLocalIpAddress(context.fritterRequest.getIp()))
			{
				return await next();
			}

			const url = new URL(context.fritterRequest.getUrl());

			url.protocol = "https:";

			context.fritterResponse.setRedirect(url.toString());
		},
	};

	return forceSslMiddleware;
}