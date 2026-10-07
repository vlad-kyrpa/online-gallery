import express, { Express, Request, Response } from "express";
import path from "node:path";

/** Groups the dependencies required to serve the compiled client application. */
export interface RegisterClientRoutesParameters {
  app: Express;
  clientBuildDirectory: string;
}

/** Registers static asset delivery and the React client-shell fallback. */
export function registerClientStaticRoutes({
  app,
  clientBuildDirectory,
}: RegisterClientRoutesParameters): void {
  app.use(express.static(clientBuildDirectory));
  app.get("/{*path}", (_request: Request, response: Response): void => {
    response.sendFile(path.join(clientBuildDirectory, "index.html"));
  });
}
