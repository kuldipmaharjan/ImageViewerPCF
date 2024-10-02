
import { imageViewerData, imageRawData } from '../types/imageViewer'

export const getFileContent = (webApiURL: string,
    setCurrentUIState: React.Dispatch<React.SetStateAction<string>>,
    setImageRawData: React.Dispatch<React.SetStateAction<imageRawData[]>>
) => {
    console.log(`[ImageViewerPCF] Get raw file data from CRM field`);
    const req = new XMLHttpRequest();
    req.open("GET", webApiURL);
    req.setRequestHeader("Content-Type", "application/octet-stream")
    req.setRequestHeader("Content-Range", "0-4095/8192")
    req.setRequestHeader("Accept-Encoding", "gzip, deflate")
    req.setRequestHeader("OData-MaxVersion", "4.0")
    req.setRequestHeader("OData-Version", "4.0")
    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            req.onreadystatechange = null;
            if (this.status === 200 || this.status === 204) {
                console.log("status: " + this.status)
                const base64ToString = atob(JSON.parse(req.responseText).value).toString()
                console.log(base64ToString)
                const imgDataList = JSON.parse(base64ToString)
                setImageRawData(imgDataList)
                
                if (imgDataList.length == 0) {
                    setCurrentUIState("dropImage")
                }
                else {
                    setCurrentUIState("viewer")
                }
            } else {
                const error = JSON.parse(this.response).error
                console.log("Error : " + error.message)

                setCurrentUIState("viewer")
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

export const patchFileContent = (
    webApiURL: string,
    imageRawData: imageRawData[],
    setCurrentUIState: React.Dispatch<React.SetStateAction<string>>
) => {

    console.log(`[ImageViewerPCF] Updating file data to CRM field`);

    const req = new XMLHttpRequest()
    req.open("PATCH", webApiURL)
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
                setCurrentUIState("viewer")
            } else {
                const error = JSON.parse(this.response).error
                console.log(`[ImageViewerPCF] Error on patchFileContent : ${error.message}`)
                setCurrentUIState("viewer")
            }
        }
    };

    req.send(JSON.stringify(imageRawData));
}

