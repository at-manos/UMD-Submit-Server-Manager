Project folder contains/can contain:
- .submitIgnore
	- Tells the submit tool what to ignore in the files sent over.
- .submitInclude
	- Tells the submit tool what to include in the files sent over.
- .submitUser
	- This is a [Java Properties file](https://docs.oracle.com/javase/7/docs/api/java/util/Properties.html#load(java.io.Reader)) obtained from sending an authentication request using ldap or manually retrieving through SSO 
	- Includes
		- loginName
          - This is held as "campusUID" on their servers.
		- classAccount
		- cvsAccount
			- Account for the concurrent version system repository held on their servers
		- oneTimePassword
			- 64-bit sequence of hexadecimal values used as an OTP.
			- e.g. '2c72f8b8605d4889'
- .submit
	- This is a [Java Properties file](https://docs.oracle.com/javase/7/docs/api/java/util/Properties.html#load(java.io.Reader))  detailing the following information:
		- courseName
			- The name of the course, e.g. CMSC132
		- semester
			- The semester code (YYYYMM) e.g. 202301
		- projectNumber
			- The name of the project. e.g. 'Project 1'
		- courseKey
			- The key used to specifically identify the course
			- Also a 64-bit sequence of hexadecimal values like .submitUser's oneTimePassword.
			- e.g. '2c72f8b8605d4889'
		- authentication.type
			- The type of authentication used to submit.
			- This is often 'ldap'. 
            	- In any other case, the user will have to go to an endpoint and log in through web SSO, then copy an username-OTP pair.
            	- This endpoint is in the form of: 
                	- baseURL + /view/submitStatus.jsp?courseKey= + courseKey + &projectNumber= + projectNumber
		- baseURL
			- The base URL that designates a resource (typically on submit.umd.edu:443), usually ending in the string version of the semester
			- e.g. https://submit.cs.umd.edu:443/spring2023
			- This URL will be used to obtain the .submitUser data, either through ldap or manual authentication.
		- submitURL
			- This URL is used to submit the file to the server. More on this further down.







org.apache.commons.fileupload.FileUploadBase$InvalidContentTypeException: the request doesn't contain a multipart/form-data or multipart/mixed stream, content type header is null


- From what I can tell, the projects (repos? would be CVS) are stored in a database 
- (maybe with an association btwn PK,courseKey, projectNumber, and CVS repo name/location.), 
- with an autoincrement primary key (per semester) 
	- deduced from the endpoint https://submit.cs.umd.edu/spring2023/data/GetDotSubmitUserFile?projectPK=21
	- taking projectPK to mean project primary key, obviously.

