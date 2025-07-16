import * as fs from "fs";
import { exec } from "@actions/exec";
import { setFailed, saveState, getInput, setOutput, info } from "@actions/core";

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

async function deploySoloTestNetwork() {
  const clusterName = "solo-e2e";
  const namespace = "solo";
  const deployment = "solo-deployment";
  const hieroVersion = getInput("hieroVersion");

  saveState("clusterName", clusterName);

  await exec(`kind create cluster -n ${clusterName}`);
  await exec(`solo init`);
  await exec(
    `solo cluster-ref connect --cluster-ref kind-${clusterName} --context kind-${clusterName}`
  );
  await exec(
    `solo deployment create -n ${namespace} --deployment ${deployment}`
  );
  await exec(
    `solo deployment add-cluster --deployment ${deployment} --cluster-ref kind-${clusterName} --num-consensus-nodes 1`
  );
  await exec(
    `solo node keys --gossip-keys --tls-keys -i node1 --deployment ${deployment}`
  );
  await exec(`solo cluster-ref setup -s ${clusterName}`);
  await exec(`solo network deploy -i node1 --deployment ${deployment}`);
  await exec(
    `solo node setup -i node1 --deployment ${deployment} -t ${hieroVersion} --quiet-mode`
  );
  await exec(`solo node start -i node1 --deployment ${deployment}`);
  await exec(`kubectl get svc -n ${namespace}`);
  try {
    await exec(
      `kubectl port-forward svc/haproxy-node1-svc -n ${namespace} 50211:50211 &`
    );
  } catch (err) {
    info("HAProxy service not found, skipping port-forward");
  }
}

async function deployMirrorNode() {
  const installMirrorNode = getInput("installMirrorNode") === "true";
  if (!installMirrorNode) return;

  const namespace = "solo";
  const deployment = "solo-deployment";
  const version = getInput("mirrorNodeVersion");
  const portRest = getInput("mirrorNodePortRest");
  const portGrpc = getInput("mirrorNodePortGrpc");
  const portWeb3 = getInput("mirrorNodePortWeb3Rest");

  await exec(
    `solo mirror-node deploy --deployment ${deployment} --mirror-node-version ${version}`
  );
  await exec(`kubectl get svc -n ${namespace}`);

  //   const portForwardIfExists = async (service: string, portSpec: string) => {
  //     try {
  //       await exec(`kubectl get svc ${service} -n ${namespace}`);
  //       await exec(
  //         `kubectl port-forward svc/${service} -n ${namespace} ${portSpec} &`
  //       );
  //     } catch (err) {
  //       info(`Service ${service} not found, skipping port-forward`);
  //     }
  //   };

  const portForwardIfExists = async (service: string, portSpec: string) => {
    try {
      await exec("kubectl", ["get", "svc", service, "-n", namespace]);
      await exec("bash", [
        "-c",
        `kubectl port-forward svc/${service} -n ${namespace} ${portSpec} &`,
      ]);
    } catch (err) {
      info(`Service ${service} not found, skipping port-forward`);
    }
  };

  await portForwardIfExists("mirror-rest", `${portRest}:80`);
  await portForwardIfExists("mirror-grpc", `${portGrpc}:5600`);
  await portForwardIfExists("mirror-web3", `${portWeb3}:80`);
}

async function deployRelay() {
  const installRelay = getInput("installRelay") === "true";
  if (!installRelay) return;

  const namespace = "solo";
  const deployment = "solo-deployment";
  const relayPort = getInput("relayPort");

  await exec(`solo relay deploy -i node1 --deployment ${deployment}`);
  await exec(`kubectl get svc -n ${namespace}`);

  //   try {
  //     await exec(
  //       `kubectl get svc relay-node1-hedera-json-rpc-relay -n ${namespace}`
  //     );
  //     await exec(
  //       `kubectl port-forward svc/relay-node1-hedera-json-rpc-relay -n ${namespace} ${relayPort}:7546 &`
  //     );
  //   } catch (err) {
  //     info("Relay service not found, skipping port-forward");
  //   }
  try {
    await exec("kubectl", [
      "get",
      "svc",
      "relay-node1-hedera-json-rpc-relay",
      "-n",
      namespace,
    ]);
    await exec("bash", [
      "-c",
      `kubectl port-forward svc/relay-node1-hedera-json-rpc-relay -n ${namespace} ${relayPort}:7546 &`,
    ]);
  } catch (err) {
    info("Relay service not found, skipping port-forward");
  }
}

async function createAccount(type: "ecdsa" | "ed25519") {
  const namespace = "solo";
  const deployment = "solo-deployment";
  const outputFile = `account_create_output_${type}.txt`;
  //   const id = `create-${type}`;

  const generateFlag = type === "ecdsa" ? "--generate-ecdsa-key" : "";
  await exec(
    `solo account create ${generateFlag} --deployment ${deployment} > ${outputFile}`
  );

  const extractAccountJson = async () => {
    const content = fs.readFileSync(outputFile, "utf-8");
    return extractAccountAsJson(content);
  };

  const accountJson = await extractAccountJson();
  const { accountId, publicKey } = JSON.parse(accountJson);

  const privateKeyCmd = `kubectl get secret account-key-${accountId} -n ${namespace} -o jsonpath='{.data.privateKey}' | base64 -d | xargs`;
  let privateKey = "";
  await exec("bash", ["-c", privateKeyCmd], {
    listeners: {
      stdout: (data) => {
        privateKey += data.toString();
      },
    },
  });

  await exec(
    `solo account update --account-id ${accountId} --hbar-amount 10000000 --deployment ${deployment}`
  );

  setOutput("accountId", accountId);
  setOutput("publicKey", publicKey);
  setOutput("privateKey", privateKey);
}

async function run() {
  await deploySoloTestNetwork();
  await deployMirrorNode();
  await deployRelay();
  await createAccount("ecdsa");
  await createAccount("ed25519");
}

run().catch((error) => setFailed(error.message));
