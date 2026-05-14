import { getInput, info, saveState } from "@actions/core";
import {
    soloRun,
    runCommand,
    portForwardIfExists,
} from "./utils.js";
import type { SoloContext } from "./types.js";
import {
    DEFAULT_HAPROXY_PORT,
    DEFAULT_GRPC_PROXY_PORT,
    DEFAULT_DUAL_MODE_GRPC_PROXY_PORT,
    HAPROXY_INTERNAL_PORT,
    HAPROXY_NODE2_EXTERNAL_PORT,
    GRPC_PROXY_INTERNAL_PORT,
} from "./constants.js";

// ---------------------------------------------------------------------------
// Consensus node lifecycle steps 
// ---------------------------------------------------------------------------

async function createCluster(ctx: SoloContext): Promise<void> {
    await runCommand(`kind create cluster -n ${ctx.clusterName}`);
}

async function initSolo(): Promise<void> {
    await soloRun("solo init --dev");
}

async function connectCluster(ctx: SoloContext): Promise<void> {
    await soloRun(ctx.cmd.connectCluster(ctx.clusterName));
}

async function createDeployment(ctx: SoloContext): Promise<void> {
    await soloRun(ctx.cmd.createDeployment(ctx.namespace, ctx.deployment));
}

async function attachCluster(ctx: SoloContext, numNodes: number): Promise<void> {
    await soloRun(ctx.cmd.attachCluster(ctx.deployment, ctx.clusterName, numNodes));
}

async function generateKeys(ctx: SoloContext, nodeIds: string): Promise<void> {
    await soloRun(ctx.cmd.generateKeys(ctx.deployment, nodeIds));
}

async function setupNamespace(ctx: SoloContext): Promise<void> {
    await soloRun(ctx.cmd.setupNamespace(ctx.clusterName));
}

/**
 * Optionally deploys a block node.
 * Must run after setupNamespace and before deployNetwork.
 */
async function deployBlockNode(ctx: SoloContext, hieroVersion: string): Promise<void> {
    if (getInput("installBlockNode") !== "true") return;

    info(
        `[deployBlockNode] Deploying block node — cluster=${ctx.clusterName}, deployment=${ctx.deployment}, version=${hieroVersion}`,
    );
    await soloRun(
        `solo block node add --cluster-ref kind-${ctx.clusterName} --deployment ${ctx.deployment} --release-tag ${hieroVersion} --dev`,
    );
}

async function deployNetwork(ctx: SoloContext, nodeIds: string, hieroVersion: string): Promise<void> {
    await soloRun(ctx.cmd.deployNetwork(ctx.deployment, nodeIds, hieroVersion));
}

async function setupNodes(ctx: SoloContext, nodeIds: string, hieroVersion: string): Promise<void> {
    await soloRun(ctx.cmd.setupNodes(ctx.deployment, nodeIds, hieroVersion));
}

async function startNodes(ctx: SoloContext, nodeIds: string): Promise<void> {
    await soloRun(ctx.cmd.startNodes(ctx.deployment, nodeIds));
}

// ---------------------------------------------------------------------------
// Networking helper functions
// ---------------------------------------------------------------------------

async function setupHostsEntries(ctx: SoloContext, dualMode: boolean): Promise<void> {
    try {
        const sudoCheck = await runCommand("sudo -n true", { ignoreReturnCode: true });
        if (sudoCheck === 0) {
            const entries = [
                `127.0.0.1 network-node1-svc.${ctx.namespace}.svc.cluster.local`,
                `127.0.0.1 envoy-proxy-node1-svc.${ctx.namespace}.svc.cluster.local`,
            ];
            if (dualMode) {
                entries.push(
                    `127.0.0.1 network-node2-svc.${ctx.namespace}.svc.cluster.local`,
                    `127.0.0.1 envoy-proxy-node2-svc.${ctx.namespace}.svc.cluster.local`,
                );
            }
            for (const entry of entries) {
                await runCommand(`bash -c 'echo "${entry}" | sudo tee -a /etc/hosts'`);
            }
            info("Successfully added entries to /etc/hosts");
        } else {
            info("⚠️  No sudo access available, skipping /etc/hosts update. Nodes can still be accessed via localhost.");
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        info(`⚠️  Failed to update /etc/hosts: ${msg}, continuing...`);
    }
}

async function portForwardConsensusServices(
    ctx: SoloContext,
    haproxyPort: string,
    grpcProxyPort: string,
    dualModeGrpcProxyPort: string,
    dualMode: boolean,
): Promise<void> {
    await portForwardIfExists(
        "haproxy-node1-svc",
        `${haproxyPort}:${HAPROXY_INTERNAL_PORT}`,
        ctx.namespace,
    );

    if (dualMode) {
        await portForwardIfExists(
            "haproxy-node2-svc",
            `${HAPROXY_NODE2_EXTERNAL_PORT}:${HAPROXY_INTERNAL_PORT}`,
            ctx.namespace,
        );
        info(`HAProxy for node2 is accessible on port ${HAPROXY_NODE2_EXTERNAL_PORT}`);

        await portForwardIfExists(
            "envoy-proxy-node2-svc",
            `${dualModeGrpcProxyPort}:${GRPC_PROXY_INTERNAL_PORT}`,
            ctx.namespace,
        );
        info(`gRPC proxy for node2 is accessible on port ${dualModeGrpcProxyPort}`);
    }

    await portForwardIfExists(
        "envoy-proxy-node1-svc",
        `${grpcProxyPort}:${GRPC_PROXY_INTERNAL_PORT}`,
        ctx.namespace,
    );
}


/**
 * Deploys the full consensus network, including:
 * - kind cluster creation
 * - Solo CLI init + deployment wiring
 * - Optional block node (before network deploy)
 * - Consensus network deploy + node setup/start
 * - /etc/hosts entries + port-forwards
 */
export async function deployConsensusNetwork(ctx: SoloContext): Promise<void> {
    const hieroVersion = getInput("hieroVersion");
    const dualMode = getInput("dualMode") === "true";
    const haproxyPort = getInput("haproxyPort") || DEFAULT_HAPROXY_PORT;
    const grpcProxyPort = getInput("grpcProxyPort") || DEFAULT_GRPC_PROXY_PORT;
    const dualModeGrpcProxyPort =
        getInput("dualModeGrpcProxyPort") || DEFAULT_DUAL_MODE_GRPC_PROXY_PORT;

    if (!hieroVersion) {
        info("Hiero version not found, skipping deployment");
        return;
    }

    const numNodes = dualMode ? 2 : 1;
    const nodeIds = dualMode ? "node1,node2" : "node1";

    info(
        `[deployConsensusNetwork] ge0440=${ctx.ge0440}, dualMode=${dualMode}, nodes=${numNodes}, hieroVersion=${hieroVersion}, cluster=${ctx.clusterName}`,
    );

    try {
        saveState("clusterName", ctx.clusterName);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to save cluster name state: ${msg}`, { cause: error });
    }

    try {
        await createCluster(ctx);
        await initSolo();
        await connectCluster(ctx);
        await createDeployment(ctx);
        await attachCluster(ctx, numNodes);
        await generateKeys(ctx, nodeIds);
        await setupNamespace(ctx);

        // Block node must be deployed before the consensus network.
        await deployBlockNode(ctx, hieroVersion);

        await deployNetwork(ctx, nodeIds, hieroVersion);
        await setupNodes(ctx, nodeIds, hieroVersion);
        await startNodes(ctx, nodeIds);

        info(`Listing services in namespace ${ctx.namespace}:`);
        await runCommand(`kubectl get svc -n ${ctx.namespace}`);

        await setupHostsEntries(ctx, dualMode);
        await portForwardConsensusServices(
            ctx,
            haproxyPort,
            grpcProxyPort,
            dualModeGrpcProxyPort,
            dualMode,
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to deploy consensus network: ${msg}`, { cause: error });
    }
}
