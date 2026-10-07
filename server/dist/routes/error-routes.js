/** Builds a safe error summary suitable for server logs. */
function createErrorSummary(error) {
    return error instanceof Error
        ? { message: error.message, name: error.name }
        : { message: "Unknown request error.", name: "UnknownError" };
}
/** Registers a final HTTP error handler that preserves diagnostic details in server logs. */
export function registerErrorRoutes({ app }) {
    const handler = (error, request, response, next) => {
        console.error("[HTTP] Unhandled request failure", {
            ...createErrorSummary(error),
            method: request.method,
            path: request.originalUrl,
        });
        if (response.headersSent) {
            next(error);
            return;
        }
        response.status(500).json({ message: "The server could not complete the request." });
    };
    app.use(handler);
}
