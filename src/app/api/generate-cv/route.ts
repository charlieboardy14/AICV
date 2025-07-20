
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { personalDetails, workExperience, education, skills } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate a complete, detailed, and professional CV based on the following information. The output should be the final CV content, ready for use, with no comments, placeholders, or conversational text. Use the following formatting conventions:
- Use a single '#' for main section titles (e.g., # Personal Details).
- Use '##' for sub-section titles (e.g., ## Work Experience).
- Use '-' for bullet points in lists.

Personal Details: ${personalDetails}
Work Experience: ${workExperience}
Education: ${education}
Skills: ${skills}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cvContent = response.text();

    // Helper function to parse content and create DOCX paragraphs
    const createDocxParagraphs = (text: string) => {
      const paragraphs: Paragraph[] = [];
      const lines = text.split('\n');

      lines.forEach(line => {
        if (line.startsWith('# ')) {
          // Main Heading
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line.substring(2), bold: true, size: 48 })],
            spacing: { after: 240 },
          }));
        } else if (line.startsWith('## ')) {
          // Sub-heading
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line.substring(3), bold: true, size: 36 })],
            spacing: { after: 120 },
          }));
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // List item
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line.substring(2), size: 24 })],
            bullet: { level: 0 },
            spacing: { after: 60 },
          }));
        } else if (line.trim() !== '') {
          // Regular paragraph
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: line.trim(), size: 24 })],
            spacing: { after: 120 },
          }));
        }
      });
      return paragraphs;
    };

    const docxChildren = createDocxParagraphs(cvContent);

    const doc = new Document({
      sections: [{
        children: docxChildren,
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
