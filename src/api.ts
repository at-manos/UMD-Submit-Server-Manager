/* eslint-disable @typescript-eslint/naming-convention */
import * as FormData from "form-data";
import fetch from "node-fetch";
import { javaPropertiesToMap } from "./fileUtilities";
import { DotSubmit, SubmitUser } from "./properties";
import { json } from "stream/consumers";

export interface Credentials {
  username: string | undefined;
  password: string | undefined;
}

export async function getSubmitUser(
  properties: DotSubmit,
  credentials: Credentials
): Promise<SubmitUser> {
  let params = new URLSearchParams();
  params.append("projectNumber", properties.projectNumber);
  params.append("courseKey", properties.courseKey);
  params.append("loginName", credentials.username);
  params.append("password", credentials.password);

  console.log(params.toString());
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
  console.log(
    properties.baseURL + "/eclipse/NegotiateOneTimePassword?" + params
  );

  let data = await response.text();
  // Need to check if password is correct
  if (data.includes("failed to negotiate oneTime password")) {
    throw new Error("Incorrect password");
  }
  console.log(data);
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
  console.log(formData);
  console.log(formData.getHeaders());
  let fetched = await fetch(dot.submitURL, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });
  return fetched.text();
}
