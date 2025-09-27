
import JSZip from 'jszip';
// FIX: The type `FileMap` is not exported from `../types`. The correct type is `Files`.
import type { Files } from '../types';

/**
 * Creates a ZIP file from the project files and triggers a download.
 * @param files - A map of file paths to their content.
 * @param projectName - The name of the project, used for the zip file name.
 */
// FIX: The type `FileMap` has been changed to `Files` to match the imported type.
export const downloadProjectAsZip = async (files: Files, projectName: string): Promise<void> => {
  try {
    const zip = new JSZip();

    // Add all files to the zip archive
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });

    // Generate the zip file as a blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Sanitize the project name for use as a filename
    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'project';

    // Create a temporary link to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${safeProjectName}.zip`;
    
    // Append to body, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error("Failed to create or download project ZIP:", error);
    // Optionally, notify the user that the download failed.
    alert("Sorry, there was an error creating the download file.");
  }
};