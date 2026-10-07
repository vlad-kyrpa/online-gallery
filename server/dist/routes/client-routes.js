import express from "express";
import path from "node:path";
/** Registers static asset delivery and the React client-shell fallback. */
export function registerClientStaticRoutes({ app, clientBuildDirectory, }) {
    app.use(express.static(clientBuildDirectory));
    app.get("/{*path}", (_request, response) => {
        response.sendFile(path.join(clientBuildDirectory, "index.html"));
    });
}
