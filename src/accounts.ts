import { getInput, info, setOutput } from "@actions/core";
import { readFileSync } from "fs";
import {
    soloRun,
    runCommand,
    extractAccountAsJson,
} from "./utils.js";
import type { AccountInfo, SoloContext } from "./types.js";
import { DEFAULT_HBAR_AMOUNT } from "./constants.js";

/**
 * Creates an account (ECDSA or ED25519), updates its HBAR balance,
 * and writes the account details to action outputs.
 */
export async function createAccount(
    type: "ecdsa" | "ed25519",
    ctx: SoloContext,
): Promise<void> {
    const outputFile = `account_create_output_${type}.txt`;
    const hbarAmount = getInput("hbarAmount") || DEFAULT_HBAR_AMOUNT;
    const isEcdsa = type === "ecdsa";

    info(`Creating ${type.toUpperCase()} account...`);

    try {
        // Create the account and capture output
        const createCmd = `${ctx.cmd.createAccount(ctx.deployment, isEcdsa)} > ${outputFile}`;
        await runCommand(`bash -c '${createCmd}'`);

        // Parse the account JSON from the CLI output
        const content = readFileSync(outputFile, "utf-8");
        const accountJson = extractAccountAsJson(content);
        const { accountId, publicKey } = JSON.parse(accountJson) as AccountInfo;

        if (!accountId || !publicKey) {
            info("Account ID or public key not found, skipping account creation");
            return;
        }

        // Retrieve the private key from the Kubernetes secret
        const privateKeyCmd = `kubectl get secret account-key-${accountId} -n ${ctx.namespace} -o jsonpath='{.data.privateKey}' | base64 -d | xargs`;
        let privateKey = "";
        await runCommand(`bash -c "${privateKeyCmd}"`, {
            listeners: {
                stdout: (data: Buffer) => { privateKey += data.toString(); },
            },
        });

        // Fund the account
        await soloRun(ctx.cmd.updateAccount(accountId, hbarAmount, ctx.deployment));

        info(`accountId=${accountId}`);
        info(`publicKey=${publicKey}`);
        info(`privateKey=${privateKey.trim()}`);

        // Write type-specific outputs
        if (isEcdsa) {
            setOutput("ecdsaAccountId",  accountId);
            setOutput("ecdsaPublicKey",  publicKey);
            setOutput("ecdsaPrivateKey", privateKey.trim());
        } else {
            setOutput("ed25519AccountId",  accountId);
            setOutput("ed25519PublicKey",  publicKey);
            setOutput("ed25519PrivateKey", privateKey.trim());

            // Generic outputs for backward compatibility
            setOutput("accountId",  accountId);
            setOutput("publicKey",  publicKey);
            setOutput("privateKey", privateKey.trim());
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create ${type} account: ${msg}`, { cause: error });
    }
}
