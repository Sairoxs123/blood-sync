import React, { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  query,
  where,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { Plus, MapPin, PlayCircle, StopCircle } from "lucide-react";
import { useAuth } from "../../utils/AuthContext";
import { v4 as uuidv4 } from "uuid";

export const CoordinatorDashboard = () => {
  const [activeCamp, setActiveCamp] = useState(null);
  const [pastCamps, setPastCamps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [allDonors, setAllDonors] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [showDonorsListModal, setShowDonorsListModal] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState("");
  const [campLocation, setCampLocation] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [inventory, setInventory] = useState({
    "A+": 0,
    "A-": 0,
    "B+": 0,
    "B-": 0,
    "AB+": 0,
    "AB-": 0,
    "O+": 0,
    "O-": 0,
  });
  const [donorData, setDonorData] = useState({
    donorId: "",
    contact: "",
    bloodType: "A+",
    units: "",
    isEditing: false,
    firestoreId: ""
  });
  const { user } = useAuth();

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          (error) => reject(error)
        );
      }
    });
  };

  const startCamp = async () => {
    try {
      if (!campLocation.trim() || !coordinatorName.trim()) {
        alert("Please enter camp location and coordinator name");
        return;
      }

      const location = await getLocation();

      const campRef = await addDoc(collection(db, "camps"), {
        location: campLocation.trim(),
        coordinator: coordinatorName.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        inventory: inventory,
        status: "active",
        started_at: serverTimestamp(),
        coordinator_uid: user?.uid || "unknown",
      });

      alert("Camp started successfully!");
      setShowStartModal(false);
      setCampLocation("");
      setCoordinatorName("");
    } catch (error) {
      console.error("Error starting camp:", error);
      alert("Error starting camp: " + error.message);
    }
  };

  const endCamp = async () => {
    if (!activeCamp) return;

    const confirmed = window.confirm(
      "Are you sure you want to end this camp session?"
    );
    if (!confirmed) return;

    try {
      // Update camp status to inactive
      const campRef = doc(db, "camps", activeCamp.id);
      await updateDoc(campRef, {
        status: "inactive",
        ended_at: serverTimestamp()
      });

      const requestsref = collection(db, "requests");
      const q = query(requestsref, where("camp_id", "==", activeCamp.id), where("status", "==", "Pending"));
      try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          console.log(
            `Found ${querySnapshot.docs.length} documents to update...`
          );

          const updatePromises = [];
          const updateData = {
            status: "Camp Closed Before Approving Request"
          }
          querySnapshot.forEach((document) => {
            const docRef = doc(db, "requests", document.id);

            updatePromises.push(updateDoc(docRef, updateData));
          });

          await Promise.all(updatePromises);

          console.log("All matching documents successfully updated!");
        }
      } catch (error) {
        console.error("Error updating documents: ", error);
      }
      alert("Camp ended successfully!");
    } catch (error) {
      console.error("Error ending camp:", error);
      alert("Error ending camp: " + error.message);
    }
  };

  const openDonorModal = () => {
    setDonorData({
      donorId: uuidv4(),
      contact: "",
      bloodType: "A+",
      units: "",
      isEditing: false,
      firestoreId: ""
    });
    setShowDonorModal(true);
  };

  const openEditDonorModal = (donor) => {
    setDonorData({
      donorId: donor.donor_id,
      contact: donor.contact,
      bloodType: donor.blood_type,
      units: donor.units.toString(),
      isEditing: true,
      firestoreId: donor.id
    });
    setShowDonorModal(true);
  };

  const openDonorsListModal = (bloodType) => {
    setSelectedBloodType(bloodType);
    setShowDonorsListModal(true);
  };

  const addDonor = async () => {
    if (!activeCamp) return;

    try {
      // Validate form
      if (!donorData.contact.trim() || !donorData.units) {
        alert("Please fill in all fields");
        return;
      }

      const units = parseInt(donorData.units);
      if (isNaN(units) || units <= 0) {
        alert("Please enter a valid number of units (greater than 0)");
        return;
      }

      if (donorData.isEditing) {
        // Update existing donor
        const donorRef = doc(db, "donors", donorData.firestoreId);
        const oldDonor = donors.find(d => d.id === donorData.firestoreId);
        const oldUnits = oldDonor.units;
        const oldBloodType = oldDonor.blood_type;

        await updateDoc(donorRef, {
          contact: donorData.contact.trim(),
          blood_type: donorData.bloodType,
          units: units,
        });

        // Update inventory: remove old contribution and add new one
        const campRef = doc(db, "camps", activeCamp.id);
        if (oldBloodType === donorData.bloodType) {
          // Same blood type, just adjust the difference
          const difference = units - oldUnits;
          await updateDoc(campRef, {
            [`inventory.${donorData.bloodType}`]: increment(difference),
          });
        } else {
          // Different blood type, remove from old and add to new
          await updateDoc(campRef, {
            [`inventory.${oldBloodType}`]: increment(-oldUnits),
            [`inventory.${donorData.bloodType}`]: increment(units),
          });
        }

        alert("Donor information updated!");
      } else {
        // Save new donor information to Firestore
        await addDoc(collection(db, "donors"), {
          donor_id: donorData.donorId,
          contact: donorData.contact.trim(),
          blood_type: donorData.bloodType,
          units: units,
          camp_id: activeCamp.id,
          camp_location: activeCamp.location,
          donated_at: serverTimestamp()
        });

        // Update camp inventory
        const campRef = doc(db, "camps", activeCamp.id);
        await updateDoc(campRef, {
          [`inventory.${donorData.bloodType}`]: increment(units),
        });

        alert("Donor information saved and inventory updated!");
      }

      setShowDonorModal(false);
      setDonorData({
        donorId: "",
        contact: "",
        bloodType: "A+",
        units: "",
        isEditing: false,
        firestoreId: ""
      });
    } catch (error) {
      console.error("Error saving donor:", error);
      alert("Error saving donor information: " + error.message);
    }
  };

  const deleteDonor = async (donorId, bloodType, units) => {
    if (!activeCamp) return;

    const confirmed = window.confirm("Are you sure you want to delete this donor record?");
    if (!confirmed) return;

    try {
      // Delete donor record
      await deleteDoc(doc(db, "donors", donorId));

      // Update camp inventory
      const campRef = doc(db, "camps", activeCamp.id);
      await updateDoc(campRef, {
        [`inventory.${bloodType}`]: increment(-units),
      });

      alert("Donor record deleted successfully!");
    } catch (error) {
      console.error("Error deleting donor:", error);
      alert("Error deleting donor: " + error.message);
    }
  };

  const updateRequestStatus = async (id, newStatus) => {
    try {
      const requestRef = doc(db, "requests", id);
      await updateDoc(requestRef, {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Listener for active camp by this coordinator
    const campsQuery = query(
      collection(db, "camps"),
      where("coordinator_uid", "==", user.uid),
      where("status", "==", "active")
    );

    const unsubscribeCamps = onSnapshot(campsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const campData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        };
        setActiveCamp(campData);
      } else {
        setActiveCamp(null);
      }
    });

    // Listener for requests to this camp
    const unsubscribeRequests = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((req) => {
            // Show requests for this coordinator's active camp
            if (!activeCamp) return false;
            return req.camp_id === activeCamp.id;
          });

        data.sort((a, b) => {
          const aTime = a.requested_at?.toDate
            ? a.requested_at.toDate()
            : a.requested_at;
          const bTime = b.requested_at?.toDate
            ? b.requested_at.toDate()
            : b.requested_at;
          return bTime - aTime;
        });
        setRequests(data);
      }
    );

    // Listener for donors at this camp
    let unsubscribeDonors = () => {};
    if (activeCamp?.id) {
      const donorsQuery = query(
        collection(db, "donors"),
        where("camp_id", "==", activeCamp.id)
      );
      unsubscribeDonors = onSnapshot(donorsQuery, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => {
          const aTime = a.donated_at?.toDate ? a.donated_at.toDate() : new Date(0);
          const bTime = b.donated_at?.toDate ? b.donated_at.toDate() : new Date(0);
          return bTime - aTime;
        });
        setDonors(data);
      });
    }

    // Listener for past camps by this coordinator
    const pastCampsQuery = query(
      collection(db, "camps"),
      where("coordinator_uid", "==", user.uid),
      where("status", "==", "inactive")
    );

    const unsubscribePastCamps = onSnapshot(pastCampsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      data.sort((a, b) => {
        const aTime = a.ended_at?.toDate ? a.ended_at.toDate() : new Date(0);
        const bTime = b.ended_at?.toDate ? b.ended_at.toDate() : new Date(0);
        return bTime - aTime;
      });
      setPastCamps(data);
    });

    // Listener for all donors (for past camps summary)
    const allDonorsQuery = query(
      collection(db, "donors")
    );
    const unsubscribeAllDonors = onSnapshot(allDonorsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllDonors(data);
    });

    return () => {
      unsubscribeCamps();
      unsubscribeRequests();
      unsubscribeDonors();
      unsubscribePastCamps();
      unsubscribeAllDonors();
    };
  }, [user, activeCamp?.id]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        NSS Coordinator Dashboard
      </h1>

      {/* Camp Status */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        {!activeCamp ? (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              No Active Camp
            </h2>
            <p className="text-gray-600 mb-4">
              Start a new blood donation camp to begin collecting donations
            </p>
            <button
              onClick={() => setShowStartModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlayCircle className="mr-2 h-5 w-5" /> Start Camp
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <MapPin className="mr-2 h-6 w-6 text-red-600" />
                  {activeCamp.location}
                </h2>
                <p className="text-gray-600 mt-1">
                  Coordinator: {activeCamp.coordinator}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Location: {activeCamp.latitude?.toFixed(6)},{" "}
                  {activeCamp.longitude?.toFixed(6)}
                </p>
              </div>
              <button
                onClick={endCamp}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <StopCircle className="mr-2 h-4 w-4" /> End Camp
              </button>
            </div>
          </div>
        )}
      </div>

      {activeCamp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Camp Inventory */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden md:col-span-1">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Camp Inventory
              </h2>
            </div>
            <div className="p-4">
              <div className="mt-4 space-y-2">
                {Object.keys(activeCamp.inventory || {})
                  .sort()
                  .map((key, idx) => {
                    const donorCount = donors.filter(d => d.blood_type === key).length;
                    return (
                      <div
                        className="flex justify-between items-center"
                        key={idx}
                      >
                        <span className="font-bold text-lg text-red-600">
                          {key}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-gray-800 min-w-[2rem] text-center">
                            {activeCamp.inventory[key] || 0} units
                          </span>
                          <button
                            onClick={() => openDonorsListModal(key)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                            disabled={donorCount === 0}
                          >
                            {donorCount} {donorCount === 1 ? 'donor' : 'donors'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <button
                onClick={openDonorModal}
                className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Donor
              </button>
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                Incoming Requests to This Camp
              </h2>
            </div>
            <div className="p-4">
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No requests yet
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {requests.map((val, idx) => {
                    return (
                      <div
                        className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
                        key={idx}
                      >
                        <div>
                          <span className="font-bold text-lg text-red-600">
                            {val.units} Units, {val.blood_type}
                          </span>
                          <p className="text-sm text-gray-600">
                            From: {val.hospital} {val.urgent ? "(Urgent)" : ""}
                          </p>
                          {val.distance && (
                            <p className="text-xs text-gray-500">
                              Distance: {val.distance.toFixed(2)} km
                            </p>
                          )}
                        </div>
                        <select
                          value={val.status || "Pending"}
                          onChange={(e) =>
                            updateRequestStatus(val.id, e.target.value)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Delivering">Delivering</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Past Camps Section */}
      {!activeCamp && pastCamps.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Camps</h2>
          <div className="space-y-4">
            {pastCamps.map((camp) => {
              const campDonors = allDonors.filter(d => d.camp_id === camp.id);
              const totalDonors = campDonors.length;
              const totalUnits = Object.values(camp.inventory || {}).reduce((sum, val) => sum + val, 0);

              return (
                <div key={camp.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-red-600" />
                        {camp.location}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Coordinator: {camp.coordinator}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started: {camp.started_at?.toDate ? camp.started_at.toDate().toLocaleDateString() : 'N/A'}
                        {camp.ended_at?.toDate && ` - Ended: ${camp.ended_at.toDate().toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{totalUnits}</p>
                      <p className="text-sm text-gray-600">Total Units</p>
                      <p className="text-sm text-gray-500">{totalDonors} Donors</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Blood Type Breakdown:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(camp.inventory || {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([bloodType, units]) => (
                          <div key={bloodType} className="text-center">
                            <p className="text-xs font-bold text-red-600">{bloodType}</p>
                            <p className="text-sm text-gray-800">{units} units</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for starting camp */}
      {showStartModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Start Blood Donation Camp
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camp Location / Place Name
                  </label>
                  <input
                    type="text"
                    value={campLocation}
                    onChange={(e) => setCampLocation(e.target.value)}
                    placeholder="e.g., Central Park, City Hall"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Your current location will be captured automatically
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setCampLocation("");
                    setCoordinatorName("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  onClick={startCamp}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Start Camp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for donors list */}
      {showDonorsListModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Donors - {selectedBloodType}
              </h3>
              <div className="space-y-3">
                {donors
                  .filter(d => d.blood_type === selectedBloodType)
                  .map((donor, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            Donor ID: <span className="text-sm font-mono text-gray-600">{donor.donor_id}</span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Contact: {donor.contact}
                          </p>
                          <p className="text-sm text-gray-600">
                            Units: {donor.units}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Donated: {donor.donated_at?.toDate ? donor.donated_at.toDate().toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowDonorsListModal(false);
                              openEditDonorModal(donor);
                            }}
                            className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteDonor(donor.id, donor.blood_type, donor.units)}
                            className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {donors.filter(d => d.blood_type === selectedBloodType).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No donors for this blood type</p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDonorsListModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding/editing donor */}
      {showDonorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {donorData.isEditing ? 'Edit Donor Information' : 'Add Donor Information'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donor ID (Auto-generated)
                  </label>
                  <input
                    type="text"
                    value={donorData.donorId}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number / Email
                  </label>
                  <input
                    type="text"
                    value={donorData.contact}
                    onChange={(e) => setDonorData({...donorData, contact: e.target.value})}
                    placeholder="e.g., +91 9876543210 or email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    value={donorData.bloodType}
                    onChange={(e) => setDonorData({...donorData, bloodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Donated
                  </label>
                  <input
                    type="number"
                    value={donorData.units}
                    onChange={(e) => setDonorData({...donorData, units: e.target.value})}
                    placeholder="Enter number of units"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDonorModal(false);
                    setDonorData({
                      donorId: "",
                      contact: "",
                      bloodType: "A+",
                      units: "",
                      isEditing: false,
                      firestoreId: ""
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  onClick={addDonor}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {donorData.isEditing ? 'Update Donor' : 'Save Donor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
