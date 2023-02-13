import * as fs from "fs";
import JSZip from "jszip";
import * as path from "path";

/**
 * Converts the file content of a Java properties file to a Map
 *
 * @export
 * @param {string} fileContent - The file content of a Java properties file
 * @returns {Map<string, string>} A map of the properties file's key-value pairs
 */
export function javaPropertiesToMap(fileContent: string): Map<string, string> {
  let propertiesMap: Map<string, string> = new Map<string, string>();
  const regex = /(.*)=(.*)/gm;
  let m;
  while ((m = regex.exec(fileContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    // The result can be accessed through the `m`-variable.
    propertiesMap.set(m[1], m[2]);
  }

  return propertiesMap;
}

/**
 * Archives a folder into a zip file
 *
 * @export
 * @async
 * @param {string} folderPath - The path to the folder to be archived
 * @returns {Promise<Buffer>} A buffer containing the zip file
 */
export async function archiveFolder(folderPath: string): Promise<Buffer> {
  const zip = new JSZip();

  async function addFile(filePath: string, zip: JSZip) {
    const stat = fs.statSync(filePath);
    const base = path.basename(filePath);

    if (base.startsWith(".") || base.endsWith(".class")) {
      return;
    }

    if (stat.isFile()) {
      const data = fs.readFileSync(filePath);
      zip.file(base, data);
    } else if (stat.isDirectory()) {
      const subFiles = fs.readdirSync(filePath);
      for (const subFile of subFiles) {
        await addFile(path.join(filePath, subFile), zip);
      }
    }
  }

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    await addFile(path.join(folderPath, file), zip);
  }

  const zipData = await zip.generateAsync({ type: "nodebuffer" });
  return zipData;
}
