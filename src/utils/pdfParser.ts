
import * as pdfjs from 'pdfjs-dist';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(fileContent: string | ArrayBuffer): Promise<string> {
  try {
    // If fileContent is a string (base64), convert it to ArrayBuffer
    let contentBuffer = fileContent;
    if (typeof fileContent === 'string') {
      // Remove data URL prefix if present
      const base64Content = fileContent.indexOf('base64,') !== -1 
        ? fileContent.split('base64,')[1] 
        : fileContent;
        
      contentBuffer = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0)).buffer;
    }
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: contentBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => 'str' in item ? item.str : '')
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
