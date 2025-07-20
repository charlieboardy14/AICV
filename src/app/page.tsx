'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'tailor'

  // State for CV Creation
  const [personalDetails, setPersonalDetails] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [creationLoading, setCreationLoading] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // State for CV Tailoring
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [tailoringError, setTailoringError] = useState<string | null>(null);

  const handleCreateCv = async () => {
    setCreationLoading(true);
    setCreationError(null);
    try {
      const response = await fetch('/api/generate-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personalDetails, workExperience, education, skills }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated_cv.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setCreationError(error.message);
    } finally {
      setCreationLoading(false);
    }
  };

  const handleTailorCv = async () => {
    setTailoringLoading(true);
    setTailoringError(null);
    try {
      if (!cvFile) {
        throw new Error('Please upload a CV file.');
      }

      const formData = new FormData();
      formData.append('cvFile', cvFile);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/tailor-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to tailor CV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tailored_cv.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setTailoringError(error.message);
    } finally {
      setTailoringLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">AI CV Writer and Tailor</h1>

      <div className="flex justify-center mb-8">
        <button
          className={`px-6 py-3 text-lg font-medium rounded-l-lg ${
            activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800'
          }`}
          onClick={() => setActiveTab('create')}
        >
          CV Creation
        </button>
        <button
          className={`px-6 py-3 text-lg font-medium rounded-r-lg ${
            activeTab === 'tailor' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800'
          }`}
          onClick={() => setActiveTab('tailor')}
        >
          CV Tailoring
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {activeTab === 'create' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Create Your CV</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="personalDetails" className="block text-sm font-medium text-gray-700">Personal Details</label>
                <textarea
                  id="personalDetails"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={personalDetails}
                  onChange={(e) => setPersonalDetails(e.target.value)}
                  placeholder="Name, Contact, Email, LinkedIn, etc."
                ></textarea>
              </div>
              <div>
                <label htmlFor="workExperience" className="block text-sm font-medium text-gray-700">Work Experience</label>
                <textarea
                  id="workExperience"
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  placeholder="Job Title, Company, Dates, Responsibilities, Achievements"
                ></textarea>
              </div>
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">Education</label>
                <textarea
                  id="education"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Degree, University, Dates, Relevant Coursework"
                ></textarea>
              </div>
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills</label>
                <textarea
                  id="skills"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Programming Languages, Tools, Soft Skills, etc."
                ></textarea>
              </div>
              <button
                onClick={handleCreateCv}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={creationLoading}
              >
                {creationLoading ? 'Generating...' : 'Generate CV'}
              </button>
              {creationError && <p className="text-red-500 text-sm mt-2">Error: {creationError}</p>}
            </div>
          </div>
        )}

        {activeTab === 'tailor' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Tailor Your CV</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="cvFile" className="block text-sm font-medium text-gray-700">Upload CV (.docx)</label>
                <input
                  type="file"
                  id="cvFile"
                  accept=".docx"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
                <textarea
                  id="jobDescription"
                  rows={10}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                ></textarea>
              </div>
              <button
                onClick={handleTailorCv}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={tailoringLoading}
              >
                {tailoringLoading ? 'Tailoring...' : 'Tailor CV'}
              </button>
              {tailoringError && <p className="text-red-500 text-sm mt-2">Error: {tailoringError}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
