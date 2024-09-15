import * as vscode from 'vscode'
import { exec } from 'child_process'
import { spawn } from 'child_process'

const COMMANDS = {
  addCommand: 'vscode-command-help.addCommand',
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(COMMANDS.addCommand, (word) => {
    const config = vscode.workspace.getConfiguration('vscode-command-help')
    config.update('commands', (config.get('commands') as string[]).concat([word]))
  })


  context.subscriptions.push(
    disposable,
    vscode.languages.registerHoverProvider('shellscript', {
      provideHover,
    }),
    // quick fix
    /* vscode.languages.registerCodeActionsProvider('shellscript',
      new ActionProvider(), {
      providedCodeActionKinds: ActionProvider.providedCodeActionKinds,
    }),
    */
  )

}

export function deactivate() {}

async function getCommandHelp(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      `${vscode.workspace.getConfiguration('vscode-command-help').get('pre') ?? ':'} && ${command} --help`,
      { shell: '/bin/bash', cwd: vscode.workspace.workspaceFolders?.[0].uri.path },
      (error, stdout, stderr) => {
        resolve(stdout + '\n' + stderr)
      },
    )
  })
}

function provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
  const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_./-]+/)
  if (!wordRange) {
    return
  }

  const config = vscode.workspace.getConfiguration('vscode-command-help')
  const word = document.getText(wordRange)
  if (!(config.get('commands') as string[]).includes(word)) {
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

    const wordRange = document.getWordRangeAtPosition(range.start)
    if (!wordRange) {
      return []
    }

    const word = document.getText(wordRange)
    if (commands.includes(word) || !word || word.startsWith('-')) {
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
