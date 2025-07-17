import { getState, warning } from "@actions/core";
import { exec } from "@actions/exec";

async function cleanup() {
  const clusterName = getState("clusterName") || "solo-e2e";
  await exec(`kind delete cluster --name ${clusterName}`);
}

cleanup().catch((error) => warning(`Cleanup failed: ${error.message}`));
