export interface DotSubmit {
  courseName: string | undefined;
  semester: string | undefined;
  projectNumber: string | undefined;
  courseKey: string | undefined;
  authentication: string | undefined;
  baseURL: string | undefined;
  submitURL: string | undefined;
}

export interface SubmitUser {
  courseName: string | undefined;
  section?: string | undefined;
  projectNumber: string | undefined;
  semester: string | undefined;
  classAccount?: string | undefined;
  cvsAccount?: string | undefined;
  oneTimePassword: string | undefined;
}
