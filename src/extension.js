const vscode = require('vscode');

class MyDataProvider {
	constructor() {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	getTreeItem(element) {
		return element;
	}

    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        } else {
            const item1 = new vscode.TreeItem('Get My Commit name');
            item1.iconPath = new vscode.ThemeIcon('play');
            item1.command = {
                command: 'extension.getUserInput',
                title: 'Get User Input',
                arguments: []
            };

			const item2 = new vscode.TreeItem('Get My Commit name + description');
			item2.iconPath = new vscode.ThemeIcon('play');
			item2.command = {
				command: 'extension.getUserInputFull',
				title: 'Get User Input',
				arguments: []
			};
            return Promise.resolve([item1, item2]);
        }
    }
}

function activate(context) {
	const myDataProvider = new MyDataProvider();
	vscode.window.registerTreeDataProvider('writemycommits', myDataProvider);

	const getUserInputCommand = vscode.commands.registerCommand('extension.getUserInput', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Fix', 'Docs', 'Style', 'Refactor', 'Test'], { placeHolder: 'Select commit type' });
		const isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '' : '!'}: ${description}`;
		await vscode.env.clipboard.writeText(commitMessage);

		vscode.window.showInformationMessage('Commit name copied to clipboard');
	});

	const getUserInputFullCommand = vscode.commands.registerCommand('extension.getUserInputFull', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Fix', 'Docs', 'Style', 'Refactor', 'Test'], { placeHolder: 'Select commit type' });
		const isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });	
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });
		const body = await vscode.window.showInputBox({ prompt: 'Enter commit body' });
		const footer = await vscode.window.showInputBox({ prompt: 'Enter commit footer' });

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '' : '!'}: ${description}${body ? `\n\n${body}` : ''}${footer ? `\n\n${isBreakingChange ? '' : 'BREAKING CHANGE : '}${footer}` : ''}`;
		await vscode.env.clipboard.writeText(commitMessage);

		vscode.window.showInformationMessage('Commit message copied to clipboard');
	});

	context.subscriptions.push(getUserInputCommand);
	context.subscriptions.push(getUserInputFullCommand);
}

exports.activate = activate;