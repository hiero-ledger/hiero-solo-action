/** Parsed account information returned by Solo CLI */
export interface AccountInfo {
    accountId: string;
    publicKey: string;
    balance: number;
}

/**
 * Version-resolved command builders.
 * Each method returns a fully-formed CLI string ready to pass to soloRun().
 * Factories for the two CLI generations are built once in resolveSoloContext()
 * so version branching never leaks into orchestration code.
 */
export interface SoloCommands {
    connectCluster:   (clusterName: string) => string;
    createDeployment: (ns: string, deployment: string) => string;
    attachCluster:    (deployment: string, clusterName: string, numNodes: number) => string;
    generateKeys:     (deployment: string, nodeIds: string) => string;
    setupNamespace:   (clusterName: string) => string;
    deployNetwork:    (deployment: string, nodeIds: string, version: string) => string;
    setupNodes:       (deployment: string, nodeIds: string, version: string) => string;
    startNodes:       (deployment: string, nodeIds: string) => string;
    /** @param ecdsaKey - when true appends --generate-ecdsa-key */
    createAccount:    (deployment: string, ecdsaKey: boolean) => string;
    updateAccount:    (accountId: string, hbarAmount: string, deployment: string) => string;
    /** @param enableIngress - when true appends --enable-ingress */
    deployMirrorNode: (clusterName: string, deployment: string, version: string, enableIngress: boolean) => string;
    /** @param valuesFile - optional path to a relay values YAML */
    deployRelay:      (deployment: string, valuesFile?: string) => string;
}


/**
 * Built once after Solo CLI version detection.
 * Passed through the orchestration pipeline so every module has
 * cluster/namespace/deployment identity and pre-resolved commands.
 */
export interface SoloContext {
    clusterName: string;
    namespace:   string;
    deployment:  string;
    ge0440:      boolean;
    cmd:         SoloCommands;
}

export type ToolType = "binary" | "tar" | "tar-xz";

export interface ToolSpec {
    /** Tool-cache key and binary name checked via which() */
    name: string;
    /** Alternate binary name(s) to probe via which() before installing */
    checkBinary?: string | string[];
    version: string;
    downloadUrl: string;
    type: ToolType;
    /** Sub-path inside the cached directory to add to PATH (e.g. "bin") */
    binSubPath?: string;
    /** Known sub-directory name inside the extracted tarball */
    dirFixed?: string;
    /** Scan extracted tarball for an entry whose name starts with this prefix */
    dirPrefix?: string;
}
