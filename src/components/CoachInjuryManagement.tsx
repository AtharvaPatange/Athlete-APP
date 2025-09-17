"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";

interface InjuryReport {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  sport: string;
  injuryType: string;
  bodyPart: string;
  severity: "minor" | "moderate" | "severe";
  description: string;
  dateReported: any;
  expectedRecoveryDate: any;
  status: "reported" | "in_recovery" | "recovered" | "coach_verified" | "cleared";
  coachVerification?: {
    verified: boolean;
    verifiedBy?: string;
    verificationDate?: any;
    coachNotes?: string;
  };
  recoveryProgress?: {
    percentage: number;
    lastUpdated: any;
    notes: string;
  };
  medicalClearance?: {
    cleared: boolean;
    clearanceDate?: any;
    doctorNotes?: string;
  };
}

interface CoachInjuryManagementProps {
  coachRegion: string;
  coachId: string;
}

const CoachInjuryManagement = ({ coachRegion, coachId }: CoachInjuryManagementProps) => {
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedInjury, setSelectedInjury] = useState<InjuryReport | null>(null);
  const [verificationModal, setVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    approved: true,
    notes: ""
  });

  const statusOptions = [
    { value: "all", label: "All Injuries" },
    { value: "reported", label: "Newly Reported" },
    { value: "in_recovery", label: "In Recovery" },
    { value: "recovered", label: "Awaiting Verification" },
    { value: "coach_verified", label: "Coach Verified" },
    { value: "cleared", label: "Fully Cleared" }
  ];

  useEffect(() => {
    fetchInjuries();
  }, [coachRegion, filterStatus]);

  const fetchInjuries = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all athletes in the coach's region
      const usersRef = collection(db, "users");
      const athletesQuery = query(
        usersRef,
        where("role", "==", "athlete"),
        where("region", "==", coachRegion)
      );
      
      const athletesSnapshot = await getDocs(athletesQuery);
      const athleteIds: string[] = [];
      const athleteMap: { [id: string]: any } = {};
      
      athletesSnapshot.forEach((doc) => {
        const data = doc.data();
        athleteIds.push(doc.id);
        athleteMap[doc.id] = data;
      });

      if (athleteIds.length === 0) {
        setInjuries([]);
        setLoading(false);
        return;
      }

      // Fetch injury reports for these athletes
      const injuriesRef = collection(db, "injuries");
      let injuriesQuery = query(
        injuriesRef,
        where("athleteId", "in", athleteIds.slice(0, 10)) // Firestore limits 'in' queries to 10
      );

      if (filterStatus !== "all") {
        injuriesQuery = query(
          injuriesRef,
          where("athleteId", "in", athleteIds.slice(0, 10)),
          where("status", "==", filterStatus)
        );
      }

      const injuriesSnapshot = await getDocs(injuriesQuery);
      const injuriesList: InjuryReport[] = [];

      injuriesSnapshot.forEach((doc) => {
        const data = doc.data();
        const athleteData = athleteMap[data.athleteId];
        
        injuriesList.push({
          id: doc.id,
          athleteId: data.athleteId,
          athleteName: athleteData?.name || "Unknown Athlete",
          athleteEmail: athleteData?.email || "",
          sport: athleteData?.sport || data.sport || "Unknown",
          injuryType: data.injuryType || "Not specified",
          bodyPart: data.bodyPart || "Not specified",
          severity: data.severity || "minor",
          description: data.description || "",
          dateReported: data.dateReported,
          expectedRecoveryDate: data.expectedRecoveryDate,
          status: data.status || "reported",
          coachVerification: data.coachVerification || {},
          recoveryProgress: data.recoveryProgress || { percentage: 0, notes: "" },
          medicalClearance: data.medicalClearance || {}
        });
      });

      // Handle remaining athletes if there are more than 10
      if (athleteIds.length > 10) {
        const batches = [];
        for (let i = 10; i < athleteIds.length; i += 10) {
          const batchIds = athleteIds.slice(i, Math.min(i + 10, athleteIds.length));
          let batchQuery = query(
            injuriesRef,
            where("athleteId", "in", batchIds)
          );

          if (filterStatus !== "all") {
            batchQuery = query(
              injuriesRef,
              where("athleteId", "in", batchIds),
              where("status", "==", filterStatus)
            );
          }

          batches.push(getDocs(batchQuery));
        }

        const batchResults = await Promise.all(batches);
        batchResults.forEach(snapshot => {
          snapshot.forEach((doc) => {
            const data = doc.data();
            const athleteData = athleteMap[data.athleteId];
            
            injuriesList.push({
              id: doc.id,
              athleteId: data.athleteId,
              athleteName: athleteData?.name || "Unknown Athlete",
              athleteEmail: athleteData?.email || "",
              sport: athleteData?.sport || data.sport || "Unknown",
              injuryType: data.injuryType || "Not specified",
              bodyPart: data.bodyPart || "Not specified",
              severity: data.severity || "minor",
              description: data.description || "",
              dateReported: data.dateReported,
              expectedRecoveryDate: data.expectedRecoveryDate,
              status: data.status || "reported",
              coachVerification: data.coachVerification || {},
              recoveryProgress: data.recoveryProgress || { percentage: 0, notes: "" },
              medicalClearance: data.medicalClearance || {}
            });
          });
        });
      }

      // Sort injuries by date reported (most recent first)
      injuriesList.sort((a, b) => {
        const aTime = a.dateReported?.toMillis?.() || 0;
        const bTime = b.dateReported?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setInjuries(injuriesList);

    } catch (err: any) {
      console.error("Error fetching injuries:", err);
      setError(err.message || "Failed to fetch injury reports");
    } finally {
      setLoading(false);
    }
  };

  const handleCoachVerification = async () => {
    if (!selectedInjury) return;

    try {
      const injuryRef = doc(db, "injuries", selectedInjury.id);
      
      const updateData = {
        status: verificationForm.approved ? "coach_verified" : "in_recovery",
        coachVerification: {
          verified: verificationForm.approved,
          verifiedBy: coachId,
          verificationDate: serverTimestamp(),
          coachNotes: verificationForm.notes || ""
        }
      };

      await updateDoc(injuryRef, updateData);

      // Add notification for athlete
      const notificationRef = collection(db, "notifications");
      await addDoc(notificationRef, {
        userId: selectedInjury.athleteId,
        type: "coach_verification",
        title: verificationForm.approved ? "Recovery Approved!" : "Recovery Feedback",
        message: verificationForm.approved 
          ? "Your coach has approved your recovery. You can now return to training."
          : "Your coach has provided feedback on your recovery progress.",
        data: {
          injuryId: selectedInjury.id,
          coachNotes: verificationForm.notes
        },
        read: false,
        createdAt: serverTimestamp()
      });

      setVerificationModal(false);
      setSelectedInjury(null);
      setVerificationForm({ approved: true, notes: "" });
      fetchInjuries(); // Refresh the list

    } catch (err: any) {
      console.error("Error updating verification:", err);
      setError("Failed to update verification status");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Not set";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor": return "bg-yellow-100 text-yellow-800";
      case "moderate": return "bg-orange-100 text-orange-800";
      case "severe": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported": return "bg-blue-100 text-blue-800";
      case "in_recovery": return "bg-yellow-100 text-yellow-800";
      case "recovered": return "bg-purple-100 text-purple-800";
      case "coach_verified": return "bg-green-100 text-green-800";
      case "cleared": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reported": return "Newly Reported";
      case "in_recovery": return "In Recovery";
      case "recovered": return "Awaiting Verification";
      case "coach_verified": return "Coach Verified";
      case "cleared": return "Fully Cleared";
      default: return status;
    }
  };

  const injuryStats = {
    total: injuries.length,
    awaitingVerification: injuries.filter(i => i.status === "recovered").length,
    inRecovery: injuries.filter(i => i.status === "in_recovery").length,
    verified: injuries.filter(i => i.status === "coach_verified").length
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-300 rounded-lg h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 4h10.124c1.54 0 2.502 1.667 1.732 2.5L13.732 20c-.77.833-1.964.833-2.732 0L4.082 6.5C3.312 5.167 4.273 4 5.812 4z" />
          </svg>
          <p className="text-lg font-medium">Error Loading Injury Reports</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchInjuries}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Injury Management
          </h2>
          <p className="text-gray-600">
            Monitor and verify athlete recovery progress
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 4h10.124c1.54 0 2.502 1.667 1.732 2.5L13.732 20c-.77.833-1.964.833-2.732 0L4.082 6.5C3.312 5.167 4.273 4 5.812 4z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Injuries</p>
              <p className="text-2xl font-bold text-gray-900">{injuryStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Awaiting Verification</p>
              <p className="text-2xl font-bold text-purple-600">{injuryStats.awaitingVerification}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Recovery</p>
              <p className="text-2xl font-bold text-yellow-600">{injuryStats.inRecovery}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Coach Verified</p>
              <p className="text-2xl font-bold text-green-600">{injuryStats.verified}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Injuries List */}
      {injuries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Injury Reports Found</h3>
          <p className="text-gray-600">
            {filterStatus === "all" 
              ? "No athletes in your region have reported injuries" 
              : `No injuries with status: ${getStatusLabel(filterStatus)}`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Injury Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recovery Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {injuries.map((injury) => (
                  <tr key={injury.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {injury.athleteName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {injury.sport}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{injury.injuryType}</div>
                      <div className="text-sm text-gray-500">{injury.bodyPart}</div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(injury.severity)}`}>
                        {injury.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(injury.status)}`}>
                        {getStatusLabel(injury.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${injury.recoveryProgress?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {injury.recoveryProgress?.percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(injury.dateReported)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedInjury(injury)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      {injury.status === "recovered" && (
                        <button
                          onClick={() => {
                            setSelectedInjury(injury);
                            setVerificationModal(true);
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Verify Recovery
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verificationModal && selectedInjury && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verify Recovery: {selectedInjury.athleteName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Decision
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verification"
                      checked={verificationForm.approved}
                      onChange={() => setVerificationForm({ ...verificationForm, approved: true })}
                      className="mr-2 text-green-600"
                    />
                    <span className="text-sm">✅ Approve - Athlete can return to training</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verification"
                      checked={!verificationForm.approved}
                      onChange={() => setVerificationForm({ ...verificationForm, approved: false })}
                      className="mr-2 text-red-600"
                    />
                    <span className="text-sm">❌ Request more recovery time</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coach Notes (Optional)
                </label>
                <textarea
                  value={verificationForm.notes}
                  onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add any notes for the athlete..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCoachVerification}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Submit Verification
              </button>
              <button
                onClick={() => {
                  setVerificationModal(false);
                  setSelectedInjury(null);
                  setVerificationForm({ approved: true, notes: "" });
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedInjury && !verificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Injury Report Details
                </h3>
                <button
                  onClick={() => setSelectedInjury(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Athlete</label>
                    <p className="text-lg">{selectedInjury.athleteName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sport</label>
                    <p className="text-lg">{selectedInjury.sport}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Injury Type</label>
                    <p className="text-lg">{selectedInjury.injuryType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Body Part</label>
                    <p className="text-lg">{selectedInjury.bodyPart}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Severity</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(selectedInjury.severity)}`}>
                      {selectedInjury.severity}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInjury.status)}`}>
                      {getStatusLabel(selectedInjury.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedInjury.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Reported</label>
                    <p className="text-lg">{formatDate(selectedInjury.dateReported)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Recovery</label>
                    <p className="text-lg">{formatDate(selectedInjury.expectedRecoveryDate)}</p>
                  </div>
                </div>

                {selectedInjury.recoveryProgress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Recovery Progress</label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 mr-4">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${selectedInjury.recoveryProgress.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {selectedInjury.recoveryProgress.percentage}%
                        </span>
                      </div>
                      {selectedInjury.recoveryProgress.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedInjury.recoveryProgress.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedInjury.coachVerification?.verified && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Coach Verification</label>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">
                          Verified on {formatDate(selectedInjury.coachVerification.verificationDate)}
                        </span>
                      </div>
                      {selectedInjury.coachVerification.coachNotes && (
                        <p className="text-sm text-green-700 mt-2">
                          Notes: {selectedInjury.coachVerification.coachNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                {selectedInjury.status === "recovered" && (
                  <button
                    onClick={() => setVerificationModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Verify Recovery
                  </button>
                )}
                <button
                  onClick={() => window.location.href = `mailto:${selectedInjury.athleteEmail}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Contact Athlete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachInjuryManagement;