
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import { Buffer } from 'buffer'; // Explicitly import Buffer

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // Ensure GEMINI_API_KEY is set in your .env.local

export async function POST(req: NextRequest) {
  console.log('Tailor CV API route invoked.');
  try {
    const formData = await req.formData();
    console.log('Form data parsed.');

    const cvFile = formData.get('cvFile') as Blob;
    const jobDescription = formData.get('jobDescription') as string;

    if (!cvFile || !jobDescription) {
      console.error('Missing CV file or job description.');
      return NextResponse.json({ error: 'Missing CV file or job description' }, { status: 400 });
    }
    console.log('CV file and job description received.');

    // Read the DOCX file content
    const arrayBuffer = await cvFile.arrayBuffer();
    console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes.`);
    const nodeBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Node.js Buffer
    console.log('CV file converted to ArrayBuffer and then to Node.js Buffer.');

    const { value: htmlContent } = await mammoth.extractRawText({ buffer: nodeBuffer }); // Use 'buffer' option
    console.log('CV content extracted using mammoth.');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Gemini model initialized.');

    const prompt = `You are an AI CV tailoring assistant. Given the following CV content and job description, please tailor the CV to be more detailed and better match the job description. Focus on highlighting relevant skills and experiences, and rephrase sections to align with the job's requirements. The output should be the final tailored CV content, ready for use, with no comments, placeholders, or conversational text. Maintain a professional tone and the overall structure of a CV. Use the following formatting conventions:
- Use a single '#' for main section titles (e.g., # Personal Details).
- Use '##' for sub-section titles (e.g., ## Work Experience).
- Use '-' for bullet points in lists.

CV Content:
${htmlContent}

Job Description:
${jobDescription}

Tailored CV:`;
    console.log('Prompt created.');

    const result = await model.generateContent(prompt);
    console.log('Gemini content generation complete.');

    const response = await result.response;
    const tailoredCvContent = response.text();
    console.log('Tailored CV content received from Gemini.');

    // Helper function to parse content and create DOCX paragraphs
    const createDocxParagraphs = (text: string) => {
      const paragraphs: Paragraph[] = [];
      const lines = text.split('\n');

      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('# ')) {
          // Main Heading
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmedLine.substring(2), bold: true, size: 48, color: "000000", font: "Calibri" })],
            spacing: { after: 240 },
          }));
        } else if (trimmedLine.startsWith('## ')) {
          // Sub-heading
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmedLine.substring(3), bold: true, size: 36, color: "000000", font: "Calibri" })],
            spacing: { after: 120 },
          }));
        } else if (trimmedLine.match(/^[\s]*[-*]\s+/)) {
          // List item (more robust check)
          const content = trimmedLine.replace(/^[\s]*[-*]\s+/, '');
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: content, size: 24, color: "000000", font: "Calibri" })],
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        } else if (trimmedLine !== '') {
          // Regular paragraph
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: trimmedLine, size: 24, color: "000000", font: "Calibri" })],
            spacing: { after: 120 },
          }));
        }
      });
      return paragraphs;
    };

    const docxChildren = createDocxParagraphs(tailoredCvContent);

    const doc = new Document({
      sections: [{
        children: docxChildren,
      }],
    });
    console.log('DOCX document created.');

    const buffer = await Packer.toBuffer(doc);
    console.log('DOCX buffer created.');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="tailored_cv.docx"',
      },
    });

  } catch (error: unknown) {
    console.error('Error tailoring CV:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    return NextResponse.json({ error: 'Failed to tailor CV' }, { status: 500 });
  }
}
