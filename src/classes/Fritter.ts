//
// Imports
//

import http from "node:http";
import stream from "node:stream";

import { isEmptyBodyStatusCode } from "@lorenstuff/universal-utilities";

import { FritterContext } from "./FritterContext.js";

import { MiddlewareFunction } from "../types/MiddlewareFunction.js";

//
// Class
//

/** Options for a Fritter instance. */
export type FritterOptions =
{
	/** The name of the header containing one or more IP addresses of proxies. Optional, defaults to X-Forwarded-For. */
	proxyIpHeaderName?: string;

	/** The amount of segments in the hostname that are considered the base domain. Optional, defaults to 2. */
	subdomainOffset?: number;

	/** Whether to trust the X-Forwarded-For and X-Forwarded-Proto headers. Optional, defaults to false. */
	trustProxyHeaders?: boolean;
};

/** A web server. */
export class Fritter
{
	/** The name of the header containing one or more IP addresses of proxies. */
	proxyIpHeaderName: string;

	/** The amount of segments in the hostname that are considered the base domain. */
	subdomainOffset: number;

	/** Whether to trust the proxy IP header. */
	trustProxyHeaders: boolean;

	/** The middleware stack. */
	middlewareStack: MiddlewareFunction[];

	/** The underlying Node.js HTTP server. */
	server: http.Server;

	/** Constructs a new Fritter instance. */
	constructor(options: FritterOptions = {})
	{
		this.proxyIpHeaderName = options.proxyIpHeaderName ?? "X-Forwarded-For";

		this.subdomainOffset = options.subdomainOffset ?? 2;

		this.trustProxyHeaders = options.trustProxyHeaders ?? false;

		this.middlewareStack = [];

		this.server = http.createServer(this.#handleRequest.bind(this));
	}

	/**
	 * Starts an HTTP server on the specified port.
	 *
	 * @param port The port to listen on.
	 */
	async start(port: number)
	{
		return new Promise<void>(
			(resolve, reject) =>
			{
				this.server.listen(port, () => resolve());

				this.server.on("error", (error) => reject(error));
			});
	}

	/**
	 * Stops the HTTP server.
	 */
	async stop()
	{
		return new Promise<void>(
			(resolve, reject) =>
			{
				if (this.server == null)
				{
					resolve();

					return;
				}

				this.server.close((error) =>
				{
					if (error)
					{
						reject(error);
					}
					else
					{
						resolve();
					}
				});
			});
	}

	/**
	 * Adds a middleware to the stack.
	 *
	 * @param fritterMiddleware A Fritter middleware function.
	 */
	use<Type extends FritterContext = FritterContext>(fritterMiddleware: MiddlewareFunction<Type>)
	{
		this.middlewareStack.push(fritterMiddleware as MiddlewareFunction);
	}

	async #handleRequest(request: http.IncomingMessage, response: http.ServerResponse)
	{
		//
		// Set Default Status Code (404)
		//

		response.statusCode = 404;

		//
		// Create Fritter Context
		//

		const fritterContext = new FritterContext(this, request, response);

		//
		// Create Recursive Middleware Execution Function
		//

		let currentIndex = -1;

		const executeMiddleware = async () =>
		{
			currentIndex += 1;

			const nextMiddleware = this.middlewareStack[currentIndex];

			if (nextMiddleware != null)
			{
				await nextMiddleware(fritterContext, executeMiddleware);
			}
		};

		//
		// Execute Middleware Stack
		//

		try
		{
			await executeMiddleware();
		}
		catch (error)
		{
			console.error("[Fritter] Error while executing middleware stack:", error);

			if (!response.writable)
			{
				return;
			}

			response.statusCode = 500;
			response.setHeader("Content-Type", "text/plain");
			response.end("Internal server error.");

			return;
		}

		//
		// Get Request Parameters
		//

		const body = fritterContext.fritterResponse.getBody();

		const statusCode = fritterContext.fritterResponse.getStatusCode();

		//
		// Ignore Body
		//

		if (isEmptyBodyStatusCode(statusCode))
		{
			response.end();

			return;
		}

		//
		// Head Response
		//

		if (fritterContext.fritterRequest.getHttpMethod() == "HEAD")
		{
			if (!response.headersSent && fritterContext.fritterResponse.getHeaderValue("Content-Length") == null)
			{
				const contentLength = fritterContext.fritterResponse.getContentLength();

				if (contentLength != null)
				{
					fritterContext.fritterResponse.setHeaderValue("Content-Length", contentLength.toString());
				}
			}

			response.end();

			return;
		}

		//
		// Status Code Body
		//

		if (body == null)
		{
			if (fritterContext.fritterResponse.hasExplicitlyNullBody())
			{
				fritterContext.fritterResponse.removeHeaderValue("Content-Type");
				fritterContext.fritterResponse.removeHeaderValue("Transfer-Encoding");

				fritterContext.fritterResponse.setContentLength(0);

				response.end();

				return;
			}

			const statusCodeBody = statusCode.toString();

			if (!response.headersSent)
			{
				fritterContext.fritterResponse.setContentType("text/plain");

				fritterContext.fritterResponse.setContentLength(statusCodeBody.length);
			}

			response.end(statusCodeBody);

			return;
		}

		//
		// Responses
		//

		if (Buffer.isBuffer(body) || typeof body == "string")
		{
			response.end(body);

			return;
		}
		else if (body instanceof stream.Stream)
		{
			body.pipe(response);

			return;
		}
		else
		{
			const bodyString = JSON.stringify(body);

			if (!response.headersSent)
			{
				fritterContext.fritterResponse.setContentType("application/json");

				fritterContext.fritterResponse.setContentLength(Buffer.byteLength(bodyString));
			}

			response.end(bodyString);
		}
	}
}