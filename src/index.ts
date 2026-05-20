import { setFailed } from "@actions/core";
import { setupDependencies, resolveSoloContext } from "./setup.js";
import { deployConsensusNetwork }               from "./network.js";
import { deployMirrorNode, deployRelay }        from "./services.js";
import { createAccount }                        from "./accounts.js";

async function run(): Promise<void> {
    await setupDependencies();

    const ctx = await resolveSoloContext();

    await deployConsensusNetwork(ctx);
    await deployMirrorNode(ctx);
    await deployRelay(ctx);
    await createAccount("ecdsa",    ctx);
    await createAccount("ed25519",  ctx);
}

run().catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    setFailed(`Unhandled error: ${msg}`);
});
