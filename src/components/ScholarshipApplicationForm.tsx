"use client";
import React, { useState } from 'react';
import { Scholarship, validateApplication } from '@/services/scholarshipAIService';

interface ApplicationFormProps {
  scholarship: Scholarship;
  formStructure: any;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const ScholarshipApplicationForm: React.FC<ApplicationFormProps> = ({
  scholarship,
  formStructure,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<any>({
    personalInfo: {},
    sportsInfo: {},
    academicInfo: {},
    financialInfo: {},
    documents: {},
    additionalInfo: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate the application
    const validation = validateApplication(formData, scholarship);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(['Failed to submit application. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (section: string, field: string, label: string, type: string = 'text') => {
    const value = formData[section]?.[field] || '';
    
    return (
      <div key={field} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {type === 'select' && field === 'primarySport' ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            required
          >
            <option value="">Select Sport</option>
            {scholarship.sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            rows={3}
          />
        ) : type === 'date' ? (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            required={formStructure.requiredFields[section]?.includes(field)}
          />
        ) : type === 'file' ? (
          <input
            type="file"
            onChange={(e) => handleInputChange(section, field, e.target.files?.[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            required={formStructure.requiredFields[section]?.includes(field)}
          />
        )}
      </div>
    );
  };

  const renderSection = (sectionKey: string, sectionTitle: string, fields: string[]) => {
    const fieldLabels: { [key: string]: string } = {
      fullName: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      dateOfBirth: 'Date of Birth',
      address: 'Address',
      state: 'State',
      district: 'District',
      primarySport: 'Primary Sport',
      achievements: 'Key Achievements',
      playingExperience: 'Playing Experience (years)',
      currentEducation: 'Current Education Level',
      institution: 'Institution Name',
      percentage: 'Academic Percentage',
      familyIncome: 'Annual Family Income',
      additionalInfo: 'Additional Information'
    };

    const fieldTypes: { [key: string]: string } = {
      email: 'email',
      phone: 'tel',
      dateOfBirth: 'date',
      playingExperience: 'number',
      percentage: 'number',
      familyIncome: 'number',
      achievements: 'textarea',
      additionalInfo: 'textarea',
      primarySport: 'select'
    };

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
          {sectionTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => renderField(
            sectionKey, 
            field, 
            fieldLabels[field] || field, 
            fieldTypes[field] || 'text'
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">📝 Application Form</h2>
            <h3 className="text-xl text-gray-700 mt-1">{scholarship.title}</h3>
            <p className="text-gray-600">{scholarship.provider}</p>
          </div>
          <div className="text-right">
            <div className="bg-green-100 px-3 py-1 rounded-full text-sm font-medium text-green-800 mb-2">
              {scholarship.amount}
            </div>
            <div className="text-sm text-gray-500">
              Deadline: {scholarship.deadline}
            </div>
          </div>
        </div>
        
        {/* Eligibility Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Eligibility Requirements:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {scholarship.eligibility.map((req, idx) => (
              <li key={idx}>• {req}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Sections */}
        {renderSection('personalInfo', '👤 Personal Information', formStructure.requiredFields.personalInfo)}
        {renderSection('sportsInfo', '🏃‍♂️ Sports Information', formStructure.requiredFields.sportsInfo)}
        {renderSection('academicInfo', '🎓 Academic Information', formStructure.requiredFields.academicInfo)}
        
        {formStructure.optionalFields.financialInfo?.length > 0 && 
          renderSection('financialInfo', '💰 Financial Information', formStructure.optionalFields.financialInfo)
        }

        {/* Documents Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
            📎 Required Documents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formStructure.requiredFields.documents.map((doc: string) => (
              renderField('documents', doc, doc.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()), 'file')
            ))}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              📋 Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX (Max size: 5MB each)
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
            ✍️ Additional Information
          </h3>
          <textarea
            value={formData.additionalInfo || ''}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, additionalInfo: e.target.value }))}
            placeholder="Any additional information you'd like to provide..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div className="flex space-x-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Submitting...
              </>
            ) : (
              '🚀 Submit Application'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScholarshipApplicationForm;
