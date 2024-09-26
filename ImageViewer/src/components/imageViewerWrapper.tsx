import * as React from 'react'
import { useState, useEffect, useCallback, useRef, Fragment, useMemo, DragEvent as ReactDragEvent } from 'react'
import { IInputs } from "../../generated/ManifestTypes"
import ImageGallery from 'react-image-gallery'
//import { patchFileContent } from '../helpers/dynamicsData'
import { IconButton } from '@fluentui/react'
import { imageViewerData, imageRawData } from '../types/imageViewer'
//import { DropArgument } from 'net'
import { testImages } from '../test/imgData'

export type ImageViewerWrapperProps = {
    pcfContext: ComponentFramework.Context<IInputs>
}

export const ImageViewerWrapper: React.FC<ImageViewerWrapperProps> = ({ pcfContext }) => {
    console.log(pcfContext)
    const igProps = pcfContext.parameters.imageViewerProps.raw || ""

    // @ts-expect-error test
    const recordId = pcfContext.page.entityId
    //const crmUrl = pcfContext.page.getClientUrl()

    //const [currentImage, setCurrentImage] = useState(0);
    //const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [imageList, setImageList] = useState([] as Array<imageViewerData>)
    const [imageRawData, setImageRawData] = useState([] as Array<imageRawData>)
    const currentIndex = useRef(0)

    useEffect(() => {
        console.log("Get raw file from CRM field");
        getFileContent(false);  //comment for local test

        //setImageList([...testImages])  //for local test
    }, []);

    useEffect(() => {
        console.log("imageRawData updated")
        console.log(imageRawData)

        const tempList = [] as Array<imageViewerData>
        Array.from(imageRawData).forEach((element: imageRawData) => {
            console.log(element)
            tempList.push({ original: element.content, thumbnail: element.content })
        })

        setImageList([...tempList])
        imageList.forEach((element: imageViewerData) => {
            console.log(element)
        })

    }, [imageRawData])

    useEffect(() => {
        console.log("imageList updated")
        console.log(imageList)
    }, [imageList])

    const getFileContent = (download: boolean) => {
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
                    if (download) {
                        console.log("Downloading")
                        const base64ToString = Buffer.from(JSON.parse(req.responseText).value, "base64").toString()
                        console.log(JSON.parse(base64ToString))

                        const dataList = JSON.parse(base64ToString)
                        dataList.forEach((element: { content: string; }) => {
                            const downloadLink = document.createElement("a");
                            downloadLink.href = element?.content.toString();
                            downloadLink.download = "test.jpg";
                            downloadLink.click();
                        });
                        //const linkSource = `data:image;base64,${base64Data}`;

                        /*
                            // Parameters:
                            // contentType: The content type of your file. 
                            //              its like application/pdf or application/msword or image/jpeg or
                            //              image/png and so on
                            // base64Data: Its your actual base64 data
                            // fileName: Its the file name of the file which will be downloaded. 

                            function downloadBase64File(contentType, base64Data, fileName) {
                                const linkSource = `data:${contentType};base64,${base64Data}`;
                                const downloadLink = document.createElement("a");
                                downloadLink.href = linkSource;
                                downloadLink.download = fileName;
                                downloadLink.click();
                            }
                        */
                    }
                    else {
                        console.log("download " + download)
                        console.log("status: " + this.status)
                        //const base64ToString = Buffer.from(JSON.parse(req.responseText).value, "base64").toString()
                        const base64ToString = atob(JSON.parse(req.responseText).value).toString()
                        console.log(base64ToString)
                        setImageRawData(JSON.parse(base64ToString))
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

    const patchFileContent = (data: string, action: string) => {
        console.log("patchFileContent");
        //append dropped file 

        //let base64ToString = Buffer.from(imageRawData, "base64").toString();
        let currentData = [...imageRawData]
        if (data != "" && action === "add") {
            console.log(currentData)
            currentData.push({ name: "", type: "", content: data })
            console.log(currentData)
        }
        else if (action === "delete") {
            currentData.splice(currentIndex.current, 1)
            console.log(currentData)
        }
        else {
            currentData = []
        }


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
                    getFileContent(false)
                } else {
                    const error = JSON.parse(this.response).error
                    console.log("Error : " + error.message)
                }
            }
        };

        //req.send(JSON.stringify([{name: "", type: "", content: ""}]));
        req.send(JSON.stringify(currentData));
    }

    const deleteImage = (index: number) => {
        console.log("Delete Image")
        console.log(index)
        const currentData = [...imageRawData]
        currentData.splice(index, 1)
        console.log(currentData)
        patchFileContent(JSON.stringify(currentData), "delete")
    }


    const dragOver = (e: ReactDragEvent<HTMLElement>) => {
        e.preventDefault();
    }

    const dragEnter = (e: ReactDragEvent<HTMLElement>) => {
        e.preventDefault();
    }

    const dragLeave = (e: ReactDragEvent<HTMLElement>) => {
        e.preventDefault();
    }

    const fileDrop = (e: ReactDragEvent<HTMLElement>) => {
        console.log("Filedrop")
        e.preventDefault()
        const files = e.dataTransfer?.files
        if (!files) {
            console.error("No files were dropped.");
            return;
        }
        console.log(files)

        const reader = new FileReader();
        reader.addEventListener('load', (event: ProgressEvent<FileReader>) => {
            console.log("completed reading file")
            if (event.target) {
                console.log(event.target.result);
                patchFileContent(event.target.result as string, "add");
            } else {
                console.error("FileReader event target is null.");
            }
        });
        reader.readAsDataURL(files[0])
    }

    return (
        <section style={{ margin: "0 auto", width: "100%", height: "800px", display: 'inline-block' }}
            onDragOver={dragOver}
            onDragEnter={dragEnter}
            onDragLeave={dragLeave}
            onDrop={fileDrop}>

            <ImageGallery
                items={imageList}
                lazyLoad={false}
                showThumbnails={true}
                showFullscreenButton={true}
                showPlayButton={false}
                showBullets={true}
                showIndex={true}
                infinite={true}
                slideDuration={500}
                slideInterval={500}
                onSlide={(index: number) => currentIndex.current = index}
            />
            <IconButton iconProps={{ iconName: 'Download', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log("Download Clicked"); getFileContent(true); }} />
            <IconButton iconProps={{ iconName: 'Delete', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log(`Delete Clicked for ${currentIndex.current}`); patchFileContent("", "delete") }} />
                
            <IconButton iconProps={{ iconName: 'Delete', styles: { root: { color: 'red', zIndex: 1000 } } }} onClick={() => { console.log(`Delete All`); patchFileContent("", "delete"); }} />
        </section>
    );
}