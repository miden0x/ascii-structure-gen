import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface Options {
    dryRun?: boolean;
    verbose?: boolean;
    outputDir?: string; // NEW
}
function resolveOutPath(outputDir: string, relPath: string) {
    if (!relPath) throw new Error('Attempted to resolve an undefined relative path!');
    console.log('outputDir:', outputDir, 'fullPath:', relPath);
    return path.resolve(outputDir.toString(), relPath.toString());
}
function parseYamlAndGenerate(treeText: string, options: Options) {
    const obj = yaml.load(treeText) as Record<string, any>;
    buildFromObject(obj, options.outputDir ?? '.', options);
}
function buildFromObject(obj: Record<string, any>, base: string, options: Options) {
    for (const [key, value] of Object.entries(obj)) {
        const outPath = path.join(base, key);
        if (typeof value === 'string') {
            if (options.verbose) {
                if (value) console.log(`[FILE] ${outPath} // ${value}`);
                else console.log(`[FILE] ${outPath}`);
            }
            if (!options.dryRun) {
                const out = value ? `// ${value}\n` : "";
                fs.writeFileSync(outPath, out);
            }
        } else if (typeof value === 'object' && value !== null) {
            if (options.verbose) console.log(`[DIR] ${outPath}/`);
            if (!options.dryRun) fs.mkdirSync(outPath, { recursive: true });
            buildFromObject(value, outPath, options);
        }
    }
}
function parseAscii(treeText: string, options: Options) {
    const lines = treeText.split(/\r?\n/);
    const outputDir = options.outputDir ?? '.';

    let pathStack: string[] = [];
    let rootName: string | null = null;

    lines.forEach((rawLine) => {
        const line = rawLine.replace(/\r?\n$/, "");
        if (!line.trim()) return;

        // Handle root/first line (no tree char, ends with /)
        if (!line.match(/^[ │]*[├└│]/) && line.trim().endsWith("/")) {
            rootName = line.trim().replace(/\/$/, "");
            pathStack = [];
            const rootPath = resolveOutPath(outputDir, rootName);
            if (options.verbose) console.log(`[DIR] ${rootPath}/`);
            if (!options.dryRun) fs.mkdirSync(rootPath, { recursive: true });
            return;
        }

        const match = line.match(
            /^([ │]*)[├└]── ([^\/\s]\S*\/?|\S+)(?:[ \t]+\/\/[ \t]*(.*))?$/
        ) || line.match(
            /^([ │]*)\| {3}([^\/\s]\S*\/?|\S+)(?:[ \t]+\/\/[ \t]*(.*))?$/
        ) || line.match(
            /^([ │]*)([^\/\s]\S*\/?|\S+)(?:[ \t]+\/\/[ \t]*(.*))?$/
        );

        if (!match) return;

        const indent = match[1] || "";
        const name = match[2];
        const comment = match[3] || "";

        // Calculate depth (number of 4-spaces, pipe doesn't matter)
        const indentChunks = indent.replace(/│/g, "    ");
        const depth = Math.floor(indentChunks.length / 4);

        // Always start with the root, then as deep as we go
        const stack = rootName ? [rootName, ...pathStack.slice(0, depth)] : pathStack.slice(0, depth);
        const itemName = name.replace(/\/$/, "");
        stack.push(itemName);

        const resolvedPath = resolveOutPath(outputDir, path.join(...stack));

        if (name.endsWith("/")) {
            if (options.verbose) console.log(`[DIR] ${resolvedPath}/`);
            if (!options.dryRun) fs.mkdirSync(resolvedPath, { recursive: true });
            // Update pathStack for next depth
            pathStack = stack.slice(1); // remove root for next calculations
        } else {
            if (options.verbose) {
                if (comment) console.log(`[FILE] ${resolvedPath} // ${comment}`);
                else console.log(`[FILE] ${resolvedPath}`);
            }
            if (!options.dryRun) {
                const out = comment ? `// ${comment}\n` : "";
                fs.writeFileSync(resolvedPath, out);
            }
        }
    });
}
export function directoryToAscii(
    dirPath: string,
    prefix: string = "",
    isRoot = true
): string {
    const base = path.basename(dirPath);
    let result = isRoot ? `${base}/\n` : "";

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.git')) // skip .git folder, adjust as needed
        .sort((a, b) => {
            // Folders before files, then alphabetical
            if (a.isDirectory() !== b.isDirectory())
                return a.isDirectory() ? -1 : 1;
            return a.name.localeCompare(b.name);
        });

    const total = entries.length;
    entries.forEach((entry, idx) => {
        const isLast = idx === total - 1;
        const branch = isLast ? "└── " : "├── ";
        const nextPrefix = prefix + (isLast ? "    " : "│   ");
        if (entry.isDirectory()) {
            result += `${prefix}${branch}${entry.name}/\n`;
            result += directoryToAscii(
                path.join(dirPath, entry.name),
                nextPrefix,
                false
            );
        } else {
            result += `${prefix}${branch}${entry.name}\n`;
        }
    });
    return result;
}
export function parseAndGenerate(inputFile: string, options: Options) {
    const text = fs.readFileSync(inputFile, "utf-8");
    if (inputFile.endsWith(".yml") || inputFile.endsWith(".yaml")) {
        parseYamlAndGenerate(text, options);
    } else {
        parseAscii(text, options);
    }
}
