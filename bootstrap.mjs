import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { process, console } from 'node';

register("ts-node/esm", pathToFileURL("./"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});

import("./src/index.ts").catch((err) => {
  console.error("Error starting application:", err);
});
