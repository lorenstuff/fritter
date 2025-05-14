//
// Imports
//

import { FritterContext } from "../classes/FritterContext.js";

import { FritterMiddlewareFunction } from "../types/FritterMiddlewareFunction.js";

//
// Interfaces
//

//
// Create Function
//

export type MiddlewareFritterContext = FritterContext;

export type CreateOptions =
{
	startMessageTemplate?: string;
	endMessageTemplate?: string;
};

export type CreateResult =
{
	startMessageTemplate: string;
	endMessageTemplate: string;
	requestNumber: number;
	execute: FritterMiddlewareFunction<MiddlewareFritterContext>;
};

export function create(options: CreateOptions = {}): CreateResult
{
	const logRequestMiddleware: CreateResult =
	{
		startMessageTemplate: options.startMessageTemplate ?? "[LogRequestMiddleware] Request {{ REQUEST_NUMBER }} | {{ IP }} | {{ HTTP_METHOD }} | {{ PATH }} | Start",
		endMessageTemplate: options.endMessageTemplate ?? "[LogRequestMiddleware] Request {{ REQUEST_NUMBER }} | {{ IP }} | {{ HTTP_METHOD }} | {{ PATH }} | End | Status Code: {{ STATUS_CODE }}",
		requestNumber: 0,
		execute: async (context, next) =>
		{
			//
			// Increment Request Number
			//

			logRequestMiddleware.requestNumber += 1;

			//
			// Start Log
			//

			const startMessage = logRequestMiddleware.startMessageTemplate
				.replace("{{ REQUEST_NUMBER }}", logRequestMiddleware.requestNumber.toString())
				.replace("{{ IP }}", context.fritterRequest.getIp())
				.replace("{{ HTTP_METHOD }}", context.fritterRequest.getHttpMethod())
				.replace("{{ PATH }}", context.fritterRequest.getPath());

			console.log(startMessage);

			//
			// Execute Next Middleware
			//

			await next();

			//
			// End Log
			//

			const endMessage = logRequestMiddleware.endMessageTemplate
				.replace("{{ REQUEST_NUMBER }}", logRequestMiddleware.requestNumber.toString())
				.replace("{{ IP }}", context.fritterRequest.getIp())
				.replace("{{ HTTP_METHOD }}", context.fritterRequest.getHttpMethod())
				.replace("{{ PATH }}", context.fritterRequest.getPath())
				.replace("{{ STATUS_CODE }}", context.fritterResponse.getStatusCode().toString());

			console.log(endMessage);
		},
	};

	return logRequestMiddleware;
}