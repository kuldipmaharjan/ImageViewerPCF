
import { imageViewerData, imageRawData } from '../types/imageViewer'

export const getFileContent = (recordId: string, 
    setCurrentUIState: React.Dispatch<React.SetStateAction<string>>, 
    setImageRawData: React.Dispatch<React.SetStateAction<imageRawData[]>>
    ) => {
        
        console.log("Get raw file from CRM field");

        //const url = `${crmUrl}/api/data/v9.2/accounts(${recordId})/km_rawdata`
        const url = "https://org90d2222c.crm.dynamics.com/api/data/v9.2/leads(" + recordId + ")/new_imgviewerfile";

        const req = new XMLHttpRequest();
        req.open("GET", url);
        //req.setRequestHeader("x-ms-file-name", "test.txt");
        req.setRequestHeader("Content-Type", "application/octet-stream")
        req.setRequestHeader("Content-Range", "0-4095/8192")
        req.setRequestHeader("Accept-Encoding", "gzip, deflate")
        req.setRequestHeader("OData-MaxVersion", "4.0")
        req.setRequestHeader("OData-Version", "4.0")
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200 || this.status === 204) {
                    /*
                    if (download) {
                        console.log("Downloading")
                        const base64ToString = atob(JSON.parse(req.responseText).value).toString()
                        console.log(JSON.parse(base64ToString))

                        const dataList = JSON.parse(base64ToString)
                        dataList.forEach((element: { content: string; }) => {
                            const downloadLink = document.createElement("a");
                            downloadLink.href = element?.content.toString();
                            downloadLink.download = "test.jpg";
                            downloadLink.click();
                        });
                    }
                        */
                    console.log("status: " + this.status)
                    //const base64ToString = Buffer.from(JSON.parse(req.responseText).value, "base64").toString()
                    const base64ToString = atob(JSON.parse(req.responseText).value).toString()
                    console.log(base64ToString)
                    const imgDataList = JSON.parse(base64ToString)
                    setImageRawData(imgDataList)
                    if (imgDataList.length == 0) {
                        //setCurrentUIState("uploader")
                    }
                    else {
                        //setCurrentUIState("viewer")
                    }
                } else {
                    const error = JSON.parse(this.response).error
                    console.log("Error : " + error.message)
                }
            }
        };
        req.send()
}


/**
 * Patch the record containing the file field with the file to push
 * @param recordId record to be patched
 * @param fileName name of the file which is pushed
 * @param dataFile content of the file in base64
 */

export const patchFileContent = (recordId: string, imageRawData: imageRawData[]) => {
    console.log("patchFileContent");
    console.log(imageRawData);
    /*
    //let base64ToString = Buffer.from(imageRawData, "base64").toString();
    let currentData = [...imageRawData]
    if (data != "" && action === "add") {
        console.log(currentData)
        currentData.push({ name: "", type: "", content: data })
        console.log(currentData)
    }
    else if (action === "delete") {
        currentData.splice(currentIndex, 1)
        console.log(currentData)
    }
    else {
        currentData = []
    }
    */


    //const url = `${crmUrl}/api/data/v9.2/accounts(${recordId})/km_rawdata`
    const url = "https://org90d2222c.crm.dynamics.com/api/data/v9.2/leads(" + recordId + ")/new_imgviewerfile";

    const req = new XMLHttpRequest()
    req.open("PATCH", url)
    req.setRequestHeader("x-ms-file-name", "rawIMG.txt")
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
                //getFileContent(false)
            } else {
                const error = JSON.parse(this.response).error
                console.log("Error : " + error.message)
            }
        }
    };

    //req.send(JSON.stringify([{name: "", type: "", content: ""}]));
    req.send(JSON.stringify(imageRawData));
}

