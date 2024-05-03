const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
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
					file = file.trim().slice(2).replace(" ", "");
					let fileName = path.basename(file);
					const item = new vscode.TreeItem(fileName);
					const extension = path.extname(file).slice(1);
					item.iconPath = new vscode.ThemeIcon(extension);

					item.iconPath = __dirname + '/icons/file_type_' + extension + '.svg';
					if (!fs.existsSync(item.iconPath)) {
						item.iconPath = __dirname + '/icons/file_type_default.svg';
					}

					const absoluteFilePath = path.join(vscode.workspace.rootPath, file);
					item.tooltip = absoluteFilePath;
					
					item.command = {
						command: 'vscode.open',
						arguments: [vscode.Uri.file(absoluteFilePath)],
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
				const item6 = new vscode.TreeItem('No data, please try to open a git repository');
				return Promise.resolve([item1, item2, item3]);
			}
			
			const modifiedFilesPromise = new Promise((resolve, reject) => {
				cp.exec('git status --short', { cwd: this.workspaceRoot }, (err, stdout) => {
					if (err) {
						console.error(err);
						resolve(new vscode.TreeItem('Oops, something went wrong'));
					} else {
						const files = stdout.split('\n').filter(file => !!file);
						resolve(new FileItem('Modified Files', files));
					}
				});
			});
			
			return Promise.all([Promise.resolve(item1), Promise.resolve(item2), Promise.resolve(item3), modifiedFilesPromise]);
        }
    }
}

function activate(context) {
	const myDataProvider = new MyDataProvider();
	vscode.window.registerTreeDataProvider('writemycommitsView', myDataProvider);

  
	vscode.workspace.onDidSaveTextDocument(() => {
    myDataProvider.refresh();
	});

  const refreshCommand = vscode.commands.registerCommand('writemycommits.refresh', async () => {
    myDataProvider.refresh();
  });
  
	const getUserInputCommand = vscode.commands.registerCommand('writemycommits.getUserInput', async () => {
    const type = await vscode.window.showQuickPick(['Feat', 'Build', 'Chore', 'Fix', 'Docs', 'Style', 'Ci', 'Refactor', 'Perf', 'Test'], { placeHolder: 'Select commit type' });
		let isBreakingChange = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Is it a breaking change?' });
		const scope = await vscode.window.showInputBox({ prompt: 'Enter commit scope (optional)' });
		const description = await vscode.window.showInputBox({ prompt: 'Enter commit description' });
		isBreakingChange === 'Yes' ? isBreakingChange = true : isBreakingChange = false;
		
    const commitMessageFormat = vscode.workspace.getConfiguration('writemycommits').get('commitMessageFormat');
    
    const commitMessage = commitMessageFormat
      	.replace('{type}', type)
      	.replace('{scope}', scope)
      	.replace('{message}', description)
      	.replace('{breakingChange}', isBreakingChange ? '!' : '');
		
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

	context.subscriptions.push(getUserInputCommand);
	context.subscriptions.push(getUserInputFullCommand);
  	context.subscriptions.push(refreshCommand);
}

exports.activate = activate;
