import * as React from 'react'
import { useState, useEffect, useCallback, useRef, Fragment, useMemo, DragEvent as ReactDragEvent } from 'react'
import { IInputs } from "../../generated/ManifestTypes"
import ImageGallery from 'react-image-gallery'
import { patchFileContent } from '../helpers/dynamicsData'
import { DefaultPalette, IconButton, normalize } from '@fluentui/react'
import { imageViewerData, imageRawData } from '../types/imageViewer'
import { DropArgument } from 'net'

export type ImageViewerWrapperProps = {
    pcfContext: ComponentFramework.Context<IInputs>
}

export const ImageViewerWrapper: React.FC<ImageViewerWrapperProps> = ({ pcfContext }) => {
    console.log(pcfContext)
    const igProps = pcfContext.parameters.imageViewerProps.raw || ""

    // @ts-expect-error test
    const recordId = pcfContext.page.entityId
    // @ts-expect-error test
    const crmUrl = pcfContext.page.getClientUrl()

    //const [currentImage, setCurrentImage] = useState(0);
    //const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [imageList, setImageList] = useState([] as Array<imageViewerData>)
    const [imageRawData, setImageRawData] = useState([] as Array<imageRawData>)

    useEffect(() => {
        console.log("Get raw file from CRM field");
        //getFileContent(false);  //comment for local test

        setImageList([...testImages])  //for local test
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
        const url = `${crmUrl}/api/data/v9.2/accounts(${recordId})/km_rawdata`
        //var url = "https://org3bf05eeb.crm.dynamics.com/api/data/v9.2/accounts("+recordId+")/km_rawdata";

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
                        const base64ToString = Buffer.from(JSON.parse(req.responseText).value, "base64").toString()
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


    const testImages = [
        {
            original: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAtCAYAAAA6GuKaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAUbSURBVGhD7ZhbTFRHHMY/7uFWwyUWBFsW1kqkCViQi6StGgRMxEvB0ggY9aXgi41NKm3sS0H7VFMT29LYBG1tNFT7wjZRIcoLhUCAUgkQusAWA1JA+sA13E7PNz1Lse0uZ3aBlsRfsjmHM/P//h+zc2b+sy6KCtYZrtp1XfHM9FqxLk2vyIu4sLAAi8WCmpoHqK+rh9n8C2ZmZuDp6QmjcQuSU5Kxa9duREREwNXV+XFyyjRDOzs7UfbF52hqatKe2iY+Ph6FRacQHR0NFxcX7ak8Dpuen5/HrVvf4cuyMjGq7u7uSExMREZmJiIjoxAYGIDR0d/R09ONu3fuoKGhAXNzc2L03y4sRE7OEbi5uWlqktC0LGpy5asrV5TUnSniU1x8Vunv79da/x22s581hvHUcQRp0+r8VUwmk/L6a6+Kz/e3b+tOzn7sb42lDvVkkTbd29urZL9x2OHRWvotUYd6ski9ypzHpspKDA4OIi0tDUfz8qTnJfszjvHUoR51ZZAyzSS1tbXw8fHB/qwD8Pb21lrkYBzjqUM96sogZbqrqwuPHvUhJuZlsWw5A+OpQz3qyiBlmpsGMW4xwtfXV9w7CuOpQ6y6epEyrb5E4hrxYoRTmwNhPHWIVVcvuk1zq56dndX+WlmoS3296DbNmsHDw0PcPxl9Iq7OYtWhrkxNIjU9wsLCxXXw8WOnR53x1CFWXb1ImTYao8Qy1dLyE4aGhrSnjsF46lCPujJImTYYIrFjR6JYpurqfhRVniMwjvHUoR51ZZAyzU2BOxkrups3bkDdgrUWORjHeOpQT3aTkjJNklNSkLZ3r9jFLl78RP2af9Na9MH+jBOlgKpDPWlEBSJJT0+P8lZurih68vOOKm1tbctWa2xnP/a3xvX1/aq1yuHwIcBi6cWH586Jr5pfc3p6BvILChAeHv7U8sX1d2BgQEwHk6lSbCQGgwElpaXq8cug9ZLDqePWyMgILl36FA/u39eeAP7+/uoSFiaM07Ba/GNsbExrBXbv2YPTp99BcHCw9kQe6Tm9FA8Pd2x9aaswaoUGeW5sb28X16WGedTaFLrJ6TXeoZGenp5CRUUFrpaXi/Mh4RSJijIiNi4Wvj5/FVMzszNoe/gQHR0dT/U9cPAgjh8/oZ4lA8UzGaRNcw5/fOG8GEmybVsMCo4dQ0JCgt2li6Pb2tqKb76+tnhy5/wvfv8DxMbGyhVgNK2XxsZGJStrv3j7c988oqgbhKKeOrRWfbD/z62ti6tIZka6UlVVJXVW1G2ahpmAiYrPvqcMDw9rLY4xPj6uXDhfumic+nrRZdpisSyuyyUlHymTk5Nai3NMT08rn12+LHSpz/VfD8uuHqowvr1+XdQJcdu3o6jolMNnw7/j5eWFEydPInPfPqF/7Wo5pqamtFbbLGu6ubkZ9+7dRUhICM6ceRdBQUFay8rAAcjLy8fmzS+gpqYG9XV1Wott7Jrmf/2DySR2sUOHDoudbDXgD5PZOdkiT3V19bKjbde02WxGY2ODGAXuZM6eC21B3ZSUnSIP8zGvPeyabmlphvrSISkpSUyP1YT6qampIh/z2sOmae563eZucR8bF+f4L5w6of4r8fHivkPduGjeFjZNj42NQy0dERAQIAqgtSA0NBQbNz4vau2JiQnt6T+xaZpBLHZYjdH4WuDn54cNG54TeR0yra7hammpqJWcp1qd/fnTwWrDPMzHvMxvC6fq6f8Ku6vH/5VnptcG4A8I6ljlXFz/GgAAAABJRU5ErkJggg==",
            thumbnail: 'https://picsum.photos/id/1018/250/150/',
        },
        {
            original: "https://picsum.photos/id/1018/1000/600/",
            thumbnail: "https://picsum.photos/id/1018/250/150/",
        },
        {
            original: "https://picsum.photos/id/1015/1000/600/",
            thumbnail: "https://picsum.photos/id/1015/250/150/",
        },
        {
            original: "https://picsum.photos/id/1019/1000/600/",
            thumbnail: "https://picsum.photos/id/1019/250/150/",
        },
    ];




    /**
     * Patch the record containing the file field with the file to push
     * @param recordId record to be patched
     * @param fileName name of the file which is pushed
     * @param dataFile content of the file in base64
     */

    const patchFileContent = (data: string) => {
        console.log("patchFileContent");
        //append dropped file 

        //let base64ToString = Buffer.from(imageRawData, "base64").toString();
        let currentData = [...imageRawData]
        if (data != "") {
            console.log(currentData)
            currentData.push({ name: "", type: "", content: data })
            console.log(currentData)
        }
        else {
            currentData = []
        }


        const url = `${crmUrl}/api/data/v9.2/accounts(${recordId})/km_rawdata`
        //var url = "https://org3bf05eeb.crm.dynamics.com/api/data/v9.2/accounts("+recordId+")/km_rawdata";

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
                patchFileContent(event.target.result as string);
            } else {
                console.error("FileReader event target is null.");
            }
        });
        reader.readAsDataURL(files[0])
    }

    return (
        <section style={{ margin: "0 auto", width: "500px", height: "800px" }}
            onDragOver={dragOver}
            onDragEnter={dragEnter}
            onDragLeave={dragLeave}
            onDrop={fileDrop}>

            <ImageGallery
                items={imageList}
                lazyLoad={false}
                showThumbnails={true}
                showFullscreenButton={true}
                showPlayButton={true}
                showBullets={true}
                showIndex={true}
                infinite={true}
                slideDuration={500}
                slideInterval={500}
            />
            <IconButton iconProps={{ iconName: 'Download', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log("Download Clicked"); getFileContent(true); }} />
            <IconButton iconProps={{ iconName: 'Delete', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log("Delete Clicked"); patchFileContent(""); }} />
        </section>
    );
}