import { createWorker } from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  let worker: Tesseract.Worker | null = null;
  
  try {
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    // Get the total number of pages
    const numPages = pdf.numPages;
    
    // Initialize an empty string to store the text
    let fullText = '';
    
    // Initialize Tesseract worker
    worker = await createWorker('eng');
    
    // Loop through each page and extract text
    for (let i = 1; i <= numPages; i++) {
      console.log(`Processing page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      
      // Extract regular text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      console.log(`Regular text extracted from page ${i}: ${pageText.length} characters`);
      
      // Extract images from the page using a more reliable method
      let imageText = '';
      
      try {
        // Create a canvas to render the page
        const canvas = document.createElement('canvas');
        const viewport = page.getViewport({ scale: 2.0 }); // Slightly lower scale to avoid memory issues
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render the page to the canvas
        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Perform OCR on the entire page
        console.log(`Starting OCR on page ${i}...`);
        const { data: { text } } = await worker.recognize(canvas);
        if (text && text.trim()) {
          imageText = text;
          console.log(`OCR extracted ${imageText.length} characters from page ${i}`);
        }
      } catch (imgError) {
        console.error(`Error processing page ${i} with OCR:`, imgError);
      }
      
      // Combine regular text and OCR text
      fullText += `--- PAGE ${i} ---\n`;
      fullText += pageText + '\n';
      if (imageText) {
        fullText += `--- OCR TEXT FROM PAGE ${i} ---\n`;
        fullText += imageText + '\n';
      }
      fullText += '\n\n';

      // Update progress
      if (onProgress) {
        onProgress(i / numPages);
      }
    }
    
    console.log(`Total extracted text: ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    if (error && error.name === 'InvalidPDFException') {
      console.error(`InvalidPDFException: Failed to parse PDF file '${file.name}'.`, error);
    } else {
      console.error('Error extracting text from PDF:', error);
    }
    throw new Error('Failed to extract text from PDF. Please try again with another file.');
  } finally {
    // Terminate the Tesseract worker
    if (worker) {
      await worker.terminate();
    }
  }
};

export const extractTextFromMultiplePDFs = async (
  files: File[],
  dispatch: any,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  // Log the number of files being processed
  console.log(`Processing ${files.length} files...`);

  // Process all PDF files in parallel
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const text = await extractTextFromPDF(file, onProgress);
        return text;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Log the specific error message for InvalidPDFException
        if (error && error.name === 'InvalidPDFException') {
          console.error(`InvalidPDFException: Failed to parse PDF file '${file.name}'.`, error);
        }
        // Log that the resume failed to parse
        console.log(`Resume '${file.name}' failed to parse.`);
        // Add a placeholder resume card for the failed file
        dispatch({
          type: "ADD_RESUMES",
          payload: [
            {
              id: uuidv4(),
              fileName: file.name,
              fileSize: file.size,
              uploadDate: new Date(),
              processed: false,
              error: `Error processing ${file.name}: ${error.message}`,
            }
          ],
        });
        return `Error processing ${file.name}: ${error.message}`;
      }
    })
  );

  return results;
};
