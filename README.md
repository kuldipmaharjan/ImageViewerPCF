# ImageViewerPCF

## About
Have you ever come across a need to upload and view images within Microsoft Dynamics CRM records and found an elegant solution without having to rely on complexities of sharepoint files or notes attachments or complete inhouse custom solutions? **Neither have I.** 

**ImageViewerPCF** is a custom control that allows for the instant upload of images for any entity records once configured. With the introduction of the File Data Type in Dataverse, the Dynamics platform has expanded the potential solutions that can be achieved. This control relies on the DataType field and enhances the functionality of Dynamics CRM as the OOB version has no multi image viewing capability.

When image files are uploaded via File Explorer or through a drag-and-drop method, the image file binaries are converted into base64 format and then combined into a single base64 blob. This blob is uploaded into the configured file type field using Web API methods (limitations are covered later in this documentation). When viewing the control, it retrieves the file's base64 content, parses it accordingly, and renders the images.


## Features
- Display multiple images on any CRM Records' forms
- Upload image(s) via default file selector dialog or simply drag and drop image or group of images
- Navigate the images using arrow keys from keyboard, or on screen arrow keys, or by directly clicking on thumbnails
- Download specific image directly from the control
- Delete specific image directly from the control
- All image data are bundled and stored on the configured File column


## Limitations
- Currently, the max upload size is 12MB due to latest CRM webapi requiring chunking when retrieving bigger files (> 16 MB). This issue will be eliviated in next iteration upon which the max upload size will be 1GB.
- This control is supposed to be used for use cases where each records will only have limited images (totaling < 100 MB as recommendation for maximal performance) as each update on the image requires the code to patch the whole file binary.
- As we rely on File type field which forces us to update the whole file blob, this technique is not performant as the total image size gets bigger specially if there is a need for constant update (don't get me wrong, it will work fine in practical sense but its not an optimal solution). Future version of this app could potentially allow connecting directly to cloud storage (Azure or AWS) but that would require extra mechanism to generate SAS tokens etc. 
