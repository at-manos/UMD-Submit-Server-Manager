import * as fs from "fs";
import * as vscode from "vscode";
import { Credentials, getSubmitUser, submitProject } from "./api";
import { archiveFolder, javaPropertiesToMap } from "./fileUtilities";
import { LocalStorageService } from "./localStorageService";
import { DotSubmit, SubmitUser } from "./properties";

export async function activate(context: vscode.ExtensionContext) {
  let storageManager = new LocalStorageService(context.workspaceState);

  let submit = vscode.commands.registerCommand(
    "umd-submit-server-manager.submit",
    async () => {
      let submitFileResult = checkSubmitFile();
      if (submitFileResult === false) {
        vscode.window.showInformationMessage(
          "No .submit file found in project folder"
        );
        return;
      }

      let credentials: Credentials =
        storageManager.getValue<Credentials>("credentials");
      console.log(credentials);
      if (credentials === null || credentials === undefined) {
        credentials = await promptUser();
        if (credentials === undefined) {
          return undefined;
        }
      }

      let dot: DotSubmit = getSubmitProps();

      try {
        await getSubmitUser(dot, credentials);
      } catch (error) {
        vscode.window.showInformationMessage(error.message);
        return;
      }
      storageManager.setValue("credentials", credentials);
      let submitUser = await getSubmitUser(dot, credentials);

      let archive = await archiveFolder(getProjectFolder());

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

/*
 * This function will prompt the user for username and password in VSCode
 * TODO: This function assumes ldap, need to add support for other authentication methods (e.g. SSO)
 */
async function promptUser(): Promise<Credentials> {
  // prompt the user with the project folder name to check if they are in the correct folder
  let projectFolder = getProjectFolder();
  let projectName = projectFolder.split("/").pop();
  let prompt = "Is " + projectName + " the correct project folder?";
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

/*
 * This function will get the current project folder we are in
 */
function getProjectFolder(): string | undefined {
  let workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders?.length === 0) {
    return;
  }
  return workspaceFolders[0].uri.fsPath;
}

/*
 * This function will check if there is a file called .submit in the project folder.
 */
function checkSubmitFile(): boolean {
  let projectFolder = getProjectFolder();
  let submitFile = projectFolder + "/.submit";
  return fs.existsSync(submitFile);
}

function getSubmitProps(): DotSubmit {
  let submitFile = getProjectFolder() + "/.submit";
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
