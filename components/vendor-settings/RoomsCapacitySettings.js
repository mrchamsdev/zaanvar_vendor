import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/rooms-capacity.module.css";
import AddRoomForm from "./AddRoomForm";

const RoomsCapacitySettings = ({ setTopbarActions, isAddingRoom, setIsAddingRoom }) => {
  const [activeSpace, setActiveSpace] = useState("Clinic");
  const [roomTypeFilter, setRoomTypeFilter] = useState("All Rooms");
  const [petTypeFilter, setPetTypeFilter] = useState("All Pets");
  const [occupancyFilter, setOccupancyFilter] = useState("All"); // All, Vacant, Occupied

  const [catAreaExpanded, setCatAreaExpanded] = useState(true);
  const [dogAreaExpanded, setDogAreaExpanded] = useState(true);

  // Pre-populated static rooms data matching Figma mockups
  const [rooms, setRooms] = useState([
    { id: "c1", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Cat", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "c2", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Cat", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "c3", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Cat", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "c4", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Cat", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "d1", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Dog", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "d2", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Dog", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "d3", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Dog", spaceType: "Clinic", roomType: "Small Room", isVacant: false },
    { id: "d4", name: "Small Dog Room-1", capacity: 7, available: 3, petType: "Dog", spaceType: "Clinic", roomType: "Small Room", isVacant: false }
  ]);

  // Register the Topbar Action "+ Add Room" (which user requested)
  useEffect(() => {
    if (setTopbarActions) {
      setTopbarActions({
        activeTab: "RoomsCapacity",
        onAddRooms: () => {
          setIsAddingRoom(true);
        },
        onAddServiceOrPackage: () => {}
      });
    }
    return () => {
      if (setTopbarActions) setTopbarActions(null);
    };
  }, [setTopbarActions]);

  // Filtering Rooms
  const filteredRooms = rooms.filter(room => {
    // Space filter
    if (room.spaceType !== activeSpace) return false;
    
    // Room type filter
    if (roomTypeFilter !== "All Rooms" && room.roomType !== roomTypeFilter) return false;
    
    // Pet type filter
    if (petTypeFilter !== "All Pets" && room.petType !== petTypeFilter) return false;
    
    // Occupancy filter
    if (occupancyFilter === "Vacant" && !room.isVacant) return false;
    if (occupancyFilter === "Occupied" && room.isVacant) return false;
    
    return true;
  });

  const catRooms = filteredRooms.filter(r => r.petType === "Cat");
  const dogRooms = filteredRooms.filter(r => r.petType === "Dog");

  const handleSaveRoom = (newRoomData) => {
    // Process submitted form data
    const formattedRooms = newRoomData.rooms.map((r, i) => ({
      id: `new_r_${Date.now()}_${i}`,
      name: r.roomName || "New Space Room",
      capacity: parseInt(r.capacity) || 7,
      available: parseInt(r.capacity) || 7,
      petType: r.petType || "Dog",
      spaceType: newRoomData.spaceType === "Clinic" ? "Clinic" : "Daycare",
      roomType: "Custom Room",
      isVacant: true
    }));
    
    setRooms(prev => [...prev, ...formattedRooms]);
    setIsAddingRoom(false);
  };

  if (isAddingRoom) {
    return (
      <div className={styles.container}>
        <AddRoomForm onCancel={() => setIsAddingRoom(false)} onSave={handleSaveRoom} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Dashboard Top Row */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h2>Rooms & Capacity</h2>
          <p>List of all rooms and currently available rooms in your space.</p>
        </div>
        <button className={styles.btnEditRooms} onClick={() => setIsAddingRoom(true)}>
          Edit Rooms
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarRow}>
        <div className={styles.spaceTabs}>
          <button
            className={`${styles.spaceTab} ${activeSpace === "Clinic" ? styles.spaceTabActive : ""}`}
            onClick={() => setActiveSpace("Clinic")}
          >
            Clinic Space
          </button>
          <button
            className={`${styles.spaceTab} ${activeSpace === "Daycare" ? styles.spaceTabActive : ""}`}
            onClick={() => setActiveSpace("Daycare")}
          >
            Daycare Spaces
          </button>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterBox}>
            <label>Room Type</label>
            <select
              className={styles.filterSelect}
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
            >
              <option value="All Rooms">All Rooms</option>
              <option value="Small Room">Small Room</option>
              <option value="Large Room">Large Room</option>
            </select>
          </div>

          <div className={styles.filterBox}>
            <label>Pet Type</label>
            <select
              className={styles.filterSelect}
              value={petTypeFilter}
              onChange={(e) => setPetTypeFilter(e.target.value)}
            >
              <option value="All Pets">All Pets</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>
          </div>

          <div className={styles.filterBox}>
            <label>Occupancy Status</label>
            <div className={styles.occupancyFilter}>
              <div className={styles.occupancyOption} onClick={() => setOccupancyFilter("All")}>
                <span className={`${styles.dot} ${styles.dotAll}`}></span>
                All Rooms
              </div>
              <div className={styles.occupancyOption} onClick={() => setOccupancyFilter("Vacant")}>
                <span className={`${styles.dot} ${styles.dotVacant}`}></span>
                Vacant
              </div>
              <div className={styles.occupancyOption} onClick={() => setOccupancyFilter("Occupied")}>
                <span className={`${styles.dot} ${styles.dotOccupied}`}></span>
                Occupied
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Listing */}
      {filteredRooms.length === 0 ? (
        <div className={styles.areaSection}>
          <div className={styles.emptyState}>
            <h4 className={styles.emptyStateTitle}>No rooms configured yet</h4>
            <p className={styles.emptyStateText}>Designate and allocate your clinic and daycare boarding rooms to track occupancy.</p>
            <button className={styles.btnEditRooms} onClick={() => setIsAddingRoom(true)}>
              Add Room
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CAT ROOMS AREA */}
          {catRooms.length > 0 && (
            <div className={styles.areaSection}>
              <div className={styles.areaHeader} onClick={() => setCatAreaExpanded(!catAreaExpanded)}>
                <div className={styles.areaHeaderLeft}>
                  <span className={styles.areaTitle}>Cat Area - ({catRooms.length})</span>
                  <span className={styles.petBadge}>Cat</span>
                </div>
                <span>{catAreaExpanded ? "▲" : "▼"}</span>
              </div>
              {catAreaExpanded && (
                <div className={styles.areaBody}>
                  {catRooms.map(room => (
                    <div key={room.id} className={styles.roomCard}>
                      <div className={styles.iconBox}>
                        {/* Cat icon SVG */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5c.67 0 1.35.09 2 .26V10M12 5c-.67 0-1.35.09-2 .26V10m2-5a9 9 0 0 1 7.3 14.3l-1.6-1.6m-11.4 0-1.6 1.6A9 9 0 0 1 10 10" />
                          <circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" />
                          <path d="M16 22a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className={styles.roomInfo}>
                        <span className={styles.roomName}>{room.name}</span>
                        <span className={styles.capacityText}>Capacity: {String(room.capacity).padStart(2, "0")}</span>
                        <span className={styles.availableText}>Available: {String(room.available).padStart(2, "0")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOG ROOMS AREA */}
          {dogRooms.length > 0 && (
            <div className={styles.areaSection}>
              <div className={styles.areaHeader} onClick={() => setDogAreaExpanded(!dogAreaExpanded)}>
                <div className={styles.areaHeaderLeft}>
                  <span className={styles.areaTitle}>Dog Area - ({dogRooms.length})</span>
                  <span className={styles.petBadge}>Dog</span>
                </div>
                <span>{dogAreaExpanded ? "▲" : "▼"}</span>
              </div>
              {dogAreaExpanded && (
                <div className={styles.areaBody}>
                  {dogRooms.map(room => (
                    <div key={room.id} className={styles.roomCard}>
                      <div className={styles.iconBox}>
                        {/* Dog icon SVG */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h8" /><path d="M16 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                        </svg>
                      </div>
                      <div className={styles.roomInfo}>
                        <span className={styles.roomName}>{room.name}</span>
                        <span className={styles.capacityText}>Capacity: {String(room.capacity).padStart(2, "0")}</span>
                        <span className={styles.availableText}>Available: {String(room.available).padStart(2, "0")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomsCapacitySettings;
