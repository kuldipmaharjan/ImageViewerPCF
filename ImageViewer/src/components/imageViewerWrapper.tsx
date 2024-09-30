import * as React from 'react'
import { IInputs } from "../../generated/ManifestTypes"
import { useState, useEffect, useCallback, useRef, Fragment, useMemo, DragEvent as ReactDragEvent } from 'react'
import ImageGallery from 'react-image-gallery'
import { IconButton, MessageBar, MessageBarType, } from '@fluentui/react'
import { Dialog, DialogType, DialogFooter } from '@fluentui/react/lib/Dialog';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { imageViewerData, imageRawData } from '../types/imageViewer'
import ScaleLoader from "react-spinners/ScaleLoader";
import { getFileContent, patchFileContent } from '../helpers/dynamicsData'
import { testImages } from '../test/imgData'

export type ImageViewerWrapperProps = {
    pcfContext: ComponentFramework.Context<IInputs>
}

export const ImageViewerWrapper: React.FC<ImageViewerWrapperProps> = ({ pcfContext }) => {
    console.log(pcfContext)
    const igProps = pcfContext.parameters.imageViewerProps.raw || ""

    // @ts-expect-error necessity
    const recordId = pcfContext.page.entityId
    //const crmUrl = pcfContext.page.getClientUrl()

    const [imageViewerList, setImageViewerList] = useState([] as Array<imageViewerData>)
    const [imageRawData, setImageRawData] = useState([] as Array<imageRawData>)
    const [currentUIState, setCurrentUIState] = useState("loader")
    
    const hasPageBeenRendered = useRef({ imageRawData: false, imageViewerList: false })
    
    const tempImageRawData = useRef([] as Array<imageRawData>)
    const newTempImageRawDataCount = useRef(0)
    const currentIndex = useRef(0)
    const hiddenFileInput = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getFileContent(recordId, setCurrentUIState, setImageRawData);
        //setImageViewerList([...testImages] as imageViewerData[])  //comment actual data source and uncomment this line to use test data
    }, []);

    useEffect(() => {
        if (!hasPageBeenRendered.current.imageRawData) {
            hasPageBeenRendered.current.imageRawData = true
            return
        }

        console.log("imageRawData updated")
        console.log(imageRawData)

        const tempList = [] as Array<imageViewerData>
        Array.from(imageRawData).forEach((element: imageRawData) => {
            console.log(element)
            tempList.push({ original: element.content, thumbnail: element.content, name: "" })
        })

        setImageViewerList([...tempList])
        setCurrentUIState("viewer")
    }, [imageRawData])

    useEffect(() => {
        if (!hasPageBeenRendered.current.imageViewerList) {
            hasPageBeenRendered.current.imageViewerList = true
            return
        }

        console.log("imageViewerList updated")
        console.log(imageViewerList)

    }, [imageViewerList])

    
    const appendImage = (latestImageDataArray: imageRawData[]) => {
        setCurrentUIState("loader")
        console.log(`[ImageViewerPCF] Append Image with data ${latestImageDataArray}`)
        patchFileContent(recordId, latestImageDataArray, setCurrentUIState)
        tempImageRawData.current = []
        setImageRawData(latestImageDataArray)
        setCurrentUIState("viewer")
    }

    const deleteImage = (index: number) => {
        setCurrentUIState("loader")
        console.log(`[ImageViewerPCF] Delete Image at index ${index}`)
        const updatedRawData = [...imageRawData]
        updatedRawData.splice(index, 1)
        console.log(updatedRawData)
        
        patchFileContent(recordId, updatedRawData, setCurrentUIState)
        setImageRawData(updatedRawData)
        currentIndex.current = 0
        //setCurrentUIState("viewer")
    }

    const readFile = async (file: File) => {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result )
            };
            fr.onerror = reject;
            fr.readAsDataURL(file)
        })
    }

     const fileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        console.log("Filedrop")
        e.preventDefault()
        tempImageRawData.current = [...imageRawData]
        handleFile(e.dataTransfer.files as FileList)
    }

    const handleFile = (fileList: FileList) => {
        console.log(fileList)
        setCurrentUIState("loader")
        newTempImageRawDataCount.current = fileList.length + tempImageRawData.current.length

        Array.from(fileList).forEach(async (file: File) => {
            // Do something with the files

            const a = await readFile(file)
            tempImageRawData.current.push({ name: file.name, type: file.type, size: file.size, content: a as string })  
             
            console.log(`tempImageRawData.current ${tempImageRawData.current as imageRawData[]}`)
            const totalSize = tempImageRawData.current.map((item) => item.size).reduce((accumulator, currentVal) => {return accumulator + currentVal;},0)
            console.log(`Total Size: ${totalSize}`)
            if (totalSize * 4 / 3 > 16000000) { // converting binary to base64 increases the size by 4/3
                setCurrentUIState("messageBar")
                return
            }

            if (newTempImageRawDataCount.current == tempImageRawData.current.length) {
                appendImage(tempImageRawData.current)
            }
        });

    }

    const handleUploadClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        tempImageRawData.current = [...imageRawData]
        handleFile(event.target.files as FileList);
    }

    const fileDownload = (index: number) => {
        console.log(`[ImageViewerPCF] Download Image ${imageRawData[index].name}`)
        //const updatedRawData = [...imageRawData]
        const downloadLink = document.createElement("a")
        downloadLink.href = imageRawData[index].content
        downloadLink.download = imageRawData[index].name
        downloadLink.click()
    }

    const dragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }
    
    const dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }
    
    const dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }


    const modalPropsStyles = { main: { maxWidth: 450 } };
    const dialogContentProps = {
        type: DialogType.normal,
        title: 'Confirm Delete',
        subText: 'Do you want to delete the current image?'
    };


    return (
        <div 
        onDragOver={dragOver}
        onDragEnter={dragEnter} 
        onDragLeave={dragLeave} 
        onDrop={fileDrop}
        >
            {
                currentUIState == "messageBar"?
                <MessageBar
                    messageBarType={MessageBarType.blocked}
                    isMultiline={false}
                    onDismiss={() => setCurrentUIState("viewer")}
                    dismissButtonAriaLabel="Close"
                    truncated={true}
                >
                <b>The file size is too big.</b> The maximum file size is 16MB. Please try again with a smaller file.
                </MessageBar>
                : null
            }
            {
                currentUIState == "viewer"?
                    <div style={{float: 'right'}}>
                        <IconButton iconProps={{ iconName: 'Download', styles: { root: { color: 'black', zIndex: 1000 } } }} 
                            onClick={() => { console.log("Download Clicked"); fileDownload(currentIndex.current);}} />
                        <input
                                type="file"
                                onChange={handleChange}
                                ref={hiddenFileInput}
                                style={{display: 'none'}}
                            />

                        <IconButton iconProps={{ iconName: 'Upload', styles: { root: { color: 'black', zIndex: 1000 } } }} 
                            onClick={() => { console.log(`Upload on....`); handleUploadClick(); }} />
                        <IconButton iconProps={{ iconName: 'Delete', styles: { root: { color: 'black', zIndex: 1000 } } }} 
                            onClick={() => { console.log(`Delete Clicked for ${currentIndex.current}`); setCurrentUIState("deleteDialog");}} />
                    </div>
                    : null
            }
            <section style={{ margin: "0 auto", width: "100%", height: "100%", display: 'inline-block' }}>
                {
                    currentUIState == "loader"?
                        <ScaleLoader
                            style={{ marginTop: "25vh", display: "block" }}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                        : null
                }
                {
                    currentUIState == "viewer" || currentUIState == "deleteDialog" || currentUIState == "messageBar" ?
                        <ImageGallery
                            items={imageViewerList}
                            lazyLoad={false}
                            showThumbnails={true}
                            showFullscreenButton={false}
                            showPlayButton={false}
                            showBullets={true}
                            showIndex={true}
                            infinite={true}
                            slideDuration={200}
                            slideInterval={500}
                            onSlide={(index: number) => currentIndex.current = index}
                        />
                        : null
                }
            </section>

            <Dialog
                hidden={currentUIState != "deleteDialog"}
                onDismiss={() => setCurrentUIState("viewer")}
                dialogContentProps={dialogContentProps}
                modalProps={{isBlocking: true, styles: modalPropsStyles}}
            >
                <DialogFooter>
                    <PrimaryButton onClick={() => {deleteImage(currentIndex.current)}} text="Delete" />
                    <DefaultButton onClick={() => setCurrentUIState("viewer")} text="Cancel" />
                </DialogFooter>
            </Dialog>
        </div>
    );
}