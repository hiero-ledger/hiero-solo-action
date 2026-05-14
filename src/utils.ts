import { info } from "@actions/core";
import { exec } from "@actions/exec";
import type { ExecOptions } from "@actions/exec";
import { spawn } from "child_process";

function stripQuotes(arg: string): string {
    if (
        (arg.startsWith('"') && arg.endsWith('"')) ||
        (arg.startsWith("'") && arg.endsWith("'"))
    ) {
        return arg.slice(1, -1);
    }
    return arg;
}

function parseCommandStr(
    commandStr: string,
): { command: string; args: string[] } | null {
    const tokens = commandStr.match(/[^\s"']+|"[^"]*"|'[^']*'/g) ?? [];
    const [command, ...rest] = tokens;
    if (!command) return null;
    return { command, args: rest.map(stripQuotes) };
}

/**
 * Parses a shell-style command string and executes it via @actions/exec.
 */
export async function runCommand(
    commandStr: string,
    options?: ExecOptions,
): Promise<number> {
    const parsed = parseCommandStr(commandStr);
    if (!parsed) return 0;
    return exec(parsed.command, parsed.args, options);
}

/**
 * Convenience alias for runCommand — used for Solo CLI invocations.
 */
export async function soloRun(
    commandStr: string,
    options?: ExecOptions,
): Promise<number> {
    return runCommand(commandStr, options);
}

/**
 * Extracts the account information from the output text
 * @param inputText - The text to extract the account information from
 * @returns The account information as a JSON string
 */
export function extractAccountAsJson(inputText: string): string {
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
 * Port-forwards a Kubernetes service if it exists in the given namespace.
 */
export async function portForwardIfExists(
    service: string,
    portSpec: string,
    namespace: string,
): Promise<void> {
    try {
        const exitCode = await runCommand(
            `kubectl get svc ${service} -n ${namespace}`,
        );

        if (exitCode === 0) {
            info(`Service ${service} exists`);

            const portForwardProcess = spawn(
                "kubectl",
                ["port-forward", `svc/${service}`, "-n", namespace, portSpec],
                { detached: true, stdio: "ignore" },
            );

            portForwardProcess.on("error", (err) => {
                info(
                    `Port-forward process error for ${service}: ${err.message}`,
                );
            });

            portForwardProcess.unref();
            info(`Port-forward started for ${service} on ${portSpec}`);
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        info(
            `Service ${service} not found or error occurred: ${msg}, skipping port-forward`,
        );
    }
}


/**
 * Returns true when `version` is greater than or equal to `target`.
 */
export function isVersionGte(version: string, target: string): boolean {
    const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
    const [aMajor = 0, aMinor = 0, aPatch = 0] = parse(version);
    const [bMajor = 0, bMinor = 0, bPatch = 0] = parse(target);

    if (aMajor !== bMajor) return aMajor > bMajor;
    if (aMinor !== bMinor) return aMinor > bMinor;
    return aPatch >= bPatch;
}
