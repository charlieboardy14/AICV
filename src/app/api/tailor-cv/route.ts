
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!); // Ensure GEMINI_API_KEY is set in your .env.local

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const cvFile = formData.get('cvFile') as Blob;
    const jobDescription = formData.get('jobDescription') as string;

    if (!cvFile || !jobDescription) {
      return NextResponse.json({ error: 'Missing CV file or job description' }, { status: 400 });
    }

    // Read the DOCX file content
    const arrayBuffer = await cvFile.arrayBuffer();
    const { value: htmlContent } = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI CV tailoring assistant. Given the following CV content and job description, please tailor the CV to better match the job description. Focus on highlighting relevant skills and experiences, and rephrase sections to align with the job's requirements. Maintain a professional tone and the overall structure of a CV.

CV Content:
${htmlContent}

Job Description:
${jobDescription}

Tailored CV:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tailoredCvContent = response.text();

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

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="tailored_cv.docx"',
      },
    });

  } catch (error) {
    console.error('Error tailoring CV:', error);
    return NextResponse.json({ error: 'Failed to tailor CV' }, { status: 500 });
  }
}
