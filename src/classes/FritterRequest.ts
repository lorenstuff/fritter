//
// Imports
//

import http from "node:http";
import net from "node:net";
import tls from "node:tls";

import accepts from "accepts";
import contentType from "content-type";
import fresh from "fresh";
import typeIs from "type-is";

import { Fritter } from "./Fritter.js";
import { FritterContext } from "./FritterContext.js";

import { FritterHttpMethod } from "../types/FritterHttpMethod.js";

//
// Class
//

/** An object containing information about the request. */
export class FritterRequest
{
	/** The Fritter instance that created this request. */
	fritter: Fritter;

	/** The Fritter context. */
	fritterContext: FritterContext;

	/** The raw Node.js HTTP request. */
	nodeRequest: http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	nodeResponse: http.ServerResponse;

	#accepts: accepts.Accepts;

	#contentLength: number;

	#httpMethod: FritterHttpMethod;

	#ip: string;

	#ips: string[];

	#host: string | null;

	#protocol: "http" | "https";

	#url: URL;

	/**
	 * Constructs a new Fritter request using the given Node.js HTTP request.
	 *
	 * @param fritter The Fritter instance that created this request.
	 * @param fritterContext The Fritter context.
	 * @param nodeRequest A Node.js HTTP request.
	 * @param nodeResponse A Node.js HTTP response.
	 */
	constructor(fritter: Fritter, fritterContext: FritterContext, nodeRequest: http.IncomingMessage, nodeResponse: http.ServerResponse)
	{
		this.fritter = fritter;

		this.fritterContext = fritterContext;

		this.nodeRequest = nodeRequest;

		this.nodeResponse = nodeResponse;
	}

	/** Gets the Accepts object for this request. */
	getAccepts()
	{
		if (this.#accepts === undefined)
		{
			this.#accepts = accepts(this.nodeRequest);
		}

		return this.#accepts;
	}

	/** Gets the charset of the request's content type. */
	getCharset()
	{
		try
		{
			const parsedMediaType = contentType.parse(this.nodeRequest);

			return parsedMediaType.parameters["charset"] ?? null;
		}
		catch (error)
		{
			return null;
		}
	}

	/** Gets the content length of the request. */
	getContentLength()
	{
		if (this.#contentLength === undefined)
		{
			const contentLengthHeader = this.getHeaderValue("Content-Length");

			if (contentLengthHeader != null)
			{
				const contentLength = parseInt(contentLengthHeader);

				this.#contentLength = isNaN(contentLength) ? 0 : contentLength;
			}
			else
			{
				this.#contentLength = 0;
			}
		}

		return this.#contentLength;
	}

	/** Gets the content type of the request. */
	getContentType()
	{
		const contentTypeHeader = this.getHeaderValue("Content-Type");

		if (contentTypeHeader == null)
		{
			return null;
		}

		try
		{
			const parsedMediaType = contentType.parse(this.nodeRequest);

			return parsedMediaType.type;
		}
		catch (error)
		{
			// Note: contentType.parse throws if there was no Content-Type header.
			return null;
		}
	}

	/**
	 * If the request has no body, returns null.
	 *
	 * If the request has a body but is none of the types specified, returns false.
	 *
	 * Otherwise, returns the type of the request body.
	 */
	getFirstMatchingType(types: string[])
	{
		return typeIs.is(this.getContentType() ?? "", ...types);
	}

	/**
	 * Gets the first value of the given header.
	 *
	 * @param headerName The name of the header to get the value of. This is case-insensitive.
	 * @returns The first value of the given header, or null if the header does not exist.
	 */
	getHeaderValue(headerName: string)
	{
		//
		// Convert Header Name to Lowercase
		//

		headerName = headerName.toLowerCase();

		//
		// Special Case for Referrer
		//

		if (headerName === "referrer")
		{
			headerName = "referer";
		}

		//
		// Get Header Value
		//

		const headerValue = this.nodeRequest.headers[headerName];

		if (Array.isArray(headerValue))
		{
			if (headerValue[0] == null)
			{
				return null;
			}

			return headerValue[0];
		}

		return headerValue ?? null;
	}

	/**
	 * Gets all values of the given header.
	 *
	 * @param headerName The name of the header to get the values of. This is case-insensitive.
	 * @returns An array of all values of the given header, or an empty array if the header does not exist.
	 */
	getHeaderValueArray(headerName: string)
	{
		const headerValue = this.nodeRequest.headers[headerName.toLowerCase()];

		if (Array.isArray(headerValue))
		{
			return headerValue;
		}

		if (headerValue != null)
		{
			return [ headerValue ];
		}

		return [];
	}

	/** Gets the HTTP method of the request. */
	getHttpMethod()
	{
		if (this.#httpMethod === undefined)
		{
			this.#httpMethod = (this.nodeRequest.method as string).toUpperCase() as FritterHttpMethod;
		}

		return this.#httpMethod;
	}

	/** Gets the host of the request. */
	getHost()
	{
		if (this.#host === undefined)
		{
			if (this.fritter.trustProxyHeaders)
			{
				this.#host = this.getHeaderValue("X-Forwarded-Host");
			}

			if (this.#host == null && this.nodeRequest.httpVersionMajor >= 2)
			{
				this.#host = this.getHeaderValue(":authority");
			}

			if (this.#host == null)
			{
				this.#host = this.getHeaderValue("Host");
			}
		}

		return this.#host;
	}

	/** Gets the hostname (host without port) of the request. */
	getHostName()
	{
		const host = this.getHost();

		if (host == null)
		{
			return null;
		}

		const colonIndex = host.indexOf(":");

		if (colonIndex === -1)
		{
			return host;
		}

		return host.substring(0, colonIndex);
	}

	/** Gets the full href of the request. */
	getHref()
	{
		return this.getUrl().href;
	}

	/** Gets the IP address of the request. */
	getIp()
	{
		if (this.#ip === undefined)
		{
			this.#ip = this.getIpChain()[0] ?? "";
		}

		return this.#ip;
	}

	/** Gets the IP address chain of the request, starting with the client IP. */
	getIpChain()
	{
		if (this.#ips === undefined)
		{
			if (this.fritter.trustProxyHeaders)
			{
				const forwardedForHeader = this.getHeaderValue(this.fritter.proxyIpHeaderName);

				if (forwardedForHeader != null)
				{
					this.#ips = forwardedForHeader.split(/\s*,\s*/).map(ip => ip.trim());
				}
			}
		}

		if (this.#ips === undefined)
		{
			this.#ips =
			[
				this.nodeRequest.socket.remoteAddress ?? "",
			];
		}

		return this.#ips;
	}

	/** Gets the origin of the request. */
	getOrigin()
	{
		return this.getProtocol() + "://" + this.getHost();
	}

	/** Gets the path of the request, without the query string. */
	getPath()
	{
		return this.getUrl().pathname;
	}

	/** The protocol of the request. */
	getProtocol()
	{
		if (this.#protocol === undefined)
		{
			const isEncryptedSocket = (this.nodeRequest.socket as tls.TLSSocket).encrypted ?? false;

			if (isEncryptedSocket)
			{
				this.#protocol = "https";
			}
			else if (!this.fritter.trustProxyHeaders)
			{
				this.#protocol = "http";
			}
			else
			{
				const forwardedProtocolHeader = this.getHeaderValue("X-Forwarded-Proto");

				if (forwardedProtocolHeader != null)
				{
					const components = forwardedProtocolHeader.split(/\s*,\s*/);

					const protocol = components[0]?.toLowerCase() ?? "http";

					if (protocol == "http" || protocol == "https")
					{
						this.#protocol = protocol;
					}
					else
					{
						this.#protocol = "http";
					}
				}
				else
				{
					this.#protocol = "http";
				}
			}
		}

		return this.#protocol;
	}

	/** Gets the query parameters of the request. */
	getSearchParams()
	{
		return this.getUrl().searchParams;
	}

	/** Gets the socket of the request. */
	getSocket()
	{
		return this.nodeRequest.socket;
	}

	/** Gets the subdomains of the request. */
	getSubdomains()
	{
		const hostName = this.getHostName();

		if (hostName == null)
		{
			return [];
		}

		if (net.isIP(hostName) != 0)
		{
			return [];
		}

		return hostName.split(".")
			.reverse()
			.slice(this.fritter.subdomainOffset);
	}

	/** A URL object representing the URL of the request. */
	getUrl()
	{
		if (this.#url === undefined)
		{
			this.#url = new URL(this.nodeRequest.url as string, this.getProtocol() + "://" + this.getHost());
		}

		return this.#url;
	}

	/** Returns true if the request has a body. */
	hasBody()
	{
		return typeIs.hasBody(this.nodeRequest);
	}

	/** Returns true if the client has an up-to-date copy of the resource. */
	isFresh()
	{
		const method = this.getHttpMethod();

		if (method != "GET" && method != "HEAD")
		{
			return false;
		}

		const statusCode = this.nodeResponse.statusCode;

		if (statusCode >= 200 && statusCode < 300 || statusCode == 304)
		{
			return fresh(this.nodeRequest.headers, this.nodeResponse.getHeaders());
		}

		return false;
	}

	/** Returns true if the request is idempotent. */
	isIdempotent()
	{
		const method = this.getHttpMethod();

		return [ "GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE" ].includes(method);
	}

	/** Returns true if the request is secure. */
	isSecure()
	{
		return this.getProtocol() == "https";
	}

	/** Returns true if the client has an out-of-date copy of the resource. */
	isStale()
	{
		return !this.isFresh();
	}

	/** Sets the content length of the request. */
	setContentLength(value: number)
	{
		this.#contentLength = value;
	}

	/** Sets the HTTP method of the request. */
	setHttpMethod(method: FritterHttpMethod)
	{
		this.#httpMethod = method;
	}

	/** Sets the host of the request. */
	setHost(value: string | null)
	{
		this.#host = value;
	}

	/** Sets the IP address of the request. */
	setIp(value: string)
	{
		this.#ip = value;
	}

	/** Sets the protocol of the request. */
	setProtocol(protocol: "http" | "https")
	{
		this.#protocol = protocol;
	}

	/** Sets the URL of the request. */
	setUrl(url: URL)
	{
		this.#url = url;
	}
}