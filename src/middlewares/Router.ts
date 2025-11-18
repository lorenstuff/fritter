//
// Imports
//

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { pathToRegexp } from "path-to-regexp";

import { FritterContext } from "../classes/FritterContext.js";

import { FritterHttpMethod } from "../types/FritterHttpMethod.js";
import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Types
//

export type Route<RouteFritterContext extends MiddlewareFritterContext = MiddlewareFritterContext> =
{
	method: FritterHttpMethod | "ALL";
	path: string;
	middlewares?: FritterMiddlewareFunction<RouteFritterContext>[];
	handler: FritterMiddlewareFunction<RouteFritterContext>;
};

//
// Middleware
//

export type MiddlewareFritterContext = FritterContext &
{
	routeParameters: Record<string, string>;
};

export type CreateOptions =
{
	routes?: Route[];
};

export type CreateResult =
{
	routes: Route[];

	addRoute: (route: Route) => void;
	loadRoutesDirectory: (directoryPath: string) => Promise<Route[]>;
	loadRoutesFile: (filePath: string) => Promise<Route[]>;
	removeRoute: (route: Route) => void;

	execute: FritterMiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const routerMiddleware: CreateResult =
	{
		routes: options.routes ?? [],

		addRoute: (route) =>
		{
			routerMiddleware.routes.push(route);
		},
		loadRoutesDirectory: async (directoryPath) =>
		{
			const directoryRoutes: Route[] = [];
	
			const directoryEntries = await fs.promises.readdir(directoryPath,
				{
					withFileTypes: true,
				});
	
			for (const directoryEntry of directoryEntries)
			{
				const directoryEntryPath = path.join(directoryPath, directoryEntry.name);
	
				if (directoryEntry.isDirectory())
				{
					const subdirectoryRoutes = await routerMiddleware.loadRoutesDirectory(directoryEntryPath);
	
					directoryRoutes.push(...subdirectoryRoutes);
				}
				else
				{
					const parsedPath = path.parse(directoryEntryPath);
	
					if (parsedPath.ext != ".js")
					{
						continue;
					}
	
					const fileRoutes = await routerMiddleware.loadRoutesFile(directoryEntryPath);
	
					directoryRoutes.push(...fileRoutes);
				}
			}
	
			return directoryRoutes;
		},
		loadRoutesFile: async (filePath) =>
		{
			const routeContainer = await import(url.pathToFileURL(filePath).toString()) as
			{
				route?: Route | Route[],
				routes?: Route | Route[],
			};
	
			const routeOrRoutes = routeContainer.route ?? routeContainer.routes;
	
			if (routeOrRoutes == null)
			{
				return [];
			}
	
			if (Array.isArray(routeOrRoutes))
			{
				for (const route of routeOrRoutes)
				{
					routerMiddleware.routes.push(route);
				}
	
				return routeOrRoutes;
			}
			else
			{
				routerMiddleware.routes.push(routeOrRoutes);
	
				return [ routeOrRoutes ];
			}
		},
		removeRoute: (route) =>
		{
			const index = routerMiddleware.routes.indexOf(route);
	
			if (index != -1)
			{
				routerMiddleware.routes.splice(index, 1);
			}
		},

		execute: async (context, next) =>
		{	
			context.routeParameters = {};
	
			for (const route of routerMiddleware.routes)
			{	
				if (route.method != "ALL" && route.method != context.fritterRequest.getHttpMethod())
				{
					continue;
				}

				const { regexp: regExp, keys: rawRouteParameters } = pathToRegexp(route.path);
	
				const matches = regExp.exec(context.fritterRequest.getPath());
				if (matches == null)
				{
					continue;
				}
	
				for (const [ matchIndex, match ] of matches.slice(1).entries())
				{
					const rawRouteParameter = rawRouteParameters[matchIndex];
	
					if (rawRouteParameter != null && match != undefined)
					{
						context.routeParameters[rawRouteParameter.name] = decodeURIComponent(match);
					}
				}
	
				let currentIndex = -1;
	
				const middlewares =
				[
					...route.middlewares ?? [],
					route.handler,
				];
	
				const executeMiddleware = async () =>
				{
					currentIndex += 1;
	
					const nextMiddleware = middlewares[currentIndex];
	
					if (nextMiddleware != null)
					{
						await nextMiddleware(context, executeMiddleware);
					}
					else
					{
						await next();
					}
				};
	
				await executeMiddleware();
	
				return;
			}
	
			await next();
		},
	};

	return routerMiddleware;
}