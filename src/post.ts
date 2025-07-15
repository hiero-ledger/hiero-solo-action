import * as core from "@actions/core";
import * as exec from "@actions/exec";

async function cleanup() {
  const clusterName = core.getState("clusterName") || "solo-e2e";
  await exec.exec(`kind delete cluster --name ${clusterName}`);
}

cleanup().catch((error) => core.warning(`Cleanup failed: ${error.message}`));
