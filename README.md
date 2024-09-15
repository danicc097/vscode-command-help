# vscode-command-help

Show command `--help` documentation on hover. Assumes `/bin/bash` is available. 

Usage:

```json
"vscode-command-help.commands": [
      "oapi-codegen",
      "sqlc",
      "yq",
      "pnpm",
    ],
```

![alt text](./.github/example.png)

# Development

```
npm i
npm exec -- vsce package
```
