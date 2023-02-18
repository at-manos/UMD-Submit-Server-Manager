export interface DotSubmit {
  courseName: string;
  semester: string;
  projectNumber: string;
  courseKey: string;
  authentication: string;
  baseURL: string;
  submitURL: string;
}

export function dotSubmitFromMap(propMap: Map<string, string>): DotSubmit {
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

export interface SubmitUser {
  courseName: string;
  section?: string;
  projectNumber: string;
  semester: string;
  classAccount?: string;
  cvsAccount?: string;
  oneTimePassword: string;
}

export function submitUserFromMap(propMap: Map<string, string>): SubmitUser {
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
