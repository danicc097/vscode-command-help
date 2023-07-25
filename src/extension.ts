import * as vscode from 'vscode';
import { exec } from 'child_process';
import { spawn } from 'child_process';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-command-help" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-command-help.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-command-help!');
	});


	context.subscriptions.push(disposable);

  context.subscriptions.push(vscode.languages.registerHoverProvider('shellscript', {
    provideHover
  }));
}

// This method is called when your extension is deactivated
export function deactivate() {}

// Function to run the shell command and get the output
async function getCommandHelp(word: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const childProcess = spawn(word, ['--help'], {shell: '/bin/bash',});
    let output = '';

    childProcess.stdout.on('data', (data) => {
      output += "\n"+data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      output += "\n"+data.toString();
    });

    childProcess.on('error', (error) => {
      output += "\n"+error.toString();
    });

    childProcess.on('close', (code) => {
        resolve(output);
    });
  });
}

// Function to create the hover provider
function provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
  const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_./-]+/);
  if (!wordRange) {
    return undefined;
  }

  /**
   * TODO: only execute from dict of allowed commands. (simple `Add to vscode-command-help`)
     we will get dynamic help, so we need to execute the command... Use at own risk
   */
  const word = document.getText(wordRange);
  vscode.window.showInformationMessage(word);
  return getCommandHelp(word).then((output) => {
    return new vscode.Hover(new vscode.MarkdownString(output));
  });
}
