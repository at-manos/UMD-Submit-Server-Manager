import * as fs from "fs";
import * as vscode from "vscode";
import { Credentials, getSubmitUser, submitProject } from "./api";
import { archiveFolder, javaPropertiesToMap } from "./fileUtilities";
import { LocalStorageService } from "./localStorageService";
import { DotSubmit, SubmitUser } from "./properties";

/**
 * Runs on extension activation
 *
 * @export activate
 * @async
 * @param {vscode.ExtensionContext} context
 * @returns {*}
 */
export async function activate(context: vscode.ExtensionContext) {
  let storageManager = new LocalStorageService(context.workspaceState);

  let submit = vscode.commands.registerCommand(
    "umd-submit-server-manager.submit",
    async (uri: vscode.Uri) => {
      let projectFolder: vscode.Uri =
        uri === undefined ? getProjectFolderUri() : uri;

      let submitFileResult = checkSubmitFile(projectFolder);
      if (!submitFileResult) {
        vscode.window.showInformationMessage(
          "No .submit file found in project folder"
        );
        return;
      }

      let credentials: Credentials =
        storageManager.getValue<Credentials>("credentials");

      if (credentials === null || credentials === undefined) {
        let folderName: string = projectFolder.fsPath.split("/").pop();
        credentials = await promptUser(folderName);
        if (credentials === undefined) {
          return undefined;
        }
      }

      let dot: DotSubmit = getSubmitProps(projectFolder);

      try {
        await getSubmitUser(dot, credentials);
      } catch (error) {
        vscode.window.showInformationMessage(error.message);
        return;
      }
      storageManager.setValue("credentials", credentials);
      let submitUser = await getSubmitUser(dot, credentials);

      let archive = await archiveFolder(getProjectFolderUri());

      vscode.window.showInformationMessage(
        await submitProject(dot, submitUser, archive)
      );
    }
  );
  let resetCredentials = vscode.commands.registerCommand(
    "umd-submit-server-manager.resetCredentials",
    () => {
      storageManager.setValue("credentials", null);
    }
  );

  context.subscriptions.push(submit, resetCredentials);
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
 * Checks if the provided URI contains a .submit file
 *
 * @param {vscode.Uri} uri - The uri to check
 * @returns {boolean} true if the URI contains a .submit file, false otherwise
 */
function checkSubmitFile(uri: vscode.Uri): boolean {
  if (uri === undefined) {
    return false;
  }

  if (fs.lstatSync(uri.fsPath).isDirectory()) {
    let submitFile = uri.fsPath + "/.submit";

    return fs.existsSync(submitFile);
  }
  return false;
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
  console.debug(data);
  let dot: DotSubmit = {
    courseName: propMap.get("courseName"),
    semester: propMap.get("semester"),
    projectNumber: propMap.get("projectNumber"),
    courseKey: propMap.get("courseKey"),
    authentication: propMap.get("authentication.type"),
    baseURL: propMap.get("baseURL"),
    submitURL: propMap.get("submitURL"),
  };
  return dot;
}
