import * as React from 'react'
import { IInputs } from "../../generated/ManifestTypes"
import { useState, useEffect, useRef, DragEvent as ReactDragEvent } from 'react'
import ImageGallery from 'react-image-gallery'
import ScaleLoader from "react-spinners/ScaleLoader";
import { IconButton, MessageBar, MessageBarType, } from '@fluentui/react'
import { Dialog, DialogType, DialogFooter } from '@fluentui/react/lib/Dialog';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { imageViewerData, imageRawData } from '../types/imageViewer'
import { getFileContent, patchFileContent } from '../helpers/dynamicsData'
import { genPluralName } from '../helpers/common'
import { testImages } from '../test/imgData'

export type ImageViewerWrapperProps = {
    pcfContext: ComponentFramework.Context<IInputs>
}

export const ImageViewerWrapper: React.FC<ImageViewerWrapperProps> = ({ pcfContext }) => {
    const dynamicProps = pcfContext.parameters.imageViewerProps.raw || ""   // for future use
    const fileFieldName = pcfContext.parameters.fileFieldName.raw || ""

    // @ts-expect-error necessity
    const recordId = pcfContext.page.entityId
    // @ts-expect-error necessity
    const entityName = genPluralName(pcfContext.page.entityTypeName)
    // @ts-expect-error necessity
    const webApiURL = `${pcfContext.page.getClientUrl() as string}/api/data/v9.2/${entityName}(${recordId})/${fileFieldName}`

    const [imageViewerList, setImageViewerList] = useState([] as Array<imageViewerData>)
    const [imageRawData, setImageRawData] = useState([] as Array<imageRawData>)
    const [currentUIState, setCurrentUIState] = useState("loader")

    const tempImageRawData = useRef([] as Array<imageRawData>)  // for tracking the new images to be uploaded without updating the state
    const newTempImageRawDataCount = useRef(0)                  // for tracking the number/size of new images to be uploaded
    const currentIndex = useRef(0)                              // for tracking the current image index
    const messageBarText = useRef("")                           // for handling the text displayed on the message bar
    const hiddenFileInput = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getFileContent(webApiURL, setCurrentUIState, setImageRawData);
        //setImageViewerList([...testImages] as imageViewerData[])  //comment actual data source and uncomment this line to use test data
    }, []);

    useEffect(() => {
        const tempList = [] as Array<imageViewerData>
        Array.from(imageRawData).forEach((element: imageRawData) => {
            tempList.push({ original: element.content, thumbnail: element.content, name: "" })
        })

        setImageViewerList([...tempList])
    }, [imageRawData])

    const appendImage = (latestImageDataArray: imageRawData[]) => {
        console.log(`[ImageViewerPCF] Append Image with data ${latestImageDataArray}`)
        setCurrentUIState("loader")
        patchFileContent(webApiURL, latestImageDataArray, setCurrentUIState)
        tempImageRawData.current = []
        setImageRawData(latestImageDataArray)
    }

    const deleteImage = (index: number) => {
        console.log(`[ImageViewerPCF] Delete Image at index ${index}`)
        setCurrentUIState("loader")
        const updatedRawData = [...imageRawData]
        updatedRawData.splice(index, 1)

        patchFileContent(webApiURL, updatedRawData, setCurrentUIState)
        setImageRawData(updatedRawData)
        currentIndex.current = 0
    }

    const readFile = async (file: File) => {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => {
                resolve(fr.result)
            };
            fr.onerror = reject;
            fr.readAsDataURL(file)
        })
    }

    const fileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        tempImageRawData.current = [...imageRawData]
        handleFile(e.dataTransfer.files as FileList)
    }

    const handleFile = (fileList: FileList) => {
        setCurrentUIState("loader")
        newTempImageRawDataCount.current = fileList.length + tempImageRawData.current.length

        Array.from(fileList).forEach(async (file: File) => {
            const data = await readFile(file)

            if (!['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'].includes(file.type)) {
                messageBarText.current = "Invalid file type. Please upload an image file. Supported formats are JPEG, PNG, GIF, BMP and WebP."
                setCurrentUIState("messageBar")
                return
            }

            tempImageRawData.current.push({ name: file.name, type: file.type, size: file.size, content: data as string })

            const totalSize = tempImageRawData.current.map((item) => item.size).reduce((accumulator, currentVal) => { return accumulator + currentVal; }, 0)
            console.log(`[ImageViewerPCF] Total Size: ${totalSize}`)
            if (totalSize * 4 / 3 > 16000000) { // converting binary to base64 increases the size by 4/3
                messageBarText.current = "Storage limit reached. The maximum total size is 12MB. Please try again with a smaller file."
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
            style={{ display: 'block', alignItems: 'center', justifyContent: 'center' }}
        >
            {
                currentUIState == "messageBar" ?
                    <MessageBar
                        messageBarType={MessageBarType.blocked}
                        isMultiline={false}
                        onDismiss={() => setCurrentUIState("viewer")}
                        dismissButtonAriaLabel="Close"
                        truncated={true}
                    >
                        {messageBarText.current}
                    </MessageBar>
                    : null
            }
            {
                ['viewer', 'dropImage'].includes(currentUIState) ?
                    <div>
                        {
                            currentUIState != "dropImage" && currentUIState == "viewer" ?
                                <IconButton
                                    iconProps={{ iconName: 'Download', styles: { root: { color: 'black', zIndex: 1000 } } }}
                                    onClick={() => { fileDownload(currentIndex.current); }}
                                    title='Download'
                                    ariaLabel='Download'
                                />
                                : null
                        }

                        <input
                            type="file"
                            onChange={handleChange}
                            ref={hiddenFileInput}
                            style={{ display: 'none' }}
                            multiple
                        />

                        <IconButton
                            iconProps={{ iconName: 'Upload', styles: { root: { color: 'black', zIndex: 1000 } } }}
                            onClick={() => { handleUploadClick(); }}
                            title='Upload'
                            ariaLabel='Upload'
                        />

                        {
                            currentUIState != "dropImage" && currentUIState == "viewer" ?
                                <IconButton
                                    iconProps={{ iconName: 'Delete', styles: { root: { color: 'black', zIndex: 1000 } } }}
                                    onClick={() => { setCurrentUIState("deleteDialog"); }}
                                    title='Delete'
                                    ariaLabel='Delete'
                                />
                                : null
                        }
                    </div>
                    : null
            }
            <div style={{ width: "100%", height: "100%", display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
                {
                    currentUIState == "loader" ?
                        <ScaleLoader
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                        : null
                }
                {
                    ['viewer', 'deleteDialog', 'messageBar'].includes(currentUIState) ?
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
                {
                    currentUIState == "dropImage" ?
                        <div className="drop-zone">
                            <div className="drop-placeholder">
                                DROP IMAGE HERE
                            </div>
                        </div>
                        : null
                }
            </div>

            <Dialog
                hidden={currentUIState != "deleteDialog"}
                onDismiss={() => setCurrentUIState("viewer")}
                dialogContentProps={dialogContentProps}
                modalProps={{ isBlocking: true, styles: modalPropsStyles }}
            >
                <DialogFooter>
                    <PrimaryButton onClick={() => { deleteImage(currentIndex.current) }} text="Delete" />
                    <DefaultButton onClick={() => setCurrentUIState("viewer")} text="Cancel" />
                </DialogFooter>
            </Dialog>
        </div>
    );
}