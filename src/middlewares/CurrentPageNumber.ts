//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Middleware
//

export type MiddlewareFritterContext<T = null> = FritterContext &
{
	currentPageNumber: number;
	getPagination: (totalPageCount: number) => T;
};

export type CreateOptions<T = null> =
{
	getPageNumber?: (context: MiddlewareFritterContext<T>) => number;
	getPagination?: (context: MiddlewareFritterContext<T>, totalPageCount: number) => T;
};

export type CreateResult<T = null> =
{
	getPageNumber: (context: MiddlewareFritterContext<T>) => number;
	getPagination: (context: MiddlewareFritterContext<T>, totalPageCount: number) => T;
	execute: FritterMiddlewareFunction<MiddlewareFritterContext<T>>;
};

export function create<T = null>(options: CreateOptions<T> = {}): CreateResult<T>
{
	const currentPageNumberMiddleware: CreateResult<T> =
	{
		getPageNumber: options.getPageNumber ??
			((context) =>
			{
				let currentPage = parseInt(context.fritterRequest.getSearchParams().get("page") ?? "1");

				return isNaN(currentPage) ? 1 : currentPage;
			}),

		getPagination: options.getPagination ?? (() => null as T),

		execute: async (context, next) =>
		{
			const currentPageNumber = currentPageNumberMiddleware.getPageNumber(context);

			context.currentPageNumber = currentPageNumber;

			context.getPagination = (totalPageCount) => currentPageNumberMiddleware.getPagination(context, totalPageCount);

			await next();
		},
	};

	return currentPageNumberMiddleware;
}