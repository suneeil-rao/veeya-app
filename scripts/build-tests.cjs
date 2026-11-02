const { readdir } = require("node:fs/promises");
const path = require("node:path");
const { build } = require("esbuild");

const projectRoot = path.resolve(__dirname, "..");
const testsDirectory = path.join(projectRoot, "tests");

async function findTests(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return findTests(entryPath);
            }
            if (
                entry.isFile() &&
                entry.name.endsWith(".ts") &&
                !entry.name.endsWith(".d.ts")
            ) {
                return [entryPath];
            }
            return [];
        }),
    );
    return files.flat().sort();
}

async function main() {
    const entryPoints = await findTests(testsDirectory);
    if (entryPoints.length === 0) {
        throw new Error("No TypeScript tests found under tests/.");
    }
    await build({
        entryPoints,
        outbase: testsDirectory,
        outdir: path.join(projectRoot, "dist", "tests"),
        bundle: true,
        platform: "neutral",
        format: "esm",
        external: ["k6", "k6/*"],
        logLevel: "info",
    });
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
