import { scholarshipService } from './scholarshipService';

export const seedScholarships = async () => {
  console.log('Scholarship seeding disabled - only admin-created scholarships will be shown');
  
  try {
    // No sample scholarships created - admin will add scholarships via admin dashboard
    console.log('🎉 Scholarship system ready for admin input only!');
  } catch (error) {
    console.error('❌ Error in scholarship setup:', error);
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
