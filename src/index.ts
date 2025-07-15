import { setFailed, saveState } from "@actions/core";
import { exec } from "@actions/exec";

function extractAccountAsJson(inputText: string) {
  const jsonRegex =
    /\{\s*"accountId":\s*".*?",\s*"publicKey":\s*".*?",\s*"balance":\s*\d+\s*\}/s;
  const match = inputText.match(jsonRegex);
  if (match) {
    return match[0];
  } else {
    throw new Error("No JSON block found in output");
  }
}

async function run() {
  const clusterName = "solo-e2e";
  saveState("clusterName", clusterName); // Needed for post step

  await exec(`kind create cluster --name ${clusterName}`);
  await exec(`solo init`);
  // ... more setup logic
}

run().catch((error) => setFailed(error.message));
