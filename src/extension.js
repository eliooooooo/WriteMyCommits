const vscode = require('vscode');
const cp = require('child_process');

class FileItem extends vscode.TreeItem {
	constructor(label, files) {
		super(label + (files.length ? ' (' + files.length + ')' : " (0)"), vscode.TreeItemCollapsibleState.Expanded);
		this.files = files;
	}
}

class MyDataProvider {
	constructor() {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element) {
		return element;
	}

    getChildren(element) {
        if (element) {
			if (element instanceof FileItem) {
				return Promise.resolve(element.files.map(file => {
					const path = require('path');
					const item = new vscode.TreeItem(file);
					const extension = path.extname(file).slice(1);
					item.iconPath = new vscode.ThemeIcon(extension);

					item.command = {
						command: 'vscode.open',
						arguments: [vscode.Uri.file(path.join(this.workspaceRoot, file))],
						title: 'Open File'
					};

					return item;
				}));
			} else {
				return Promise.resolve([]);
			}
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

            if (!this.workspaceRoot) {
                vscode.window.showInformationMessage('No data');
				const item4 = new vscode.TreeItem('No data, please try to open a git repository');
                return Promise.resolve([item1, item2, item3, item4]);
            }

			const stagedFilesPromise = new Promise((resolve, reject) => {
				cp.exec('git diff --name-only --cached', { cwd: this.workspaceRoot }, (err, stdout) => {
					if (err) {
						console.error(err);
						resolve(new vscode.TreeItem('Oops, something went wrong'));
					} else {
						const files = stdout.split('\n').filter(file => !!file);
						resolve(new FileItem('Staged Files', files));
					}
				});
			});
			
			const modifiedFilesPromise = new Promise((resolve, reject) => {
				cp.exec('git diff --name-only', { cwd: this.workspaceRoot }, (err, stdout) => {
					if (err) {
						console.error(err);
						resolve(new vscode.TreeItem('Oops, something went wrong'));
					} else {
						const files = stdout.split('\n').filter(file => !!file);
						resolve(new FileItem('Modified Files', files));
					}
				});
			});
			
			return Promise.all([Promise.resolve(item1), Promise.resolve(item2), Promise.resolve(item3), stagedFilesPromise, modifiedFilesPromise]);
        }
    }
}

function activate(context) {
	console.log('Congratulations, your extension "WriteMyCommits" is now active!');
	const myDataProvider = new MyDataProvider();
	vscode.window.registerTreeDataProvider('writemycommits', myDataProvider);

	vscode.workspace.onDidSaveTextDocument(() => {
		myDataProvider.refresh();
	});

	const getUserInputCommand = vscode.commands.registerCommand('writemycommits.getUserInput', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Build', 'Chore', 'Fix', 'Docs', 'Style', 'Ci', 'Refactor', 'Perf', 'Test'], { placeHolder: 'Select commit type' });
		let isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope (optional)' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });
		isBreakingChange === 'Yes' ? isBreakingChange = true : isBreakingChange = false;

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '!' : ''}: ${description}`;
		await vscode.env.clipboard.writeText(commitMessage);

		vscode.window.showInformationMessage('Commit name copied to clipboard');
	});

	const getUserInputFullCommand = vscode.commands.registerCommand('writemycommits.getUserInputFull', async () => {
		const type = await vscode.window.showQuickPick(['Feat', 'Fix', 'Docs', 'Style', 'Refactor', 'Test'], { placeHolder: 'Select commit type' });
		let isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });	
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope (optional)' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });
		const body = await vscode.window.showInputBox({ prompt: 'Enter commit body (optional)' });
		const footer = await vscode.window.showInputBox({ prompt: 'Enter commit footer (optional)' });
		isBreakingChange === 'Yes' ? isBreakingChange = true : isBreakingChange = false;

		const commitMessage = `${type}${scope ? `(${scope})` : ''}${isBreakingChange ? '!' : ''}: ${description}${body ? `\n\n${body}` : ''}${footer ? `\n\n${isBreakingChange ? 'BREAKING CHANGE : ' : ''}${footer}` : ''}`;
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
