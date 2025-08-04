import { getState, info, warning, error as coreError } from "@actions/core";
import { exec } from "@actions/exec";

/**
 * Executes a command safely with proper error handling
 * @param command - The command to execute
 * @param args - The arguments for the command
 * @param options - Optional execution options
 */
async function safeExec(
  command: string,
  args: string[] = [],
  options?: Parameters<typeof exec>[2]
): Promise<number> {
  try {
    info(`[exec] Running: ${command} ${args.join(" ")}`);
    return await exec(command, args, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack =
      err instanceof Error && err.stack ? `\nStack: ${err.stack}` : "";
    coreError(
      `[exec] Failed: ${command} ${args.join(" ")}\nError: ${message}${stack}`
    );
    throw new Error(
      `safeExec error: ${command} ${args.join(" ")} - ${message}`
    );
  }
}

/**
 * Cleanup function to delete the kind cluster
 */
async function cleanup(): Promise<void> {
  const clusterName = getState("clusterName");

  if (!clusterName) {
    info("[cleanup] No cluster name found in state, skipping cleanup");
    return;
  }

  info(`[cleanup] Starting cleanup for cluster: ${clusterName}`);

  try {
    await safeExec("kind", ["delete", "cluster", "--name", clusterName]);
    info(`[cleanup] Cluster '${clusterName}' deleted successfully`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warning(`[cleanup] Failed to delete cluster '${clusterName}': ${message}`);
  }
}

async function main(): Promise<void> {
  try {
    await cleanup();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warning(`[main] Cleanup threw an error: ${message}`);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  coreError(`[main] Unhandled error: ${message}`);
  process.exitCode = 1;
});
