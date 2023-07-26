import * as vscode from 'vscode'
import { exec } from 'child_process'
import { spawn } from 'child_process'

const COMMANDS = {
  addCommand: 'vscode-command-help.addCommand',
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('vscode-command-help')
  console.log(config.get('commands'))
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(COMMANDS.addCommand, (word) => {
    config.update('commands', (config.get('commands') as string[]).concat([word]))
  })

  context.subscriptions.push(
    disposable,
    vscode.languages.registerHoverProvider('shellscript', {
      provideHover,
    }),
    vscode.languages.registerCodeActionsProvider('shellscript', new ActionProvider(), {
      providedCodeActionKinds: ActionProvider.providedCodeActionKinds,
    }),
  )
}

// This method is called when your extension is deactivated
export function deactivate() {}

// Function to run the shell command and get the output
async function getCommandHelp(word: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const childProcess = spawn(word, ['--help'], { shell: '/bin/bash' })
    let output = ''

    childProcess.stdout.on('data', (data) => {
      output += '\n' + data.toString()
    })

    childProcess.stderr.on('data', (data) => {
      output += '\n' + data.toString()
    })

    childProcess.on('error', (error) => {
      output += '\n' + error.toString()
    })

    childProcess.on('close', (code) => {
      resolve(output)
    })
  })
}

// Function to create the hover provider
function provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
  const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_./-]+/)
  if (!wordRange) {
    return
  }

  /**
   * TODO: only execute from dict of allowed commands. (simple `Add to vscode-command-help`)
     we will get dynamic help, so we need to execute the command... Use at own risk
   */
  const word = document.getText(wordRange)
  if (word.startsWith('-')) {
    return
  }

  return getCommandHelp(word).then((output) => {
    const hoverContent = new vscode.MarkdownString('```\n' + output + '\n```')

    hoverContent.isTrusted = true
    return new vscode.Hover(hoverContent)
  })
}

export class ActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix]

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    const config = vscode.workspace.getConfiguration('vscode-command-help')
    const commands = config.get('commands') as string[]
    console.log({ commands })
    const wordRange = document.getWordRangeAtPosition(range.start)
    if (!wordRange) {
      return []
    }

    const word = document.getText(wordRange)
    if (!word || word.startsWith('-')) {
      return []
    }

    const action = new vscode.CodeAction('Add as command', vscode.CodeActionKind.QuickFix)
    action.command = {
      command: COMMANDS.addCommand,
      title: 'Add as command',
      arguments: [word],
      tooltip: 'This will save the hovered word as a command.',
    }
    return [action]
  }
}
