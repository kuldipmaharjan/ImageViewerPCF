import {IInputs} from "../../generated/ManifestTypes"

export const getFileContent = (download: boolean, pcfContext: ComponentFramework.Context<IInputs>): Promise<string> => {
    return new Promise((resolve, reject) => {
        //@ts-expect-error necessary
        const recordId = pcfContext.page.entityId;
        //@ts-expect-error necessary
        const crmUrl = pcfContext.page.getClientUrl();
        const url = `${crmUrl}/api/data/v9.2/accounts(${recordId})/kmah_fileexplorersource`;

        const req = new XMLHttpRequest();
        req.open("GET", url);
        req.setRequestHeader("Content-Type", "application/octet-stream");
        req.setRequestHeader("Content-Range", "0-4095/8192");
        req.setRequestHeader("Accept-Encoding", "gzip, deflate");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200 || this.status === 204) {
                    if (download) {
                        console.log("Downloading");
                        const base64ToString = Buffer.from(JSON.parse(req.responseText).value, "base64").toString();
                        resolve(base64ToString);
                    } else {
                        console.log("download " + download);
                        resolve(req.responseText);
                    }
                } else {
                    reject("Request failed with status: " + this.status);
                }
            }
        };
        req.send();
    });
};



/**
 * Patch the record containing the file field with the file to push
 * @param recordId record to be patched
 * @param fileName name of the file which is pushed
 * @param dataFile content of the file in base64
 */

export const patchFileContent = (data: string, pcfContext: ComponentFramework.Context<IInputs>): Promise<string> => {
    return new Promise((resolve, reject) => {
        //@ts-expect-error necessary
        const recordId = pcfContext.page.entityId;
        //@ts-expect-error necessary
        const crmUrl = pcfContext.page.getClientUrl();
        const url = `${crmUrl}/api/data/v9.2/contacts(${recordId})/kmah_fileexplorersource`;

        const req = new XMLHttpRequest()
        req.open("PATCH", url)
        req.setRequestHeader("x-ms-file-name", "filedata")
        req.setRequestHeader("Content-Type", "application/octet-stream")
        req.setRequestHeader("Content-Range", "0-4095/8192")
        req.setRequestHeader("Accept-Encoding", "gzip, deflate")
        req.setRequestHeader("OData-MaxVersion", "4.0")
        req.setRequestHeader("OData-Version", "4.0")
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200 || this.status === 204) {
                    console.log("File Upload Done.")
                    resolve("File Upload Done.")
                } else {
                    const error = JSON.parse(this.response).error
                    console.log("Error : " + error.message)
                    reject("Error : " + error.message)
                }
            }
        };
        req.send(JSON.stringify(data));
    });
};
