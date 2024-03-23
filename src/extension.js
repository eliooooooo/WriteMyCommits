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
            const item1 = new vscode.TreeItem('Get My Commit Name');
            item1.iconPath = new vscode.ThemeIcon('play');
            item1.command = {
                command: 'writemycommits.getUserInput',
                title: 'Get My Commit Name',
                arguments: []
            };

			const item2 = new vscode.TreeItem('Get My Commit name + description');
			item2.iconPath = new vscode.ThemeIcon('play');
			item2.command = {
				command: 'writemycommits.getUserInputFull',
				title: 'Get My Commit Name + Description',
				arguments: []
			};

			const item3 = new vscode.TreeItem('');

			const item4 = new vscode.TreeItem('Get exension doc');
			item4.iconPath = new vscode.ThemeIcon('file');
			item4.command = {
				command: 'vscode.open',
				title: 'Open URL',
				arguments: ['https://github.com/eliooooooo/WriteMyCommits']
			};

			const item5 = new vscode.TreeItem('');

			const item6 = new vscode.TreeItem('Get conventionnal commits doc');
			item6.iconPath = new vscode.ThemeIcon('file');
			item6.command = {
				command: 'vscode.open',
				title: 'Open URL',
				arguments: ['https://www.conventionalcommits.org/en/v1.0.0/']
			};
            return Promise.resolve([item1, item2, item3, item4, item5, item6]);
        }
    }
}

function activate(context) {
	const myDataProvider = new MyDataProvider();
	vscode.window.registerTreeDataProvider('writemycommits', myDataProvider);

	const getUserInputCommand = vscode.commands.registerCommand('writemycommits.getUserInput', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Fix', 'Docs', 'Style', 'Refactor', 'Test'], { placeHolder: 'Select commit type' });
		const isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope (optional)' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '' : '!'}: ${description}`;
		await vscode.env.clipboard.writeText(commitMessage);

		vscode.window.showInformationMessage('Commit name copied to clipboard');
	});

	const getUserInputFullCommand = vscode.commands.registerCommand('writemycommits.getUserInputFull', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Fix', 'Docs', 'Style', 'Refactor', 'Test'], { placeHolder: 'Select commit type' });
		const isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });	
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope (optional)' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });
		const body = await vscode.window.showInputBox({ prompt: 'Enter commit body (optional)' });
		const footer = await vscode.window.showInputBox({ prompt: 'Enter commit footer (optional)' });

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '' : '!'}: ${description}${body ? `\n\n${body}` : ''}${footer ? `\n\n${isBreakingChange ? '' : 'BREAKING CHANGE : '}${footer}` : ''}`;
		await vscode.env.clipboard.writeText(commitMessage);

		vscode.window.showInformationMessage('Commit message copied to clipboard');
	});

	const docCommand = vscode.commands.registerCommand('writemycommits.getDoc', async () => {
		vscode.env.openExternal(vscode.Uri.parse('https://www.conventionalcommits.org/en/v1.0.0/'));
	});

	context.subscriptions.push(getUserInputCommand);
	context.subscriptions.push(getUserInputFullCommand);
	context.subscriptions.push(docCommand);
}

exports.activate = activate;