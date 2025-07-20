
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { personalDetails, workExperience, education, skills } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a professional CV based on the following information:
    Personal Details: ${personalDetails}
    Work Experience: ${workExperience}
    Education: ${education}
    Skills: ${skills}
    
    Please provide the content in a structured format, suitable for a professional CV.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cvContent = response.text();

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cvContent,
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
        'Content-Disposition': 'attachment; filename="generated_cv.docx"',
      },
    });

  } catch (error) {
    console.error('Error generating CV:', error);
    return NextResponse.json({ error: 'Failed to generate CV' }, { status: 500 });
  }
}
