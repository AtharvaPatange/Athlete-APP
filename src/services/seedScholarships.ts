import { scholarshipService } from './scholarshipService';

export const seedScholarships = async () => {
  console.log('Starting to seed scholarship opportunities...');
  
  try {
    // Use the existing createSampleOpportunities method
    await scholarshipService.createSampleOpportunities();
    console.log('🎉 Successfully seeded all scholarship opportunities!');
  } catch (error) {
    console.error('❌ Error seeding scholarships:', error);
    throw error;
  }
};

// Function to check if opportunities already exist
export const checkExistingOpportunities = async () => {
  try {
    const opportunities = await scholarshipService.getActiveOpportunities();
    console.log(`Found ${opportunities.length} existing opportunities`);
    return opportunities.length > 0;
  } catch (error) {
    console.error('Error checking existing opportunities:', error);
    return false;
  }
};
