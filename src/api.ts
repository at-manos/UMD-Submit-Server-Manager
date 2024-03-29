import FormData from "form-data";
import * as fs from "fs";
import fetch from "node-fetch";
import { javaPropertiesToMap, statFile } from "./fileUtilities";
import { DotSubmit, SubmitUser, submitUserFromMap } from "./properties";

/**
 * Simple interface for credentials
 *
 * @export
 * @interface Credentials
 * @typedef {Credentials}
 */
export interface Credentials {
  /**
   * Username (Same as Shibboleth UMD username)
   *
   * @type {(string)}
   */
  username: string;
  /**
   * Password (Same as Shibboleth UMD password)
   *
   * @type {(string)}
   */
  password: string;
}

/**
 * Gets the SubmitUser file using the provided credentials and .submit file
 *
 * @export
 * @async
 * @param {vscode.Uri} projectFolder - The project folder
 * @param {DotSubmit} properties - The .submit file
 * @param {Credentials} credentials - The credentials to negotiate with
 * @returns {Promise<SubmitUser>} - The SubmitUser object
 */
export async function getSubmitUser(
  projectFolder: vscode.Uri,
  properties: DotSubmit,
  credentials: Credentials
): Promise<SubmitUser> {
  if (statFile(projectFolder, ".submitUser")) {
    let propMap: Map<string, string> = javaPropertiesToMap(
      fs.readFileSync(projectFolder.fsPath + "/" + ".submitUser", "utf8")
    );
    return submitUserFromMap(propMap);
  }
  let params = new URLSearchParams();
  params.append("projectNumber", properties.projectNumber);
  params.append("courseKey", properties.courseKey);
  params.append("loginName", credentials.username);
  params.append("password", credentials.password);

  let response = await fetch(
    properties.baseURL + "/eclipse/NegotiateOneTimePassword?" + params,
    {
      method: "POST",
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
      },
    }
  );

  let data = await response.text();
  if (data.includes("failed to negotiate oneTime password")) {
    throw new Error("Incorrect username or password");
  }
  fs.writeFileSync(projectFolder.fsPath + "/" + ".submitUser", data);

  let propMap: Map<string, string> = javaPropertiesToMap(data);

  return submitUserFromMap(propMap);
}

export async function getProjectPK(dot: DotSubmit) {
  let params = new URLSearchParams();
  params.append("courseKey", dot.courseKey);
  console.log(dot.baseURL + "/feed/CourseCalendar" + params);
  let response = await fetch(dot.baseURL + "/feed/CourseCalendar?" + params, {
    method: "GET",
  });
  let data = await response.text();
  console.log(data);
  let split: string[] = data.split("\n");
  for (let i = 0; i < split.length; i++) {
    if (split[i].includes(dot.projectNumber)) {
      return split[i + 5].split("=")[1];
    }
  }
}
/**
 * Submits the project to the server
 *
 * @export
 * @async
 * @param {DotSubmit} dot - The .submit file
 * @param {SubmitUser} user - The SubmitUser file
 * @param {Buffer} archive - Buffer of the zip file
 * @returns {Promise<string>} - The text response from the server
 */
export async function submitProject(
  dot: DotSubmit,
  user: SubmitUser,
  archive: Buffer
): Promise<string> {
  const formData = new FormData();
  formData.append("oneTimePassword", user.oneTimePassword);
  formData.append(
    "classAccount",
    user.cvsAccount === undefined ? null : user.cvsAccount
  );
  formData.append(
    "cvsAccount",
    user.cvsAccount === undefined ? null : user.cvsAccount
  );
  formData.append("courseName", dot.courseName);
  formData.append("projectNumber", dot.projectNumber);
  formData.append("semester", dot.semester);

  let packageJson = require("../package.json");
  formData.append("submitClientVersion", packageJson.version);
  formData.append("submitClientTool", "atmanos-vscode");

  formData.append("submittedFiles", archive, { filename: "submit.zip" });

  let fetched = await fetch(dot.submitURL, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });
  let projectURL =
    dot.baseURL + "/view/project.jsp?projectPK=" + (await getProjectPK(dot));
  let resp = await (
    await fetched.text()
  ).replace(
    dot.projectNumber,
    "[" + dot.projectNumber + "]" + "(" + projectURL.trim() + ")"
  );
  return resp;
}
