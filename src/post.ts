import { getState, warning, error as coreError, info } from "@actions/core";
import { runCommand } from "./utils.js";
import { CLUSTER_NAME } from "./constants.js";
import { homedir } from "os";
import { join } from "path";
import { rmSync } from "fs";

/**
 * Cleanup function to delete the kind cluster and Solo state.
 *
 * On self-hosted runners all jobs share the same machine, so we must
 * remove every piece of state that would cause the next run to fail
 * (e.g. "A deployment named solo-deployment already exists").
 */
async function cleanup(): Promise<void> {
    const savedClusterName = getState("clusterName");
    const clusterName = savedClusterName ?? CLUSTER_NAME;

    info(`[cleanup] Starting cleanup for cluster: ${clusterName}`);

    // Deletes the kind cluster
    try {
        await runCommand(`kind delete cluster --name ${clusterName}`);
        info(`[cleanup] Cluster '${clusterName}' deleted successfully`);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        warning(
            `[cleanup] Failed to delete cluster '${clusterName}': ${message}`,
        );
    }

    // Remove Solo's local config directory so the next job starts fresh
    const soloConfigDir = join(homedir(), ".solo");
    try {
        rmSync(soloConfigDir, { recursive: true, force: true });
        info(`[cleanup] Removed Solo config directory: ${soloConfigDir}`);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        warning(`[cleanup] Failed to remove Solo config directory: ${message}`);
    }
}

async function main(): Promise<void> {
    try {
        await cleanup();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        warning(`[main] Cleanup threw an error: ${message}`);
    }
}

main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    coreError(`[main] Unhandled error: ${message}`);
    process.exitCode = 1;
});
