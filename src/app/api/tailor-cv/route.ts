
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Gemini model initialized.');

    const prompt = `You are an AI CV tailoring assistant. Given the following CV content and job description, please tailor the CV to better match the job description. Focus on highlighting relevant skills and experiences, and rephrase sections to align with the job's requirements. Maintain a professional tone and the overall structure of a CV.

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

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: tailoredCvContent,
                font: "Calibri",
                size: 24,
              }),
            ],
          }),
        ],
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
