import * as fs from "fs";
import * as vscode from "vscode";
import { Credentials, getSubmitUser, submitProject } from "./api";
import { archiveFolder, javaPropertiesToMap, statFile } from "./fileUtilities";
import { DotSubmit, SubmitUser, dotSubmitFromMap } from "./properties";

/**
 * Runs on extension activation (defined in package.json > activationEvents)
 *
 * @export activate
 * @async
 * @param {vscode.ExtensionContext} context
 * @returns {*}
 */

export async function activate(context: vscode.ExtensionContext) {
  vscode.commands.executeCommand(
    "setContext",
    "umd-submit-server-manager.active",
    true
  );
  let submit = vscode.commands.registerCommand(
    "umd-submit-server-manager.submit",
    async (uri: vscode.Uri) => {
      // Get the project folder either from the current editor or from context selection.
      let projectFolder: vscode.Uri =
        uri === undefined ? getProjectFolderUri() : uri;

      let submitFileResult = statFile(projectFolder, ".submit");
      if (!submitFileResult) {
        vscode.window.showInformationMessage(
          "No .submit file found in project folder"
        );
        return;
      }
      let credentials = undefined;
      if (!statFile(projectFolder, ".submitUser")) {
        let folderName: string = projectFolder.fsPath.split("/").pop();
        credentials = await promptUser(folderName);
        if (credentials === undefined) {
          return;
        }
      }

      let dot: DotSubmit = getSubmitProps(projectFolder);
      let submitUser: SubmitUser;
      try {
        submitUser = await getSubmitUser(projectFolder, dot, credentials);
      } catch (error) {
        vscode.window.showInformationMessage(error.message);
        return;
      }

      let archive = await archiveFolder(projectFolder.fsPath);

      vscode.window.showInformationMessage(
        await submitProject(dot, submitUser, archive)
      );
    }
  );

  context.subscriptions.push(submit);
}

/**
 * Runs on extension deactivation.
 *
 * @export deactivate
 * @async
 */
export function deactivate() {
  vscode.commands.executeCommand(
    "setContext",
    "umd-submit-server-manager.active",
    false
  );
}

/**
 * Prompts the user for their UMD credentials
 *
 * @todo Add support for other authentication methods (e.g. SSO OTP)
 * @async
 * @returns {Promise<Credentials>}
 */
async function promptUser(folderName: string): Promise<Credentials> {
  // prompt the user with the project folder name to check if they are in the correct folder
  let prompt = "Is " + folderName + " the correct project folder?";
  let correctFolder = await vscode.window.showQuickPick(["Yes", "No"], {
    placeHolder: prompt,
  });
  if (correctFolder === "No") {
    return undefined;
  }

  let username = await vscode.window.showInputBox({
    prompt: "Enter your UMD username\n",
  });
  if (username === undefined) {
    return undefined;
  }

  let password = await vscode.window.showInputBox({
    prompt: "Enter your UMD password\n",
    password: true,
  });
  if (password === undefined) {
    return undefined;
  }
  return { username: username, password: password } as Credentials;
}

/**
 * Gets the current project folder URI
 *
 * @returns {vscode.Uri} - The URI of the current project folder
 */
function getProjectFolderUri(): vscode.Uri {
  let workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders?.length === 0) {
    return;
  }
  return workspaceFolders[0].uri;
}

/**
 * Gets an interface representing the .submit file
 *
 * @returns {DotSubmit} - An interface representing the .submit file
 */
function getSubmitProps(uri: vscode.Uri): DotSubmit {
  let submitFile = uri.fsPath + "/.submit";
  let data = fs.readFileSync(submitFile, "utf8");

  let propMap = javaPropertiesToMap(data);
  return dotSubmitFromMap(propMap);
}
