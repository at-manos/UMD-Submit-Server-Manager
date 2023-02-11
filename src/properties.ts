export interface DotSubmit {
  courseName: string;
  semester: string;
  projectNumber: string;
  courseKey: string;
  authentication: string;
  baseURL: string;
  submitURL: string;
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
