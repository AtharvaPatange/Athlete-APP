import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const seedAdminUsers = async () => {
  try {
    // Check if admin users already exist
    const existingAdmins = await getDocs(query(collection(db, 'users'), where('role', 'in', ['admin', 'government'])));
    if (existingAdmins.size > 0) {
      console.log('Admin users already exist');
      return;
    }

    // Sample admin users
    const adminUsers = [
      {
        name: "Dr. Rajesh Kumar",
        email: "admin@sportsindia.gov.in",
        role: "admin",
        age: 45,
        gender: "Male",
        sport: "Administration",
        region: "Delhi",
        disability_flag: false,
        income_band: "High",
        department: "Sports Ministry",
        designation: "Joint Secretary",
        clearanceLevel: "L3",
        createdAt: new Date(),
        isActive: true
      },
      {
        name: "Ms. Priya Sharma",
        email: "government@sai.gov.in", 
        role: "government",
        age: 38,
        gender: "Female",
        sport: "Policy",
        region: "Karnataka",
        disability_flag: false,
        income_band: "High",
        department: "Sports Authority of India",
        designation: "Director",
        clearanceLevel: "L2",
        createdAt: new Date(),
        isActive: true
      },
      {
        name: "Mr. Vikash Singh",
        email: "policy@khelo.gov.in",
        role: "government",
        age: 42,
        gender: "Male", 
        sport: "Policy",
        region: "Haryana",
        disability_flag: false,
        income_band: "High",
        department: "Khelo India",
        designation: "Program Manager",
        clearanceLevel: "L2",
        createdAt: new Date(),
        isActive: true
      }
    ];

    // Add admin users to Firestore
    for (const admin of adminUsers) {
      await addDoc(collection(db, 'users'), admin);
    }

    console.log('✅ Admin users seeded successfully!');
    console.log('📧 Admin credentials:');
    console.log('   admin@sportsindia.gov.in (password: admin123)');
    console.log('   government@sai.gov.in (password: govt123)');
    console.log('   policy@khelo.gov.in (password: policy123)');
    
  } catch (error) {
    console.error('❌ Error seeding admin users:', error);
  }
};

// Function to create demo admin data
export const seedAdminDemoData = async () => {
  try {
    // This would populate demo injury reports, performance data etc.
    // For now, the AdminDashboard uses mock data
    console.log('✅ Admin demo data available in component');
  } catch (error) {
    console.error('❌ Error seeding admin demo data:', error);
  }
};
