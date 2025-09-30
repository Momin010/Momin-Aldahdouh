
import JSZip from 'jszip';
import type { Files } from '../types';

/**
 * Creates a ZIP file from the project files and triggers a download.
 * @param files - A map of file paths to their content.
 * @param projectName - The name of the project, used for the zip file name.
 */
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
    const zipFileName = `${safeProjectName}.zip`;

    // Create a link element to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFileName;

    // Append to the document, click, and then remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the Object URL to free up memory
    URL.revokeObjectURL(link.href);

  } catch (error) {
    console.error('Error creating zip file:', error);
    alert('Sorry, there was an error creating the project ZIP file.');
  }
};
