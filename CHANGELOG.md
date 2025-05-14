# Changelog
## 5.0.0

* refactor: renamed HTTPMethod to FritterHttpMethod
* refactor: renamed MiddlewareFunction to FritterMiddlewareFunction
* style: reformatted some stuff
* refactor: renamed package from @donutteam/fritter to @lorenstuff/fritter

## 4.2.4

* chore: updated some packages

## 4.2.3

* fix: fixed getCacheBustedPath not working with mountPaths

## 4.2.2

* fix: refactored the getPagination feature to actually be usable

## 4.2.1

* fix: fixed CurrentPageNumberMiddleware generic types to not require a type argument

## 4.2.0

* refactor: removed "Middleware" from middleware file names
* refactor: deprecated PossibleJsonData type
	* It's not used anymore but I don't want to remove it in a non-major version
* feat: added the ability to provide a getPagination function to the CurrentPageNumberMiddleware

## 4.1.0

* feat: added context.getRawRequestBody() to get the raw request body on JSON requests when using the BodyParserMiddleware

## 4.0.0

* refactor: added FritterFile class to replace BodyParserMiddleware.File and StaticMiddleware.File

## 3.0.3

* fix: moved @donutteam/typescript-config to devDependencies

## 3.0.2

* refactor: extended @donutteam/typescript-config

## 3.0.1

* docs: updated readme

## 3.0.0

* chore: updated packages
* refactor: changed how the Fritter class stores its options
* refactor: removed support for https server
* refactor: renamed Fritter.httpServer to server
* refactor: removed local utility functions
* refactor: made CorsMiddleware return its options
* refactor: made CurrentPageNumberMiddleware return its options
* refactor: made ForceSslMiddleware return its options
* refactor: made LogRequestMiddleware return its options
* refactor: made RouterMiddleware return its options
* refactor: made StaticMiddleware return its options
* fix: fixed a bug where the StaticMiddleware ignored query strings
* refactor: new BodyParserMiddleware
* refactor: simplified tsconfig
* refactor: changed Fritter class to create the server in its constructor
* refactor: renamed Fritter class start/stop methods
* feat: added SameOriginFrameMiddleware
* chore: removed unused zod dependency

## 2.1.0

* Added an `addRoute` function to the `RouterMiddleware` to manually add a route.

## 2.0.0

* Removed the NoticeMiddleware.
* Removed the RenderComponentMiddleware.
* Removed the `@donutteam/document-builder` peer dependency.
* Removed the `FritterMiddlewareFunction` type.
* Updated most other dependencies.
	* Notably did *not* update `path-to-regexp` as I cannot currently be bothered to figure out the v7.0.0 changes.

## 1.4.0

* Made the RouterMiddleware's `Route` interface generic, allowing you to pass in a `FritterContext` type.
	* This is optional and the type defaults to the RouterMiddleware's `MiddlewareFritterContext` type.
* Renamed `FritterMiddlewareFunction` to `MiddlewareFunction`.
	* The old name is still available for now but marked as deprecated.

## 1.3.0
Renamed `CurrentPage` middleware to `CurrentPageNumber`. The old name is still available for now.

The middleware's context also now contains a `currentPageNumber` property in addition to the now deprecated `currentPage` property.

## 1.2.1

* Fixed various mistakes in the `CurrentPage` middleware.

## 1.2.0

* Added `CurrentPage` middleware.
* Added `Notice` middleware.

## 1.1.1

* Re-added `routes` to `CreateOptions` for Router middleware. Didn't mean to make a breaking change.
* Made `CreateOptions` for Router middleware optional.

## 1.1.0
Added `getRoutes`, `loadRoutesFile`, `loadRoutesDirectory`, and `remoteRoute` functions to the `CreateResult` for the `RouterMiddleware`.

## 1.0.2
Made `CreateOptions` optional for the `BodyParser`, `Cors`, `ForceSsl` and `LogRequest` middlewares.

## 1.0.1
Fixed a mistake where the `main` path in `package.json` was incorrect.

## 1.0.0
Initial stable release.

This is a quite significant rewrite from the previous version. It also bundles common middlewares to simplify the usage of the library.

## 0.1.10

* Removed eslint packages and config.
* Updated all other packages.

## 0.1.9
Updated packages.

## 0.1.8
Updated @types/node package.

## 0.1.7
Updated packages.

## 0.1.6
Added a try around calls to `contentType.parse` as it throws if there is no Content-Type header in a request/response.

## 0.1.5
Added the `src` folder to the published package for better developer experience.

## 0.1.4
Changed `Fritter.use` to accept any type of `FritterMiddlewareFunction`.

## 0.1.3
Removed `FritterMiddleware` class as it just complicated things too much and was also too opinionated.

## 0.1.2
Made `FritterMiddlewareFunction` optionally generic.

## 0.1.1
Removed the generic `state` property from `FritterContext`.

## 0.1.0
Initial alpha release.