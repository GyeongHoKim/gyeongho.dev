declare module "@ficusjs/router" {
	type RouteOrOutletHTMLResult = string | HTMLElement;

	interface Outlets {
		[outletName: string]: () =>
			| RouteOrOutletHTMLResult
			| Promise<RouteOrOutletHTMLResult>;
	}

	interface QueryParams {
		[paramName: string]: string | string[];
	}

	interface RouteContext {
		context?: RouterOptionsContext;
		router: Router;
		route: Route;
		path: string;
		params: QueryParams;
	}

	type RedirectObject = { redirect: string };

	type ActionResult =
		| boolean
		| Error
		| RedirectObject
		| RouteOrOutletHTMLResult
		| Promise<RouteOrOutletHTMLResult>
		| {
				template: RouteOrOutletHTMLResult | Promise<RouteOrOutletHTMLResult>;
				outlets?: Outlets;
		  };

	type ResolveRoute = (
		context: RouteContext,
		params: QueryParams,
	) => ActionResult;

	type ErrorHandler = (
		error: Error & { status?: number },
		context: RouteContext,
	) => RouteOrOutletHTMLResult;

	type RouterOptionsContext = object;

	interface RouterOptions {
		mode: "history" | "hash";
		autoStart?: boolean;
		changeHistoryState?: boolean;
		warnOnMissingOutlets?: boolean;
		context?: RouterOptionsContext;
		resolveRoute?: ResolveRoute;
		errorHandler?: ErrorHandler;
	}

	type Route =
		| {
				path: string;
				component: string;
				outlets?: Outlets;
				children?: Array<Route>;
		  }
		| {
				path: string;
				action: (context: RouteContext, params: QueryParams) => ActionResult;
				outlets?: Outlets;
				children?: Array<Route>;
				matcher?: (path: string) => QueryParams | string | undefined;
		  };

	interface RouterLocation {
		host: string | undefined;
		protocol: string | undefined;
		pathname: string | undefined;
		hash: string | undefined;
		href: string | undefined;
		search: string | undefined;
		state: unknown;
	}

	type Routes = Array<Route>;

	class Router {
		constructor(
			routes: Routes,
			rootOutletSelector: string,
			options?: RouterOptions,
		);
		push(location: string): Promise<boolean>;
		replace(location: string): Promise<boolean>;
		go(n: number): void;
		goBack(): void;
		goForward(): void;
		start(location?: string | object): void;
		setOptions(options: RouterOptions): void;
		addRoutes(routes: Routes): void;
		hasRoute(pathname: string): boolean;
		get options(): RouterOptions;
		get location(): RouterLocation;
	}

	export function createRouter(
		routes: Routes,
		rootOutletSelector: string,
		options?: RouterOptions,
	): Router;
	export function getRouter(): Router;
	export function addMatcherToRoute(route: Route): Route;
}
