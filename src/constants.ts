import { ToolSpec } from "./types.js";

/** Name of the kind cluster created by the action */
export const CLUSTER_NAME = "solo-e2e";

/** Kubernetes namespace used for the Solo deployment */
export const NAMESPACE = "solo";

/** Name of the Solo deployment */
export const DEPLOYMENT_NAME = "solo-deployment";

// Default port numbers (used as fallbacks when action inputs are not provided)
export const DEFAULT_HAPROXY_PORT = "50211";
export const DEFAULT_GRPC_PROXY_PORT = "9998";
export const DEFAULT_DUAL_MODE_GRPC_PROXY_PORT = "9999";
export const DEFAULT_MIRROR_NODE_PORT_REST = "5551";
export const DEFAULT_MIRROR_NODE_PORT_GRPC = "5600";
export const DEFAULT_MIRROR_NODE_PORT_WEB3 = "8545";
export const DEFAULT_JAVA_REST_API_PORT = "8084";
export const DEFAULT_RELAY_PORT = "7546";
export const DEFAULT_HBAR_AMOUNT = "10000000";

// Internal target ports (the ports services listen on inside the cluster)
export const HAPROXY_INTERNAL_PORT = "50211";
export const HAPROXY_NODE2_EXTERNAL_PORT = "51211";
export const GRPC_PROXY_INTERNAL_PORT = "8080";
export const MIRROR_NODE_REST_INTERNAL_PORT = "80";
export const MIRROR_NODE_GRPC_INTERNAL_PORT = "5600";
export const RELAY_INTERNAL_PORT = "7546";

// Tooling constants
export const PYTHON_VERSION = "3.12.9";
export const PYTHON_RELEASE_TAG = "20250409";
export const PYTHON_DOWNLOAD_URL = `https://github.com/astral-sh/python-build-standalone/releases/download/${PYTHON_RELEASE_TAG}/cpython-${PYTHON_VERSION}%2B${PYTHON_RELEASE_TAG}-x86_64-unknown-linux-gnu-install_only.tar.gz`;

export const WGET_VERSION = "1.25.0";
export const WGET_DOWNLOAD_URL =
    "https://github.com/userdocs/qbt-workflow-files/releases/latest/download/wget";

export const JAVA_VERSION = "21.0.6";
export const JAVA_DOWNLOAD_URL =
    "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk";

export const KIND_VERSION = "v0.29.0";
export const KIND_DOWNLOAD_URL = `https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64`;

export const KUBECTL_VERSION = "v1.32.2";
export const KUBECTL_DOWNLOAD_URL = `https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl`;

export const JQ_VERSION = "1.7.1";
export const JQ_DOWNLOAD_URL = `https://github.com/jqlang/jq/releases/download/jq-${JQ_VERSION}/jq-linux-amd64`;

export const NODE_VERSION = "24.0.1";
export const NODE_DOWNLOAD_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz`;


// List of system-level tools required for the Solo action.
export const TOOLS: ToolSpec[] = [
    {
        name: "python",
        checkBinary: ["python3", "python"],
        version: PYTHON_VERSION,
        downloadUrl: PYTHON_DOWNLOAD_URL,
        type: "tar",
        dirFixed: "python",
        binSubPath: "bin",
    },
    {
        name: "wget",
        version: WGET_VERSION,
        downloadUrl: WGET_DOWNLOAD_URL,
        type: "binary",
    },
    {
        name: "java",
        version: JAVA_VERSION,
        downloadUrl: JAVA_DOWNLOAD_URL,
        type: "tar",
        dirPrefix: "jdk-",
        binSubPath: "bin",
    },
    {
        name: "kind",
        version: KIND_VERSION,
        downloadUrl: KIND_DOWNLOAD_URL,
        type: "binary",
    },
    {
        name: "kubectl",
        version: KUBECTL_VERSION,
        downloadUrl: KUBECTL_DOWNLOAD_URL,
        type: "binary",
    },
    {
        name: "jq",
        version: JQ_VERSION,
        downloadUrl: JQ_DOWNLOAD_URL,
        type: "binary",
    },
    {
        name: "node",
        checkBinary: "npm",
        version: NODE_VERSION,
        downloadUrl: NODE_DOWNLOAD_URL,
        type: "tar-xz",
        dirFixed: `node-v${NODE_VERSION}-linux-x64`,
        binSubPath: "bin",
    },
];