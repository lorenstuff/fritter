//
// Imports
//

import http from "node:http";

import Cookies from "cookies";

import { Fritter } from "./Fritter.js";
import { FritterRequest } from "./FritterRequest.js";
import { FritterResponse } from "./FritterResponse.js";

//
// Class
//

/** An object containing information about the request and the response. */
export class FritterContext
{
	/**
	 * The Fritter instance that created this context.
	 */
	fritter: Fritter;

	/** The Fritter request. */
	fritterRequest: FritterRequest;

	/** The Fritter response. */
	fritterResponse: FritterResponse;

	/** The raw Node.js HTTP request. */
	nodeRequest: http.IncomingMessage;

	/** The raw Node.js HTTP response. */
	nodeResponse: http.ServerResponse;

	/** The cookies for this request. */
	cookies: Cookies;

	/**
	 * Constructs a new Fritter context.
	 *
	 * @param fritter An instance of Fritter.
	 * @param request A Node.js HTTP request.
	 * @param response A Node.js HTTP response.
	 */
	constructor(fritter: Fritter, request: http.IncomingMessage, response: http.ServerResponse)
	{
		this.fritter = fritter;
		this.fritterRequest = new FritterRequest(fritter, this, request, response);
		this.fritterResponse = new FritterResponse(fritter, this, request, response);
		this.nodeRequest = request;
		this.nodeResponse = response;
		this.cookies = new Cookies(request, response,
			{
				secure: this.fritterRequest.isSecure(),
			});
	}
}