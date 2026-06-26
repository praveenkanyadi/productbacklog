/**
 * EDM Temporal Worker bootstrap
 *
 * Connects to Temporal, bundles workflows, registers activities, and runs.
 * Task queue: edm
 */

import path from "path";
import { fileURLToPath } from "url";
import { Worker } from "@temporalio/worker";
import { activities } from "./activities/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE ?? "edm";
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.resolve(__dirname, "workflows"),
    activities,
    taskQueue: TASK_QUEUE,
  });

  console.log(`Worker started, task queue: ${TASK_QUEUE}`);
  await worker.run();
}

run().catch((err) => {
  console.error("Worker error:", err);
  process.exit(1);
});
