/* eslint-disable @typescript-eslint/naming-convention */
import * as FormData from "form-data";
import fetch from "node-fetch";
import { javaPropertiesToMap } from "./fileUtilities";
import { DotSubmit, SubmitUser } from "./properties";
import { json } from "stream/consumers";

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
 * @param {DotSubmit} properties - The .submit file
 * @param {Credentials} credentials - The credentials to negotiate with
 * @returns {Promise<SubmitUser>} - The SubmitUser object
 */
export async function getSubmitUser(
  properties: DotSubmit,
  credentials: Credentials
): Promise<SubmitUser> {
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
        "Content-Type": "application/json",
      },
    }
  );

  let data = await response.text();
  // Need to check if password is correct
  if (data.includes("failed to negotiate oneTime password")) {
    throw new Error("Incorrect password");
  }

  let propMap: Map<string, string> = javaPropertiesToMap(data);

  let submitUser: SubmitUser = {
    courseName: propMap.get("courseName"),
    section: propMap.get("section"),
    projectNumber: propMap.get("projectNumber"),
    semester: propMap.get("semester"),
    classAccount: propMap.get("classAccount"),
    cvsAccount: propMap.get("cvsAccount"),
    oneTimePassword: propMap.get("oneTimePassword"),
  };
  return submitUser;
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

  // form-data only accepts strings or buffers
  formData.append("submittedFiles", archive, { filename: "submit.zip" });

  // send form data to dot.submitURL in a form-data post request

  let fetched = await fetch(dot.submitURL, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });
  return fetched.text();
}
