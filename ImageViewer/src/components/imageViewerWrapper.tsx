import * as React from 'react'
import { IInputs } from "../../generated/ManifestTypes"
import { useState, useEffect, useCallback, useRef, Fragment, useMemo, DragEvent as ReactDragEvent } from 'react'
import ImageGallery from 'react-image-gallery'
import { IconButton } from '@fluentui/react'
import { imageViewerData, imageRawData } from '../types/imageViewer'
import ScaleLoader from "react-spinners/ScaleLoader";
import { useDropzone } from 'react-dropzone'
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
    const [currentUIState, setCurrentUIState] = useState("viewer");
    
    const hasPageBeenRendered = useRef({ imageRawData: false, imageViewerList: false })
    const currentIndex = useRef(0)

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

    
    const appendImage = (imagedata: string) => {
        //setCurrentUIState("loader")
        console.log(`[ImageViewerPCF] Append Image with data ${imagedata}`)
        
        const updatedRawData = [...imageRawData]
        updatedRawData.push({ name: "", type: "", content: imagedata })
        console.log(updatedRawData)
        patchFileContent(recordId, updatedRawData)
        setImageRawData(updatedRawData)
    }

    const deleteImage = (index: number) => {
        setCurrentUIState("loader")
        console.log(`[ImageViewerPCF] Delete Image at index ${index}`)
        const updatedRawData = [...imageRawData]
        updatedRawData.splice(index, 1)
        console.log(updatedRawData)
        
        patchFileContent(recordId, updatedRawData)
        setImageRawData(updatedRawData)
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log(acceptedFiles);

        acceptedFiles.forEach(file => {
            // Do something with the files
            const reader = new FileReader();
            reader.addEventListener('load', (event: ProgressEvent<FileReader>) => {
                event.preventDefault();
                console.log("completed reading file")
                if (event.target) {
                    console.log(event.target.result);
                    appendImage(event.target.result as string)
                    //patchFileContent(event.target.result as string, "add");
                } else {
                    console.error("FileReader event target is null.");
                }
            });
            reader.readAsDataURL(file)
            //reader.fileName = files[0].name
        });

    }, [])

    const dragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }
    
    const dragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }
    
    const dragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    }

    const { getRootProps, getInputProps, open } = useDropzone({
        // Disable click and keydown behavior
        noClick: true,
        noKeyboard: true,
        onDrop
    });

    return (
        <div  {...getRootProps({ className: 'dropzone' })} 
        onDragOver={dragOver}
        onDragEnter={dragEnter} 
        onDragLeave={dragLeave} 
        //onDrop={dragLeave}
        >
            {
                currentUIState == "viewer"?
                    <div style={{float: 'right'}}>
                        <IconButton iconProps={{ iconName: 'Download', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log("Download Clicked"); /*getFileContent(true);*/ }} />
                        <input {...getInputProps()} />
                        <IconButton iconProps={{ iconName: 'Upload', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log(`Upload on....`); open; }} />
                        <IconButton iconProps={{ iconName: 'Delete', styles: { root: { color: 'black', zIndex: 1000 } } }} onClick={() => { console.log(`Delete Clicked for ${currentIndex.current}`); deleteImage(currentIndex.current) }} />
                    </div>
                    : null
            }
            <section style={{ margin: "0 auto", width: "100%", height: "100%", display: 'inline-block' }}>
                {
                    currentUIState == "uploader" ?
                        <div {...getRootProps({ className: 'dropzone' })}>
                            <input {...getInputProps()} />
                            <p>Drag 'n' drop some files here</p>
                            <button type="button" onClick={open}>
                                Open File Dialog
                            </button>
                        </div>

                        : null
                }

                {
                    currentUIState == "loader" ?
                        <ScaleLoader
                            style={{ marginTop: "25vh", display: "block" }}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                        : null
                }

                {
                    currentUIState == "viewer"?
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
        </div>
        
    );
}