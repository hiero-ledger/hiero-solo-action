import { getState, info, warning } from "@actions/core";
import { exec } from "@actions/exec";

async function cleanup() {
  const clusterName = getState("clusterName");

  if (clusterName) {
    await exec(`kind delete cluster --name ${clusterName}`);
    info(`Cluster ${clusterName} deleted`);
  }
}

cleanup().catch((error) => warning(`Cleanup failed: ${error}`));
