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

  // Create a Kubernetes cluster using kind
  await exec(`kind create cluster -n ${clusterName}`);

  // Initialize the Solo CLI configuration
  await exec(`solo init`);

  // Connect the Solo CLI to the kind cluster using a cluster reference name
  await exec(
    `solo cluster-ref connect --cluster-ref kind-${clusterName} --context kind-${clusterName}`
  );

  // Create deployment
  await exec(
    `solo deployment create -n ${namespace} --deployment ${deployment}`
  );

  // Add the kind cluster to the deployment with 1 consensus node
  await exec(
    `solo deployment add-cluster --deployment ${deployment} --cluster-ref kind-${clusterName} --num-consensus-nodes 1`
  );

  // Generate keys for the node
  await exec(
    `solo node keys --gossip-keys --tls-keys -i node1 --deployment ${deployment}`
  );

  // Setup the Solo cluster
  await exec(`solo cluster-ref setup -s ${clusterName}`);

  // Deploy the network
  await exec(`solo network deploy -i node1 --deployment ${deployment}`);

  // Setup the node
  await exec(
    `solo node setup -i node1 --deployment ${deployment} -t ${hieroVersion} --quiet-mode`
  );

  // Start the node
  await exec(`solo node start -i node1 --deployment ${deployment}`);

  // Debug: List services in the solo namespace
  await exec(`kubectl get svc -n ${namespace}`);

  // Port forward the HAProxy service
  //   try {
  //     await exec("bash", [
  //       "-c",
  //       `kubectl port-forward svc/haproxy-node1-svc -n ${namespace} 50211:50211 &`,
  //     ]);
  //   } catch (err) {
  //     info("HAProxy service not found, skipping port-forward");
  //   }
  try {
    await exec("kubectl", ["get", "svc", "haproxy-node1-svc", "-n", namespace]);
    await exec("bash", [
      "-c",
      `kubectl port-forward svc/haproxy-node1-svc -n ${namespace} 50211:50211 &`,
    ]);
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

  //   const portForwardIfExists = async (service: string, portSpec: string) => {
  //     try {
  //       // Check if the service exists
  //       await exec("kubectl", ["get", "svc", service, "-n", namespace]);

  //       // Use spawn for background port-forward
  //       const portForwardProcess = spawn(
  //         "kubectl",
  //         ["port-forward", `svc/${service}`, "-n", namespace, portSpec],
  //         {
  //           detached: true,
  //           stdio: "ignore",
  //         }
  //       );

  //       portForwardProcess.unref(); // Detach so it keeps running

  //       info(`Port-forward started for ${service} on ${portSpec}`);
  //     } catch (err) {
  //       info(`Service ${service} not found, skipping port-forward`);
  //     }
  //   };

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
  await exec("bash", [
    "-c",
    `solo account create ${generateFlag} --deployment "${deployment}" > ${outputFile}`,
  ]);

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

  if (type === "ecdsa") {
    setOutput("ecdsaAccountId", accountId);
    setOutput("ecdsaPublicKey", publicKey);
    setOutput("ecdsaPrivateKey", privateKey);
  } else {
    setOutput("ed25519AccountId", accountId);
    setOutput("ed25519PublicKey", publicKey);
    setOutput("ed25519PrivateKey", privateKey);

    // Also set generic outputs for backward compatibility
    setOutput("accountId", accountId);
    setOutput("publicKey", publicKey);
    setOutput("privateKey", privateKey);
  }
}

async function run() {
  await deploySoloTestNetwork();
  await deployMirrorNode();
  await deployRelay();
  await createAccount("ecdsa");
  await createAccount("ed25519");
}

run().catch((error) => setFailed(error.message));
