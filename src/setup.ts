import { which } from "@actions/io";
import { startGroup, addPath, endGroup, getInput, info } from "@actions/core";
import { exec } from "@actions/exec";
import {
    find,
    downloadTool,
    cacheFile,
    extractTar,
    cacheDir,
} from "@actions/tool-cache";
import { promises as fs } from "fs";
import { join } from "path";
import { runCommand, isVersionGte } from "./utils.js";
import {
    CLUSTER_NAME,
    DEPLOYMENT_NAME,
    NAMESPACE,
    TOOLS,
} from "./constants.js";
import type { SoloCommands, SoloContext, ToolSpec } from "./types.js";

/**
 * Ensures a tool is available on PATH.
 * Checks the tool-cache first, downloads only when necessary.
 */
async function ensureTool(spec: ToolSpec): Promise<void> {
    const checkNames = spec.checkBinary
        ? Array.isArray(spec.checkBinary)
            ? spec.checkBinary
            : [spec.checkBinary]
        : [spec.name];

    // Check if the tool is already on PATH
    for (const binary of checkNames) {
        const found = await which(binary, false);
        if (found) {
            info(`${spec.name} is already installed at ${found}.`);
            return;
        }
    }

    // Check the tool-cache
    let cachedPath = find(spec.name, spec.version);

    if (!cachedPath) {
        info(`Downloading ${spec.name} ${spec.version}...`);
        const downloaded = await downloadTool(spec.downloadUrl);

        if (spec.type === "binary") {
            await runCommand(`chmod +x ${downloaded}`);
            cachedPath = await cacheFile(downloaded, spec.name, spec.name, spec.version);
        } else {
            const extractFlags = spec.type === "tar-xz" ? ["xJ"] : undefined;
            const extractedDir = await extractTar(downloaded, undefined, extractFlags);

            let toolHome = extractedDir;
            if (spec.dirFixed) {
                toolHome = join(extractedDir, spec.dirFixed);
            } else if (spec.dirPrefix) {
                const entries = await fs.readdir(extractedDir);
                const match = entries.find((e) => e.startsWith(spec.dirPrefix!)) ?? entries[0];
                toolHome = join(extractedDir, match);
            }

            cachedPath = await cacheDir(toolHome, spec.name, spec.version);
        }

        info(`${spec.name} ${spec.version} installed successfully.`);
    } else {
        info(`${spec.name} ${spec.version} found in tool-cache.`);
    }

    addPath(spec.binSubPath ? join(cachedPath, spec.binSubPath) : cachedPath);
}


/**
 * Installs all system-level dependencies required by the action.
 */
export async function setupDependencies(): Promise<void> {
    startGroup("Installing System Dependencies");
    try {
        for (const tool of TOOLS) {
            await ensureTool(tool);
        }

        const soloVersion = getInput("soloVersion") || "latest";
        info(`Installing Solo CLI version: ${soloVersion}`);
        await runCommand(`npm install -g @hashgraph/solo@${soloVersion}`);

        info("✅ All dependencies installed successfully.");
    } catch (error: unknown) {
        throw new Error(
            `Dependency setup failed: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
        );
    } finally {
        endGroup();
    }
}


async function checkSoloVersion(): Promise<boolean> {
    try {
        let stdout = "";
        let stderr = "";

        await exec("solo", ["--version"], {
            listeners: {
                stdout: (data: Buffer) => { stdout += data.toString(); },
                stderr: (data: Buffer) => { stderr += data.toString(); },
            },
            ignoreReturnCode: true,
            silent: true,
        });

        const combined = `${stdout}\n${stderr}`.trim();
        info(`[checkSoloVersion] raw output: ${combined}`);

        const match = combined.match(/Version\s*:\s*(\d+\.\d+\.\d+)/);
        if (!match) {
            info("[checkSoloVersion] Could not parse version. Assuming >= 0.44.0.");
            return true;
        }

        const version = match[1];
        const ge0440 = isVersionGte(version, "0.44.0");
        info(`[checkSoloVersion] version=${version}, >= 0.44.0: ${ge0440}`);
        return ge0440;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        info(`[checkSoloVersion] Failed to detect version: ${msg}. Assuming >= 0.44.0.`);
        return true;
    }
}

/**
 * Generates commands for the newer Solo CLI style (v0.44.0+).
 */
function newStyleCommands(): SoloCommands {
    return {
        connectCluster: (c) =>
            `solo cluster-ref config connect --cluster-ref kind-${c} --context kind-${c} --dev`,
        createDeployment: (ns, d) =>
            `solo deployment config create -n ${ns} --deployment ${d} --dev`,
        attachCluster: (d, c, n) =>
            `solo deployment cluster attach --deployment ${d} --cluster-ref kind-${c} --num-consensus-nodes ${n} --dev`,
        generateKeys: (d, ids) =>
            `solo keys consensus generate --gossip-keys --tls-keys -i ${ids} --deployment ${d} --dev`,
        setupNamespace: (c) =>
            `solo cluster-ref config setup -s ${c} --dev`,
        deployNetwork: (d, ids, v) =>
            `solo consensus network deploy -i ${ids} --deployment ${d} --release-tag ${v} --dev`,
        setupNodes: (d, ids, v) =>
            `solo consensus node setup -i ${ids} --deployment ${d} --release-tag ${v} --quiet-mode --dev`,
        startNodes: (d, ids) =>
            `solo consensus node start -i ${ids} --deployment ${d} --dev`,
        createAccount: (d, ecdsa) =>
            `solo ledger account create${ecdsa ? " --generate-ecdsa-key" : ""} --deployment ${d} --dev`,
        updateAccount: (id, hbar, d) =>
            `solo ledger account update --account-id ${id} --hbar-amount ${hbar} --deployment ${d} --dev`,
        deployMirrorNode: (c, d, v, ingress) =>
            `solo mirror node add --cluster-ref kind-${c} --deployment ${d} --mirror-node-version ${v} --pinger${ingress ? " --enable-ingress" : ""} --dev`,
        deployRelay: (d, valuesFile) =>
            `solo relay node add -i node1 --deployment ${d}${valuesFile ? ` --values-file ${valuesFile}` : ""} --dev`,
    };
}

/**
 * Generates commands for the older Solo CLI style (pre-v0.44.0).
 */
function oldStyleCommands(): SoloCommands {
    return {
        connectCluster: (c) =>
            `solo cluster-ref connect --cluster-ref kind-${c} --context kind-${c} --dev`,
        createDeployment: (ns, d) =>
            `solo deployment create -n ${ns} --deployment ${d} --dev`,
        attachCluster: (d, c, n) =>
            `solo deployment add-cluster --deployment ${d} --cluster-ref kind-${c} --num-consensus-nodes ${n} --dev`,
        generateKeys: (d, ids) =>
            `solo node keys --gossip-keys --tls-keys -i ${ids} --deployment ${d} --dev`,
        setupNamespace: (c) =>
            `solo cluster-ref setup -s ${c} --dev`,
        deployNetwork: (d, ids, v) =>
            `solo network deploy -i ${ids} --deployment ${d} --release-tag ${v} --dev`,
        setupNodes: (d, ids, v) =>
            `solo node setup -i ${ids} --deployment ${d} --release-tag ${v} --quiet-mode --dev`,
        startNodes: (d, ids) =>
            `solo node start -i ${ids} --deployment ${d} --dev`,
        createAccount: (d, ecdsa) =>
            `solo account create${ecdsa ? " --generate-ecdsa-key" : ""} --deployment ${d} --dev`,
        updateAccount: (id, hbar, d) =>
            `solo account update --account-id ${id} --hbar-amount ${hbar} --deployment ${d} --dev`,
        deployMirrorNode: (c, d, v, ingress) =>
            `solo mirror-node deploy --cluster-ref kind-${c} --deployment ${d} --mirror-node-version ${v} --pinger${ingress ? " --enable-ingress" : ""} --dev`,
        deployRelay: (d, valuesFile) =>
            `solo relay deploy -i node1 --deployment ${d}${valuesFile ? ` --values-file ${valuesFile}` : ""} --dev`,
    };
}

/**
 * Detects the Solo CLI version and returns a fully resolved SoloContext.
 */
export async function resolveSoloContext(): Promise<SoloContext> {
    const ge0440 = await checkSoloVersion();
    return {
        clusterName: CLUSTER_NAME,
        namespace: NAMESPACE,
        deployment: DEPLOYMENT_NAME,
        ge0440,
        cmd: ge0440 ? newStyleCommands() : oldStyleCommands(),
    };
}
