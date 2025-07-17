import * as fs from "fs";
import { exec } from "@actions/exec";
import { setFailed, saveState, getInput, setOutput, info } from "@actions/core";

/**
 * Extracts the account information from the output text
 * @param inputText - The text to extract the account information from
 * @returns The account information as a JSON string
 */
function extractAccountAsJson(inputText: string): string {
  const jsonRegex =
    /\{\s*"accountId":\s*".*?",\s*"publicKey":\s*".*?",\s*"balance":\s*\d+\s*\}/s;
  const match = inputText.match(jsonRegex);
  if (match) {
    return match[0];
  } else {
    throw new Error("No JSON block found in output");
  }
}

/**
 * Deploys a Solo test network
 * This creates a new Kubernetes cluster using kind, initializes the Solo CLI configuration,
 * connects the Solo CLI to the kind cluster, creates a new deployment, adds the kind cluster
 * to the deployment with 1 consensus node, generates keys for the node, sets up the Solo cluster,
 * deploys the network, sets up the node, and starts the node
 * @returns void
 */
async function deploySoloTestNetwork(): Promise<void> {
  const clusterName = "solo-e2e";
  const namespace = "solo";
  const deployment = "solo-deployment";
  const hieroVersion = getInput("hieroVersion");
  //   const soloClusterSetupNamespace = "solo-cluster";

  saveState("clusterName", clusterName);

  /**
   * Create a Kubernetes cluster using kind
   * This creates a new Kubernetes cluster using the kind CLI
   */
  await exec(`kind create cluster -n ${clusterName}`);

  /**
   * Initialize the Solo CLI configuration
   * This creates a new configuration file in ~/.solo/config.yaml
   */
  await exec(`solo init`);

  /**
   * Connect the Solo CLI to the kind cluster using a cluster reference name
   * This creates a new cluster reference in ~/.solo/config.yaml
   */
  await exec(
    `solo cluster-ref connect --cluster-ref kind-${clusterName} --context kind-${clusterName}`
  );

  /**
   * Create a new deployment
   * This creates a new deployment in the ~/.solo/deployments.yaml file
   */
  await exec(
    `solo deployment create -n ${namespace} --deployment ${deployment}`
  );

  /**
   * Add the kind cluster to the deployment with 1 consensus node
   * This adds the kind cluster to the deployment in the ~/.solo/deployments.yaml file
   */
  await exec(
    `solo deployment add-cluster --deployment ${deployment} --cluster-ref kind-${clusterName} --num-consensus-nodes 1`
  );

  /**
   * Generate keys for the node
   * This generates the gossip and TLS keys for the node
   */
  await exec(
    `solo node keys --gossip-keys --tls-keys -i node1 --deployment ${deployment}`
  );

  /**
   * Setup the Solo cluster
   * This sets up the Solo cluster in the ~/.solo/config.yaml file
   */
  await exec(`solo cluster-ref setup -s ${clusterName}`);

  /**
   * Deploy the network
   */
  await exec(`solo network deploy -i node1 --deployment ${deployment}`);

  /**
   * Setup the node
   * This sets up the node in the ~/.solo/config.yaml file
   */
  await exec(
    `solo node setup -i node1 --deployment ${deployment} -t ${hieroVersion} --quiet-mode`
  );

  /**
   * Start the node
   * This starts the node in the ~/.solo/config.yaml file
   */
  await exec(`solo node start -i node1 --deployment ${deployment}`);

  /**
   * Debug: List services in the solo namespace
   */
  await exec(`kubectl get svc -n ${namespace}`);

  /**
   * Port forward the HAProxy service
   * This port forwards the HAProxy service to the local machine
   */
  try {
    await exec("kubectl", ["get", "svc", "haproxy-node1-svc", "-n", namespace]);
    await exec("bash", [
      "-c",
      `kubectl port-forward svc/haproxy-node1-svc -n ${namespace} 50211:50211 &`,
    ]);
    info("HAProxy service port-forwarded");
  } catch (err) {
    info("HAProxy service not found, skipping port-forward");
  }
}

/**
 * Deploys a Mirror Node
 * This deploys a Mirror Node in the Solo cluster.
 * @returns void
 */
async function deployMirrorNode(): Promise<void> {
  const installMirrorNode = getInput("installMirrorNode") === "true";
  if (!installMirrorNode) return;

  const namespace = "solo";
  const deployment = "solo-deployment";
  const version = getInput("mirrorNodeVersion");
  const portRest = getInput("mirrorNodePortRest");
  const portGrpc = getInput("mirrorNodePortGrpc");
  const portWeb3 = getInput("mirrorNodePortWeb3Rest");

  /**
   * Deploy the Mirror Node
   * This deploys the Mirror Node in the Solo cluster
   */
  await exec(
    `solo mirror-node deploy --deployment ${deployment} --mirror-node-version ${version}`
  );

  /**
   * List services in the solo namespace
   * This lists the services in the solo namespace
   */
  await exec(`kubectl get svc -n ${namespace}`);

  /**
   * Port forward if the service exists
   * This port forwards the service to the local machine if it exists.
   * It checks if the service exists, and if it does, it port forwards the service to the local machine.
   * If the service does not exist, it logs a message and does not port forward.
   * @param service - The name of the service to port forward
   * @param portSpec - The port specification to use for the port forward
   * @returns void
   */
  const portForwardIfExists = async (service: string, portSpec: string) => {
    try {
      await exec("kubectl", ["get", "svc", service, "-n", namespace]);
      info(`Service ${service} exist 99999999`);

      await exec("bash", [
        "-c",
        `kubectl port-forward svc/${service} -n ${namespace} ${portSpec} &`,
      ]);
      info(`Port forward started for ${service} on ${portSpec}`);
    } catch (err) {
      info(`Service ${service} not found, skipping port-forward`);
    }
  };

  /**
   * Port forward the Mirror Node services
   * This port forwards the Mirror Node services to the local machine
   */
  await portForwardIfExists("mirror-rest", `${portRest}:80`);
  await portForwardIfExists("mirror-grpc", `${portGrpc}:5600`);
  await portForwardIfExists("mirror-web3", `${portWeb3}:80`);
}

/**
 * Deploys a Relay
 * This deploys a Relay in the Solo cluster
 * @returns void
 */
async function deployRelay(): Promise<void> {
  const installRelay = getInput("installRelay") === "true";
  if (!installRelay) return;

  const namespace = "solo";
  const deployment = "solo-deployment";
  const relayPort = getInput("relayPort");

  /**
   * Deploy the Relay
   * This deploys the Relay in the Solo cluster
   */
  await exec(`solo relay deploy -i node1 --deployment ${deployment}`);

  /**
   * List services in the solo namespace
   * This lists the services in the solo namespace
   */
  await exec(`kubectl get svc -n ${namespace}`);

  /**
   * Port forward the Relay service
   * This port forwards the Relay service to the local machine
   */
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

/**
 * Creates an account
 * This creates an account in the Solo cluster
 * @param type - The type of account to create (ecdsa or ed25519)
 * @returns void
 */
async function createAccount(type: "ecdsa" | "ed25519"): Promise<void> {
  const namespace = "solo";
  const deployment = "solo-deployment";
  const outputFile = `account_create_output_${type}.txt`;

  const generateFlag = type === "ecdsa" ? "--generate-ecdsa-key" : "";

  /**
   * Create an account
   * This creates an account in the Solo cluster
   */
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

  /**
   * Get the private key
   * This gets the private key for the account
   */
  await exec("bash", ["-c", privateKeyCmd], {
    listeners: {
      stdout: (data) => {
        privateKey += data.toString();
      },
    },
  });

  /**
   * Update the account
   * This updates the account in the Solo cluster
   */
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

    /**
     * Set generic outputs for backward compatibility
     * This sets the generic outputs for the account
     */
    setOutput("accountId", accountId);
    setOutput("publicKey", publicKey);
    setOutput("privateKey", privateKey);
  }
}

/**
 * Runs the script
 * This runs the script to deploy the Solo test network, Mirror Node, Relay, and create an account
 * @returns void
 */
async function run(): Promise<void> {
  await deploySoloTestNetwork();
  await deployMirrorNode();
  await deployRelay();
  await createAccount("ecdsa");
  await createAccount("ed25519");
}

run().catch((error) => setFailed(error.message));
