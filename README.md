# gen-structure

A bidirectional CLI tool for scaffolding or reverse-engineering project structures using ASCII tree diagrams or YAML—**and** for generating ASCII trees from real file/folder hierarchies.

---

## 🚀 Features

- **Generate files and folders** from an ASCII tree or YAML structure file.
- **Reverse mode:** Output an ASCII diagram from an existing folder tree.
- **Comments and metadata support** (in the tree, as `//` after file/folder names).
- **Dry-run, verbose, and output control** for safe and transparent operations.
- **Cross-platform:** Works on Windows, macOS, and Linux.

---

## 📦 Installation
- Clone the repo and install dependencies
- npx tsc
- node bin/gen-structure.js -h

## Usage
```
Usage: gen-structure [options] [input]

Bidirectional project structure generator: ASCII <-> filesystem

Arguments:
input               Input file (ASCII tree or YAML) to generate structure. Ignored if --reverse is used.

Options:
--dry-run           Just show what would be created, do not create files
-v, --verbose       Show verbose output
-o, --out <path>    Output directory (when generating files) or output file for ASCII (when using --reverse) (default: ".")
--reverse <folder>  Read a folder path and output its ASCII structure
-h, --help          display help for command
gen-structure structure.txt -o project
gen-structure --reverse project
gen-structure --reverse project -o ascii.txt
```