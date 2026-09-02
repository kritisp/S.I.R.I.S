import { AppState, User, Station, CaseRecord, Evidence, AccessRequest, IntelligenceAlert } from './types';

const stations: Station[] = [
  {
    "id": "OP-BBSR-CAP",
    "name": "Khandagiri Police Station",
    "district": "Khordha",
    "city": "Bhubaneswar",
    "status": "ACTIVE"
  },
  {
    "id": "OP-CTC-CITY",
    "name": "Cuttack City PS",
    "district": "Cuttack",
    "city": "Cuttack",
    "status": "ACTIVE"
  },
  {
    "id": "OP-RKL-CEN",
    "name": "Rourkela Central PS",
    "district": "Sundargarh",
    "city": "Rourkela",
    "status": "ACTIVE"
  },
  {
    "id": "OP-BAM-TWN",
    "name": "Berhampur Town PS",
    "district": "Ganjam",
    "city": "Berhampur",
    "status": "ACTIVE"
  },
  {
    "id": "OP-PURI-TWN",
    "name": "Puri Town PS",
    "district": "Puri",
    "city": "Puri",
    "status": "ACTIVE"
  },
  {
    "id": "OP-SBP-CEN",
    "name": "Sambalpur Central PS",
    "district": "Sambalpur",
    "city": "Sambalpur",
    "status": "ACTIVE"
  },
  {
    "id": "OP-BLS-TOW",
    "name": "Balasore Town PS",
    "district": "Balasore",
    "city": "Balasore",
    "status": "ACTIVE"
  },
  {
    "id": "OP-ANG-CEN",
    "name": "Angul Central PS",
    "district": "Angul",
    "city": "Angul",
    "status": "ACTIVE"
  },
  {
    "id": "OP-JHG-TWN",
    "name": "Jharsuguda Town PS",
    "district": "Jharsuguda",
    "city": "Jharsuguda",
    "status": "ACTIVE"
  },
  {
    "id": "OP-KRP-CEN",
    "name": "Koraput Central PS",
    "district": "Koraput",
    "city": "Koraput",
    "status": "ACTIVE"
  },
  {
    "id": "OP-RYG-TWN",
    "name": "Rayagada Town PS",
    "district": "Rayagada",
    "city": "Rayagada",
    "status": "ACTIVE"
  },
  {
    "id": "OP-JYP-TWN",
    "name": "Jeypore Town PS",
    "district": "Koraput",
    "city": "Jeypore",
    "status": "ACTIVE"
  }
];
const users: User[] = [
  {
    "id": "OP-HQ-001",
    "name": "Comm. Mahapatra",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE",
    "rank": "Commissioner"
  },
  {
    "id": "IIC-BBSR-01",
    "name": "IIC Ramesh",
    "role": "STATION_ADMIN",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-BBSR-001",
    "name": "SI Ranjan Samal",
    "role": "OFFICER",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BBSR-002",
    "name": "SI Ashok Mishra",
    "role": "OFFICER",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BBSR-003",
    "name": "SI Monalisa Dash",
    "role": "OFFICER",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BBSR-004",
    "name": "SI Sanjukta Behera",
    "role": "OFFICER",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BBSR-005",
    "name": "SI Monalisa Mishra",
    "role": "OFFICER",
    "stationId": "OP-BBSR-CAP",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-CTC-01",
    "name": "Insp. Prakash",
    "role": "STATION_ADMIN",
    "stationId": "OP-CTC-CITY",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-CTC-006",
    "name": "SI Sanjukta Sahoo",
    "role": "OFFICER",
    "stationId": "OP-CTC-CITY",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-CTC-007",
    "name": "SI Ramesh Samal",
    "role": "OFFICER",
    "stationId": "OP-CTC-CITY",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-CTC-008",
    "name": "SI Ashok Rout",
    "role": "OFFICER",
    "stationId": "OP-CTC-CITY",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-RKL-01",
    "name": "Insp. Bikash",
    "role": "STATION_ADMIN",
    "stationId": "OP-RKL-CEN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-RKL-009",
    "name": "SI Anil Pradhan",
    "role": "OFFICER",
    "stationId": "OP-RKL-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RKL-010",
    "name": "SI Saroj Rout",
    "role": "OFFICER",
    "stationId": "OP-RKL-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RKL-011",
    "name": "SI Ashok Bhoi",
    "role": "OFFICER",
    "stationId": "OP-RKL-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RKL-012",
    "name": "SI Sanjay Mishra",
    "role": "OFFICER",
    "stationId": "OP-RKL-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-BAM-01",
    "name": "Insp. Sanjay",
    "role": "STATION_ADMIN",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-BAM-013",
    "name": "SI Smita Bhoi",
    "role": "OFFICER",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BAM-014",
    "name": "SI Smita Dash",
    "role": "OFFICER",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BAM-015",
    "name": "SI Subrat Sahoo",
    "role": "OFFICER",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BAM-016",
    "name": "SI Pradeep Patra",
    "role": "OFFICER",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BAM-017",
    "name": "SI Arun Behera",
    "role": "OFFICER",
    "stationId": "OP-BAM-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-PURI-01",
    "name": "Insp. Arun",
    "role": "STATION_ADMIN",
    "stationId": "OP-PURI-TWN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-PURI-018",
    "name": "SI Bikash Behera",
    "role": "OFFICER",
    "stationId": "OP-PURI-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-PURI-019",
    "name": "SI Monalisa Nayak",
    "role": "OFFICER",
    "stationId": "OP-PURI-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-PURI-020",
    "name": "SI Sanjay Swain",
    "role": "OFFICER",
    "stationId": "OP-PURI-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-PURI-021",
    "name": "SI Anil Sahoo",
    "role": "OFFICER",
    "stationId": "OP-PURI-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-SBP-01",
    "name": "Insp. Ranjan",
    "role": "STATION_ADMIN",
    "stationId": "OP-SBP-CEN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-SBP-022",
    "name": "SI Ramesh Pradhan",
    "role": "OFFICER",
    "stationId": "OP-SBP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-SBP-023",
    "name": "SI Ranjan Nayak",
    "role": "OFFICER",
    "stationId": "OP-SBP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-SBP-024",
    "name": "SI Smita Sahoo",
    "role": "OFFICER",
    "stationId": "OP-SBP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-SBP-025",
    "name": "SI Sanjay Bhoi",
    "role": "OFFICER",
    "stationId": "OP-SBP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-BLS-01",
    "name": "Insp. Smita",
    "role": "STATION_ADMIN",
    "stationId": "OP-BLS-TOW",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-BLS-026",
    "name": "SI Ramesh Patra",
    "role": "OFFICER",
    "stationId": "OP-BLS-TOW",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BLS-027",
    "name": "SI Sagar Sahoo",
    "role": "OFFICER",
    "stationId": "OP-BLS-TOW",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BLS-028",
    "name": "SI Bikash Samal",
    "role": "OFFICER",
    "stationId": "OP-BLS-TOW",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-BLS-029",
    "name": "SI Bipin Samal",
    "role": "OFFICER",
    "stationId": "OP-BLS-TOW",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-ANG-01",
    "name": "Insp. Monalisa",
    "role": "STATION_ADMIN",
    "stationId": "OP-ANG-CEN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-ANG-030",
    "name": "SI Monalisa Nayak",
    "role": "OFFICER",
    "stationId": "OP-ANG-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-ANG-031",
    "name": "SI Monalisa Mishra",
    "role": "OFFICER",
    "stationId": "OP-ANG-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-ANG-032",
    "name": "SI Arun Samal",
    "role": "OFFICER",
    "stationId": "OP-ANG-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-ANG-033",
    "name": "SI Anil Pradhan",
    "role": "OFFICER",
    "stationId": "OP-ANG-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-JHG-01",
    "name": "Insp. Rakesh",
    "role": "STATION_ADMIN",
    "stationId": "OP-JHG-TWN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-JHG-034",
    "name": "SI Prakash Pradhan",
    "role": "OFFICER",
    "stationId": "OP-JHG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-JHG-035",
    "name": "SI Bikash Sahoo",
    "role": "OFFICER",
    "stationId": "OP-JHG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-JHG-036",
    "name": "SI Priyanka Samal",
    "role": "OFFICER",
    "stationId": "OP-JHG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-KRP-01",
    "name": "Insp. Suresh",
    "role": "STATION_ADMIN",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-KRP-037",
    "name": "SI Rakesh Rout",
    "role": "OFFICER",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-KRP-038",
    "name": "SI Suresh Rout",
    "role": "OFFICER",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-KRP-039",
    "name": "SI Suresh Bhoi",
    "role": "OFFICER",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-KRP-040",
    "name": "SI Sagar Sahoo",
    "role": "OFFICER",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-KRP-041",
    "name": "SI Sanjukta Behera",
    "role": "OFFICER",
    "stationId": "OP-KRP-CEN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-RYG-01",
    "name": "Insp. Ashok",
    "role": "STATION_ADMIN",
    "stationId": "OP-RYG-TWN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-RYG-042",
    "name": "SI Sagar Patra",
    "role": "OFFICER",
    "stationId": "OP-RYG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RYG-043",
    "name": "SI Bipin Sahoo",
    "role": "OFFICER",
    "stationId": "OP-RYG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RYG-044",
    "name": "SI Sanjukta Patra",
    "role": "OFFICER",
    "stationId": "OP-RYG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-RYG-045",
    "name": "SI Prakash Mohanty",
    "role": "OFFICER",
    "stationId": "OP-RYG-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "IIC-JYP-01",
    "name": "Insp. Priyanka",
    "role": "STATION_ADMIN",
    "stationId": "OP-JYP-TWN",
    "status": "ACTIVE",
    "rank": "Inspector"
  },
  {
    "id": "INV-JYP-046",
    "name": "SI Bikash Swain",
    "role": "OFFICER",
    "stationId": "OP-JYP-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-JYP-047",
    "name": "SI Prakash Nayak",
    "role": "OFFICER",
    "stationId": "OP-JYP-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-JYP-048",
    "name": "SI Prakash Rout",
    "role": "OFFICER",
    "stationId": "OP-JYP-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  },
  {
    "id": "INV-JYP-049",
    "name": "SI Subrat Dash",
    "role": "OFFICER",
    "stationId": "OP-JYP-TWN",
    "status": "ACTIVE",
    "rank": "Sub-Inspector"
  }
];
const cases: CaseRecord[] = [
  {
    "id": "CR-KHD-2026-00142",
    "firNumber": "FIR-2026-0142",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-001",
    "title": "Highway Robbery & Commercial Vehicle Hijack (Khandagiri)",
    "description": "High-priority armed robbery and commercial van theft registered at Khandagiri Police Station. Suspect Rajesh Kumar and accomplices intercepted a delivery van. Vehicle OD-02-AB-1234 was identified on ANPR camera CAM-041.",
    "crimeType": "Armed Robbery",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-21T21:10:00.000Z",
    "entities": [
      {
        "id": "ENT-V-142",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      },
      {
        "id": "ENT-P-142",
        "type": "PERSON",
        "value": "Rajesh Kumar"
      },
      {
        "id": "ENT-L-142",
        "type": "LOCATION",
        "value": "Khandagiri Square, Bhubaneswar"
      }
    ],
    "bnsSections": ["BNS Section 309 (Robbery)", "BNS Section 310 (Dacoity)"],
    "suspects": ["Rajesh Kumar", "Ranga Mohanty"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Khandagiri Square", "Patrapada Bypass"],
    "evidenceRefs": ["ANPR Camera Log CAM-041", "Witness Telemetry"],
    "cctvRefs": ["CAM-041", "CAM-052", "CAM-078", "CAM-103"],
    "linkedCaseIds": ["OD-CTC-2026-00081", "CR-KHD-2026-00541"]
  },
  {
    "id": "OD-CTC-2026-00081",
    "firNumber": "FIR-2026-0081",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-006",
    "title": "Jewelry Store Armed Heist (Badambadi)",
    "description": "Armed robbery at a jewelry store in Cuttack. Suspects fled towards Bhubaneswar in a white commercial van matching vehicle plate OD-02-AB-1234.",
    "crimeType": "Armed Robbery",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-18T18:48:17.920Z",
    "entities": [
      {
        "id": "ENT-V-81",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      },
      {
        "id": "ENT-P-81",
        "type": "PERSON",
        "value": "Rajesh Kumar"
      }
    ],
    "bnsSections": ["BNS Section 309 (Robbery)"],
    "suspects": ["Rajesh Kumar", "Kalia Patra"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Badambadi Market", "Link Road"],
    "evidenceRefs": ["CCTV Footage Cam 1", "Fingerprint Scan"],
    "cctvRefs": ["CAM-103"],
    "linkedCaseIds": ["CR-KHD-2026-00142", "CR-KHD-2026-00541"]
  },

  {
    "id": "CR-KHD-2026-00504",
    "firNumber": "FIR 504",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-001",
    "title": "Residential Burglary (Unit IV)",
    "description": "Burglary investigation registered at Khandagiri Police Station. Night-time forced entry, jewelry and electronics stolen. Suspects fled in a white commercial van.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-21T11:00:00.000Z",
    "entities": [
      {
        "id": "ENT-V-504",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      },
      {
        "id": "ENT-P-504",
        "type": "PHONE",
        "value": "+91-9876543210"
      },
      {
        "id": "ENT-L-504",
        "type": "LOCATION",
        "value": "Unit IV, Bhubaneswar"
      }
    ],
    "bnsSections": ["BNS Section 305 (Theft in dwelling house)", "BNS Section 331 (House-trespass)"],
    "suspects": ["Ranga Mohanty", "Kalia Patra"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Unit IV Market", "Khandagiri"],
    "evidenceRefs": ["CCTV Feed Cam 2", "Recovered Phone CDR"],
    "cctvRefs": ["Unit IV Junction Cam 1"],
    "linkedCaseIds": ["OD-CTC-2026-00981", "OD-BBSR-2026-0001", "CR-KHD-2026-00541"]
  },
  {
    "id": "CR-KHD-2026-00541",
    "firNumber": "FIR 541",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-001",
    "title": "Vehicle Theft (Khandagiri)",
    "description": "Reported theft of a white commercial van from Khandagiri Junction. An organized gang is suspected to have operated the lifter ring.",
    "crimeType": "Vehicle Theft",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-20T10:00:00.000Z",
    "entities": [
      {
        "id": "ENT-V-541",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ],
    "bnsSections": ["BNS Section 303 (Theft)", "BNS Section 317"],
    "suspects": ["Ranga Mohanty", "Sibu Jena"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Khandagiri Junction", "Patrapada"],
    "evidenceRefs": ["GPS Tracker Log", "Tire Track Plasters"],
    "cctvRefs": ["Patrapada Camera 4"],
    "linkedCaseIds": ["OD-CTC-2026-00981", "OD-BBSR-2026-0001"]
  },
  {
    "id": "OD-CTC-2026-00981",
    "firNumber": "FIR-2026-CTC-00981",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-006",
    "title": "Jewelry Store Armed Heist (Badambadi)",
    "description": "Armed robbery at a jewelry store in Cuttack. Suspects fled in a white van.",
    "crimeType": "Armed Robbery",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-18T18:48:17.920Z",
    "entities": [
      {
        "id": "ENT-V-HERO",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      },
      {
        "id": "ENT-P-HERO",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ],
    "bnsSections": ["BNS Section 309 (Robbery)", "BNS Section 310"],
    "suspects": ["Ranga Mohanty", "Kalia Patra"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Badambadi Market", "Link Road"],
    "evidenceRefs": ["Recovered Jewelry Bag", "CCTV Footage"],
    "cctvRefs": ["Badambadi Square Cam 1"],
    "linkedCaseIds": ["CR-KHD-2026-00541", "OD-BBSR-2026-0001"]
  },
  {
    "id": "OD-BBSR-2026-0001",
    "firNumber": "FIR-2026-BBSR-0001",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-001",
    "title": "High-Value Commercial Burglary (Unit IV)",
    "description": "Electronic goods stolen from a warehouse at night. Suspects disabled CCTV. One partial vehicle plate found in neighboring camera.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-20T18:48:17.920Z",
    "entities": [
      {
        "id": "ENT-V-HERO",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ],
    "bnsSections": ["BNS Section 305 (Burglary)"],
    "suspects": ["Sibu Jena", "Mantu Sahoo"],
    "vehicles": ["OD-02-AB-1234"],
    "locations": ["Unit IV Commercial Block"],
    "evidenceRefs": ["Lock-pick Tools", "Footprint Dusting"],
    "cctvRefs": ["Unit IV Lane 2 Cam"],
    "linkedCaseIds": ["CR-KHD-2026-00541", "OD-CTC-2026-00981"]
  },
  {
    "id": "OD-BBSR-2026-0001",
    "firNumber": "FIR-2026-BBSR-0001",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-002",
    "title": "Theft in Khordha",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-12T21:02:07.046Z",
    "entities": [
      {
        "id": "ENT-V-1",
        "type": "VEHICLE",
        "value": "OD-28-XX-1866"
      }
    ]
  },
  {
    "id": "OD-BBSR-2026-0002",
    "firNumber": "FIR-2026-BBSR-0002",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-003",
    "title": "Cyber Crime in Khordha",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-03T20:40:55.140Z",
    "entities": [
      {
        "id": "ENT-V-2",
        "type": "VEHICLE",
        "value": "OD-08-XX-9705"
      }
    ]
  },
  {
    "id": "OD-BBSR-2026-0003",
    "firNumber": "FIR-2026-BBSR-0003",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-002",
    "title": "Theft in Khordha",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "CLOSED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-04T04:31:37.870Z",
    "entities": [
      {
        "id": "ENT-V-3",
        "type": "VEHICLE",
        "value": "OD-17-XX-7224"
      }
    ]
  },
  {
    "id": "OD-BBSR-2026-0004",
    "firNumber": "FIR-2026-BBSR-0004",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-003",
    "title": "Cyber Crime in Khordha",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-07-29T03:15:24.384Z",
    "entities": [
      {
        "id": "ENT-V-4",
        "type": "VEHICLE",
        "value": "OD-22-XX-9052"
      }
    ]
  },
  {
    "id": "OD-BBSR-2026-0005",
    "firNumber": "FIR-2026-BBSR-0005",
    "stationId": "OP-BBSR-CAP",
    "investigatorId": "INV-BBSR-002",
    "title": "Fraud in Khordha",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "CLOSED",
    "priority": "HIGH",
    "createdAt": "2026-07-27T16:12:00.582Z",
    "entities": [
      {
        "id": "ENT-V-5",
        "type": "VEHICLE",
        "value": "OD-23-XX-7400"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0006",
    "firNumber": "FIR-2026-CTC-0006",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-006",
    "title": "Extortion in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-06T04:53:11.741Z",
    "entities": [
      {
        "id": "ENT-V-6",
        "type": "VEHICLE",
        "value": "OD-28-XX-5067"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0007",
    "firNumber": "FIR-2026-CTC-0007",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-006",
    "title": "Extortion in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-15T01:47:20.865Z",
    "entities": [
      {
        "id": "ENT-V-7",
        "type": "VEHICLE",
        "value": "OD-08-XX-4048"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0008",
    "firNumber": "FIR-2026-CTC-0008",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-007",
    "title": "Burglary in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-24T21:01:51.069Z",
    "entities": [
      {
        "id": "ENT-V-8",
        "type": "VEHICLE",
        "value": "OD-08-XX-2289"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0009",
    "firNumber": "FIR-2026-CTC-0009",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-006",
    "title": "Theft in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-08T12:09:04.931Z",
    "entities": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0010",
    "firNumber": "FIR-2026-CTC-0010",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-008",
    "title": "Assault in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "SOLVED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-11T15:34:30.038Z",
    "entities": [
      {
        "id": "ENT-V-10",
        "type": "VEHICLE",
        "value": "OD-20-XX-7200"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0011",
    "firNumber": "FIR-2026-CTC-0011",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-007",
    "title": "Theft in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "SOLVED",
    "priority": "MEDIUM",
    "createdAt": "2026-08-02T18:21:31.578Z",
    "entities": [
      {
        "id": "ENT-V-11",
        "type": "VEHICLE",
        "value": "OD-02-XX-4658"
      }
    ]
  },
  {
    "id": "OD-CTC-2026-0012",
    "firNumber": "FIR-2026-CTC-0012",
    "stationId": "OP-CTC-CITY",
    "investigatorId": "INV-CTC-007",
    "title": "Extortion in Cuttack",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-01T06:43:07.663Z",
    "entities": [
      {
        "id": "ENT-V-12",
        "type": "VEHICLE",
        "value": "OD-19-XX-2674"
      }
    ]
  },
  {
    "id": "OD-RKL-2026-0013",
    "firNumber": "FIR-2026-RKL-0013",
    "stationId": "OP-RKL-CEN",
    "investigatorId": "INV-RKL-012",
    "title": "Missing Person in Sundargarh",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "SOLVED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-05T13:38:38.705Z",
    "entities": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "OD-RKL-2026-0014",
    "firNumber": "FIR-2026-RKL-0014",
    "stationId": "OP-RKL-CEN",
    "investigatorId": "INV-RKL-009",
    "title": "Cyber Crime in Sundargarh",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "CLOSED",
    "priority": "LOW",
    "createdAt": "2026-07-30T06:25:47.411Z",
    "entities": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "OD-RKL-2026-0015",
    "firNumber": "FIR-2026-RKL-0015",
    "stationId": "OP-RKL-CEN",
    "investigatorId": "INV-RKL-011",
    "title": "Narcotics in Sundargarh",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-07-28T17:54:42.808Z",
    "entities": [
      {
        "id": "ENT-V-15",
        "type": "VEHICLE",
        "value": "OD-10-XX-4504"
      }
    ]
  },
  {
    "id": "OD-RKL-2026-0016",
    "firNumber": "FIR-2026-RKL-0016",
    "stationId": "OP-RKL-CEN",
    "investigatorId": "INV-RKL-011",
    "title": "Assault in Sundargarh",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "CLOSED",
    "priority": "MEDIUM",
    "createdAt": "2026-07-30T17:17:15.457Z",
    "entities": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0017",
    "firNumber": "FIR-2026-BAM-0017",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-017",
    "title": "Extortion in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "CLOSED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-14T22:57:33.544Z",
    "entities": [
      {
        "id": "ENT-V-17",
        "type": "VEHICLE",
        "value": "OD-08-XX-2425"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0018",
    "firNumber": "FIR-2026-BAM-0018",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-013",
    "title": "Missing Person in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-03T12:58:01.477Z",
    "entities": [
      {
        "id": "ENT-V-18",
        "type": "VEHICLE",
        "value": "OD-04-XX-7563"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0019",
    "firNumber": "FIR-2026-BAM-0019",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-014",
    "title": "Narcotics in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-19T02:06:10.529Z",
    "entities": [
      {
        "id": "ENT-V-19",
        "type": "VEHICLE",
        "value": "OD-18-XX-2744"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0020",
    "firNumber": "FIR-2026-BAM-0020",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-014",
    "title": "Theft in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-19T02:33:45.266Z",
    "entities": [
      {
        "id": "ENT-V-20",
        "type": "VEHICLE",
        "value": "OD-07-XX-8314"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0021",
    "firNumber": "FIR-2026-BAM-0021",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-017",
    "title": "Burglary in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-07-31T14:57:28.423Z",
    "entities": [
      {
        "id": "ENT-V-21",
        "type": "VEHICLE",
        "value": "OD-21-XX-5549"
      }
    ]
  },
  {
    "id": "OD-BAM-2026-0022",
    "firNumber": "FIR-2026-BAM-0022",
    "stationId": "OP-BAM-TWN",
    "investigatorId": "INV-BAM-015",
    "title": "Theft in Ganjam",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "SOLVED",
    "priority": "MEDIUM",
    "createdAt": "2026-08-14T11:54:59.597Z",
    "entities": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "OD-PURI-2026-0023",
    "firNumber": "FIR-2026-PURI-0023",
    "stationId": "OP-PURI-TWN",
    "investigatorId": "INV-PURI-021",
    "title": "Burglary in Puri",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "CLOSED",
    "priority": "HIGH",
    "createdAt": "2026-08-06T15:36:26.645Z",
    "entities": [
      {
        "id": "ENT-P-02",
        "type": "PHONE",
        "value": "+91-9999988888"
      }
    ]
  },
  {
    "id": "OD-PURI-2026-0024",
    "firNumber": "FIR-2026-PURI-0024",
    "stationId": "OP-PURI-TWN",
    "investigatorId": "INV-PURI-019",
    "title": "Assault in Puri",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-03T06:00:24.472Z",
    "entities": [
      {
        "id": "ENT-V-24",
        "type": "VEHICLE",
        "value": "OD-26-XX-3718"
      }
    ]
  },
  {
    "id": "OD-PURI-2026-0025",
    "firNumber": "FIR-2026-PURI-0025",
    "stationId": "OP-PURI-TWN",
    "investigatorId": "INV-PURI-019",
    "title": "Narcotics in Puri",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-15T02:38:39.675Z",
    "entities": [
      {
        "id": "ENT-V-25",
        "type": "VEHICLE",
        "value": "OD-20-XX-7094"
      }
    ]
  },
  {
    "id": "OD-PURI-2026-0026",
    "firNumber": "FIR-2026-PURI-0026",
    "stationId": "OP-PURI-TWN",
    "investigatorId": "INV-PURI-020",
    "title": "Extortion in Puri",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-08-10T10:54:26.167Z",
    "entities": [
      {
        "id": "ENT-V-26",
        "type": "VEHICLE",
        "value": "OD-05-XX-9750"
      }
    ]
  },
  {
    "id": "OD-PURI-2026-0027",
    "firNumber": "FIR-2026-PURI-0027",
    "stationId": "OP-PURI-TWN",
    "investigatorId": "INV-PURI-019",
    "title": "Fraud in Puri",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-02T14:52:48.391Z",
    "entities": [
      {
        "id": "ENT-V-27",
        "type": "VEHICLE",
        "value": "OD-03-XX-1752"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0028",
    "firNumber": "FIR-2026-SBP-0028",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-023",
    "title": "Narcotics in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-27T11:56:28.387Z",
    "entities": [
      {
        "id": "ENT-V-28",
        "type": "VEHICLE",
        "value": "OD-20-XX-8059"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0029",
    "firNumber": "FIR-2026-SBP-0029",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-024",
    "title": "Extortion in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-07-29T23:41:07.947Z",
    "entities": [
      {
        "id": "ENT-V-02",
        "type": "VEHICLE",
        "value": "OD-05-XY-7777"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0030",
    "firNumber": "FIR-2026-SBP-0030",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-025",
    "title": "Fraud in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-11T06:05:08.177Z",
    "entities": [
      {
        "id": "ENT-V-30",
        "type": "VEHICLE",
        "value": "OD-18-XX-8044"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0031",
    "firNumber": "FIR-2026-SBP-0031",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-022",
    "title": "Burglary in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-07-27T04:46:46.029Z",
    "entities": [
      {
        "id": "ENT-V-31",
        "type": "VEHICLE",
        "value": "OD-03-XX-8553"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0032",
    "firNumber": "FIR-2026-SBP-0032",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-022",
    "title": "Extortion in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "CLOSED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-04T00:26:52.438Z",
    "entities": [
      {
        "id": "ENT-V-32",
        "type": "VEHICLE",
        "value": "OD-17-XX-8005"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0033",
    "firNumber": "FIR-2026-SBP-0033",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-022",
    "title": "Burglary in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-07-30T22:13:40.985Z",
    "entities": [
      {
        "id": "ENT-V-33",
        "type": "VEHICLE",
        "value": "OD-15-XX-9668"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0034",
    "firNumber": "FIR-2026-SBP-0034",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-023",
    "title": "Narcotics in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-07-30T11:07:16.452Z",
    "entities": [
      {
        "id": "ENT-V-34",
        "type": "VEHICLE",
        "value": "OD-29-XX-2062"
      }
    ]
  },
  {
    "id": "OD-SBP-2026-0035",
    "firNumber": "FIR-2026-SBP-0035",
    "stationId": "OP-SBP-CEN",
    "investigatorId": "INV-SBP-024",
    "title": "Burglary in Sambalpur",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-02T16:48:39.859Z",
    "entities": [
      {
        "id": "ENT-V-35",
        "type": "VEHICLE",
        "value": "OD-20-XX-9600"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0036",
    "firNumber": "FIR-2026-BLS-0036",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-027",
    "title": "Cyber Crime in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-09T00:23:44.133Z",
    "entities": [
      {
        "id": "ENT-V-36",
        "type": "VEHICLE",
        "value": "OD-00-XX-6570"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0037",
    "firNumber": "FIR-2026-BLS-0037",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-026",
    "title": "Cyber Crime in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-10T14:30:11.007Z",
    "entities": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0038",
    "firNumber": "FIR-2026-BLS-0038",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-029",
    "title": "Cyber Crime in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "SOLVED",
    "priority": "MEDIUM",
    "createdAt": "2026-07-23T11:58:33.147Z",
    "entities": [
      {
        "id": "ENT-V-38",
        "type": "VEHICLE",
        "value": "OD-02-XX-7710"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0039",
    "firNumber": "FIR-2026-BLS-0039",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-028",
    "title": "Burglary in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-07T14:35:23.211Z",
    "entities": [
      {
        "id": "ENT-V-39",
        "type": "VEHICLE",
        "value": "OD-28-XX-1495"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0040",
    "firNumber": "FIR-2026-BLS-0040",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-029",
    "title": "Theft in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-01T16:07:31.684Z",
    "entities": [
      {
        "id": "ENT-V-40",
        "type": "VEHICLE",
        "value": "OD-22-XX-5863"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0041",
    "firNumber": "FIR-2026-BLS-0041",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-027",
    "title": "Extortion in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-07-28T09:31:34.088Z",
    "entities": [
      {
        "id": "ENT-V-41",
        "type": "VEHICLE",
        "value": "OD-21-XX-2009"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0042",
    "firNumber": "FIR-2026-BLS-0042",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-029",
    "title": "Missing Person in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-08-17T12:43:44.848Z",
    "entities": [
      {
        "id": "ENT-V-42",
        "type": "VEHICLE",
        "value": "OD-27-XX-1856"
      }
    ]
  },
  {
    "id": "OD-BLS-2026-0043",
    "firNumber": "FIR-2026-BLS-0043",
    "stationId": "OP-BLS-TOW",
    "investigatorId": "INV-BLS-029",
    "title": "Fraud in Balasore",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "CLOSED",
    "priority": "MEDIUM",
    "createdAt": "2026-07-23T13:56:57.142Z",
    "entities": [
      {
        "id": "ENT-V-01",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0044",
    "firNumber": "FIR-2026-ANG-0044",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-031",
    "title": "Burglary in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-12T15:33:40.828Z",
    "entities": [
      {
        "id": "ENT-V-01",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0045",
    "firNumber": "FIR-2026-ANG-0045",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-032",
    "title": "Assault in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-07-31T14:54:29.133Z",
    "entities": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0046",
    "firNumber": "FIR-2026-ANG-0046",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-032",
    "title": "Cyber Crime in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-30T09:22:19.502Z",
    "entities": [
      {
        "id": "ENT-V-46",
        "type": "VEHICLE",
        "value": "OD-27-XX-1951"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0047",
    "firNumber": "FIR-2026-ANG-0047",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-032",
    "title": "Fraud in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-08-11T11:39:40.532Z",
    "entities": [
      {
        "id": "ENT-V-47",
        "type": "VEHICLE",
        "value": "OD-18-XX-7940"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0048",
    "firNumber": "FIR-2026-ANG-0048",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-033",
    "title": "Missing Person in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "SOLVED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-12T12:58:37.505Z",
    "entities": [
      {
        "id": "ENT-V-48",
        "type": "VEHICLE",
        "value": "OD-21-XX-6642"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0049",
    "firNumber": "FIR-2026-ANG-0049",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-031",
    "title": "Theft in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-15T20:22:22.524Z",
    "entities": [
      {
        "id": "ENT-V-49",
        "type": "VEHICLE",
        "value": "OD-08-XX-8840"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0050",
    "firNumber": "FIR-2026-ANG-0050",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-032",
    "title": "Theft in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-07-24T07:48:21.423Z",
    "entities": [
      {
        "id": "ENT-V-50",
        "type": "VEHICLE",
        "value": "OD-15-XX-2752"
      }
    ]
  },
  {
    "id": "OD-ANG-2026-0051",
    "firNumber": "FIR-2026-ANG-0051",
    "stationId": "OP-ANG-CEN",
    "investigatorId": "INV-ANG-031",
    "title": "Theft in Angul",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-07-30T20:31:02.335Z",
    "entities": [
      {
        "id": "ENT-V-02",
        "type": "VEHICLE",
        "value": "OD-05-XY-7777"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0052",
    "firNumber": "FIR-2026-JHG-0052",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-036",
    "title": "Extortion in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "SOLVED",
    "priority": "HIGH",
    "createdAt": "2026-07-25T09:56:24.568Z",
    "entities": [
      {
        "id": "ENT-V-52",
        "type": "VEHICLE",
        "value": "OD-06-XX-4398"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0053",
    "firNumber": "FIR-2026-JHG-0053",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-035",
    "title": "Missing Person in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-04T05:18:27.933Z",
    "entities": [
      {
        "id": "ENT-P-02",
        "type": "PHONE",
        "value": "+91-9999988888"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0054",
    "firNumber": "FIR-2026-JHG-0054",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-036",
    "title": "Extortion in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-13T09:31:04.869Z",
    "entities": [
      {
        "id": "ENT-V-54",
        "type": "VEHICLE",
        "value": "OD-08-XX-2254"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0055",
    "firNumber": "FIR-2026-JHG-0055",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-035",
    "title": "Missing Person in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-07-26T09:36:14.854Z",
    "entities": [
      {
        "id": "ENT-V-55",
        "type": "VEHICLE",
        "value": "OD-00-XX-9006"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0056",
    "firNumber": "FIR-2026-JHG-0056",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-034",
    "title": "Narcotics in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "SOLVED",
    "priority": "HIGH",
    "createdAt": "2026-08-01T21:07:33.493Z",
    "entities": [
      {
        "id": "ENT-V-56",
        "type": "VEHICLE",
        "value": "OD-25-XX-3792"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0057",
    "firNumber": "FIR-2026-JHG-0057",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-034",
    "title": "Fraud in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-24T15:11:14.678Z",
    "entities": [
      {
        "id": "ENT-V-57",
        "type": "VEHICLE",
        "value": "OD-17-XX-5080"
      }
    ]
  },
  {
    "id": "OD-JHG-2026-0058",
    "firNumber": "FIR-2026-JHG-0058",
    "stationId": "OP-JHG-TWN",
    "investigatorId": "INV-JHG-036",
    "title": "Missing Person in Jharsuguda",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Narcotics",
    "status": "SOLVED",
    "priority": "HIGH",
    "createdAt": "2026-08-10T23:58:39.943Z",
    "entities": [
      {
        "id": "ENT-V-58",
        "type": "VEHICLE",
        "value": "OD-06-XX-3242"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0059",
    "firNumber": "FIR-2026-KRP-0059",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-041",
    "title": "Narcotics in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-28T14:45:08.401Z",
    "entities": [
      {
        "id": "ENT-V-59",
        "type": "VEHICLE",
        "value": "OD-00-XX-7288"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0060",
    "firNumber": "FIR-2026-KRP-0060",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-041",
    "title": "Extortion in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Missing Person",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-08-14T16:24:07.014Z",
    "entities": [
      {
        "id": "ENT-V-60",
        "type": "VEHICLE",
        "value": "OD-06-XX-2621"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0061",
    "firNumber": "FIR-2026-KRP-0061",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-038",
    "title": "Theft in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "SOLVED",
    "priority": "LOW",
    "createdAt": "2026-07-30T09:16:00.875Z",
    "entities": [
      {
        "id": "ENT-V-61",
        "type": "VEHICLE",
        "value": "OD-24-XX-7628"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0062",
    "firNumber": "FIR-2026-KRP-0062",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-039",
    "title": "Theft in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-20T03:49:46.653Z",
    "entities": [
      {
        "id": "ENT-V-62",
        "type": "VEHICLE",
        "value": "OD-27-XX-8683"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0063",
    "firNumber": "FIR-2026-KRP-0063",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-037",
    "title": "Assault in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-30T20:35:16.167Z",
    "entities": [
      {
        "id": "ENT-V-63",
        "type": "VEHICLE",
        "value": "OD-13-XX-1337"
      }
    ]
  },
  {
    "id": "OD-KRP-2026-0064",
    "firNumber": "FIR-2026-KRP-0064",
    "stationId": "OP-KRP-CEN",
    "investigatorId": "INV-KRP-041",
    "title": "Burglary in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Theft",
    "status": "CLOSED",
    "priority": "HIGH",
    "createdAt": "2026-08-06T04:55:07.129Z",
    "entities": [
      {
        "id": "ENT-V-64",
        "type": "VEHICLE",
        "value": "OD-25-XX-8509"
      }
    ]
  },
  {
    "id": "OD-RYG-2026-0065",
    "firNumber": "FIR-2026-RYG-0065",
    "stationId": "OP-RYG-TWN",
    "investigatorId": "INV-RYG-045",
    "title": "Narcotics in Rayagada",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "SOLVED",
    "priority": "MEDIUM",
    "createdAt": "2026-07-21T19:49:29.001Z",
    "entities": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "OD-RYG-2026-0066",
    "firNumber": "FIR-2026-RYG-0066",
    "stationId": "OP-RYG-TWN",
    "investigatorId": "INV-RYG-044",
    "title": "Missing Person in Rayagada",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-07-23T05:46:47.016Z",
    "entities": [
      {
        "id": "ENT-V-66",
        "type": "VEHICLE",
        "value": "OD-11-XX-2005"
      }
    ]
  },
  {
    "id": "OD-RYG-2026-0067",
    "firNumber": "FIR-2026-RYG-0067",
    "stationId": "OP-RYG-TWN",
    "investigatorId": "INV-RYG-045",
    "title": "Narcotics in Rayagada",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Cyber Crime",
    "status": "INVESTIGATING",
    "priority": "HIGH",
    "createdAt": "2026-08-14T20:04:40.441Z",
    "entities": [
      {
        "id": "ENT-V-67",
        "type": "VEHICLE",
        "value": "OD-28-XX-8824"
      }
    ]
  },
  {
    "id": "OD-RYG-2026-0068",
    "firNumber": "FIR-2026-RYG-0068",
    "stationId": "OP-RYG-TWN",
    "investigatorId": "INV-RYG-043",
    "title": "Missing Person in Rayagada",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "MEDIUM",
    "createdAt": "2026-07-26T16:48:27.367Z",
    "entities": [
      {
        "id": "ENT-V-68",
        "type": "VEHICLE",
        "value": "OD-06-XX-7689"
      }
    ]
  },
  {
    "id": "OD-RYG-2026-0069",
    "firNumber": "FIR-2026-RYG-0069",
    "stationId": "OP-RYG-TWN",
    "investigatorId": "INV-RYG-043",
    "title": "Missing Person in Rayagada",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "CLOSED",
    "priority": "MEDIUM",
    "createdAt": "2026-08-07T18:25:19.381Z",
    "entities": [
      {
        "id": "ENT-V-69",
        "type": "VEHICLE",
        "value": "OD-27-XX-1138"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0070",
    "firNumber": "FIR-2026-JYP-0070",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-048",
    "title": "Assault in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-14T06:19:31.783Z",
    "entities": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0071",
    "firNumber": "FIR-2026-JYP-0071",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-047",
    "title": "Narcotics in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "CLOSED",
    "priority": "CRITICAL",
    "createdAt": "2026-08-07T21:54:56.414Z",
    "entities": [
      {
        "id": "ENT-V-71",
        "type": "VEHICLE",
        "value": "OD-21-XX-6626"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0072",
    "firNumber": "FIR-2026-JYP-0072",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-048",
    "title": "Missing Person in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Assault",
    "status": "CLOSED",
    "priority": "HIGH",
    "createdAt": "2026-07-25T01:35:46.153Z",
    "entities": [
      {
        "id": "ENT-V-02",
        "type": "VEHICLE",
        "value": "OD-05-XY-7777"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0073",
    "firNumber": "FIR-2026-JYP-0073",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-048",
    "title": "Narcotics in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Fraud",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-08-18T05:03:33.559Z",
    "entities": [
      {
        "id": "ENT-V-73",
        "type": "VEHICLE",
        "value": "OD-23-XX-5579"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0074",
    "firNumber": "FIR-2026-JYP-0074",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-046",
    "title": "Fraud in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Extortion",
    "status": "INVESTIGATING",
    "priority": "CRITICAL",
    "createdAt": "2026-08-07T10:40:49.930Z",
    "entities": [
      {
        "id": "ENT-P-02",
        "type": "PHONE",
        "value": "+91-9999988888"
      }
    ]
  },
  {
    "id": "OD-JYP-2026-0075",
    "firNumber": "FIR-2026-JYP-0075",
    "stationId": "OP-JYP-TWN",
    "investigatorId": "INV-JYP-047",
    "title": "Theft in Koraput",
    "description": "Reported incident being investigated by assigned officer. Standard protocols are in effect. Witness statements and preliminary evidence collected.",
    "crimeType": "Burglary",
    "status": "INVESTIGATING",
    "priority": "LOW",
    "createdAt": "2026-07-31T20:08:47.955Z",
    "entities": [
      {
        "id": "ENT-V-75",
        "type": "VEHICLE",
        "value": "OD-01-XX-2329"
      }
    ]
  }
];
const evidence: Evidence[] = [
  {
    "id": "EV-BBSR-1",
    "caseId": "OD-BBSR-2026-0001",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-17T04:44:55.106Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-1",
        "type": "VEHICLE",
        "value": "OD-28-XX-1866"
      }
    ]
  },
  {
    "id": "EV-BBSR-4",
    "caseId": "OD-BBSR-2026-0004",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-12T05:33:05.402Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-4",
        "type": "VEHICLE",
        "value": "OD-22-XX-9052"
      }
    ]
  },
  {
    "id": "EV-BBSR-5",
    "caseId": "OD-BBSR-2026-0005",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-14T07:49:25.960Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-5",
        "type": "VEHICLE",
        "value": "OD-23-XX-7400"
      }
    ]
  },
  {
    "id": "EV-CTC-9",
    "caseId": "OD-CTC-2026-0009",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-18T17:47:55.856Z",
    "entitiesExtracted": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "EV-CTC-10",
    "caseId": "OD-CTC-2026-0010",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-14T23:16:26.983Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-10",
        "type": "VEHICLE",
        "value": "OD-20-XX-7200"
      }
    ]
  },
  {
    "id": "EV-CTC-12",
    "caseId": "OD-CTC-2026-0012",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-16T04:18:11.210Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-12",
        "type": "VEHICLE",
        "value": "OD-19-XX-2674"
      }
    ]
  },
  {
    "id": "EV-RKL-14",
    "caseId": "OD-RKL-2026-0014",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-15T16:07:54.636Z",
    "entitiesExtracted": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "EV-RKL-15",
    "caseId": "OD-RKL-2026-0015",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-16T15:39:58.214Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-15",
        "type": "VEHICLE",
        "value": "OD-10-XX-4504"
      }
    ]
  },
  {
    "id": "EV-RKL-16",
    "caseId": "OD-RKL-2026-0016",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-20T16:04:56.522Z",
    "entitiesExtracted": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "EV-BAM-17",
    "caseId": "OD-BAM-2026-0017",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-14T20:56:06.957Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-17",
        "type": "VEHICLE",
        "value": "OD-08-XX-2425"
      }
    ]
  },
  {
    "id": "EV-BAM-20",
    "caseId": "OD-BAM-2026-0020",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-19T16:15:38.676Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-20",
        "type": "VEHICLE",
        "value": "OD-07-XX-8314"
      }
    ]
  },
  {
    "id": "EV-BAM-22",
    "caseId": "OD-BAM-2026-0022",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-20T17:48:35.609Z",
    "entitiesExtracted": [
      {
        "id": "ENT-P-01",
        "type": "PHONE",
        "value": "+91-9876543210"
      }
    ]
  },
  {
    "id": "EV-PURI-24",
    "caseId": "OD-PURI-2026-0024",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-14T04:45:34.909Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-24",
        "type": "VEHICLE",
        "value": "OD-26-XX-3718"
      }
    ]
  },
  {
    "id": "EV-PURI-26",
    "caseId": "OD-PURI-2026-0026",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-19T17:57:06.639Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-26",
        "type": "VEHICLE",
        "value": "OD-05-XX-9750"
      }
    ]
  },
  {
    "id": "EV-PURI-27",
    "caseId": "OD-PURI-2026-0027",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-18T20:55:47.526Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-27",
        "type": "VEHICLE",
        "value": "OD-03-XX-1752"
      }
    ]
  },
  {
    "id": "EV-SBP-29",
    "caseId": "OD-SBP-2026-0029",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-20T01:35:01.966Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-02",
        "type": "VEHICLE",
        "value": "OD-05-XY-7777"
      }
    ]
  },
  {
    "id": "EV-SBP-30",
    "caseId": "OD-SBP-2026-0030",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-11T12:32:06.549Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-30",
        "type": "VEHICLE",
        "value": "OD-18-XX-8044"
      }
    ]
  },
  {
    "id": "EV-SBP-34",
    "caseId": "OD-SBP-2026-0034",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-15T02:48:54.661Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-34",
        "type": "VEHICLE",
        "value": "OD-29-XX-2062"
      }
    ]
  },
  {
    "id": "EV-SBP-35",
    "caseId": "OD-SBP-2026-0035",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-16T21:56:26.077Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-35",
        "type": "VEHICLE",
        "value": "OD-20-XX-9600"
      }
    ]
  },
  {
    "id": "EV-BLS-36",
    "caseId": "OD-BLS-2026-0036",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-18T21:38:40.580Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-36",
        "type": "VEHICLE",
        "value": "OD-00-XX-6570"
      }
    ]
  },
  {
    "id": "EV-BLS-38",
    "caseId": "OD-BLS-2026-0038",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-12T09:22:35.511Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-38",
        "type": "VEHICLE",
        "value": "OD-02-XX-7710"
      }
    ]
  },
  {
    "id": "EV-BLS-39",
    "caseId": "OD-BLS-2026-0039",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-18T21:39:14.737Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-39",
        "type": "VEHICLE",
        "value": "OD-28-XX-1495"
      }
    ]
  },
  {
    "id": "EV-BLS-42",
    "caseId": "OD-BLS-2026-0042",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-20T14:26:51.454Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-42",
        "type": "VEHICLE",
        "value": "OD-27-XX-1856"
      }
    ]
  },
  {
    "id": "EV-BLS-43",
    "caseId": "OD-BLS-2026-0043",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-18T22:57:41.509Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-01",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ]
  },
  {
    "id": "EV-ANG-44",
    "caseId": "OD-ANG-2026-0044",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-12T00:56:06.865Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-01",
        "type": "VEHICLE",
        "value": "OD-02-AB-1234"
      }
    ]
  },
  {
    "id": "EV-ANG-46",
    "caseId": "OD-ANG-2026-0046",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-16T19:57:48.385Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-46",
        "type": "VEHICLE",
        "value": "OD-27-XX-1951"
      }
    ]
  },
  {
    "id": "EV-ANG-48",
    "caseId": "OD-ANG-2026-0048",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-17T15:58:22.254Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-48",
        "type": "VEHICLE",
        "value": "OD-21-XX-6642"
      }
    ]
  },
  {
    "id": "EV-ANG-50",
    "caseId": "OD-ANG-2026-0050",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-18T05:04:41.584Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-50",
        "type": "VEHICLE",
        "value": "OD-15-XX-2752"
      }
    ]
  },
  {
    "id": "EV-JHG-56",
    "caseId": "OD-JHG-2026-0056",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-13T00:37:24.180Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-56",
        "type": "VEHICLE",
        "value": "OD-25-XX-3792"
      }
    ]
  },
  {
    "id": "EV-JHG-57",
    "caseId": "OD-JHG-2026-0057",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-15T07:58:12.794Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-57",
        "type": "VEHICLE",
        "value": "OD-17-XX-5080"
      }
    ]
  },
  {
    "id": "EV-JHG-58",
    "caseId": "OD-JHG-2026-0058",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-14T23:40:47.914Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-58",
        "type": "VEHICLE",
        "value": "OD-06-XX-3242"
      }
    ]
  },
  {
    "id": "EV-KRP-59",
    "caseId": "OD-KRP-2026-0059",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-12T04:34:10.965Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-59",
        "type": "VEHICLE",
        "value": "OD-00-XX-7288"
      }
    ]
  },
  {
    "id": "EV-KRP-60",
    "caseId": "OD-KRP-2026-0060",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-18T01:48:04.857Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-60",
        "type": "VEHICLE",
        "value": "OD-06-XX-2621"
      }
    ]
  },
  {
    "id": "EV-KRP-61",
    "caseId": "OD-KRP-2026-0061",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-12T18:01:52.444Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-61",
        "type": "VEHICLE",
        "value": "OD-24-XX-7628"
      }
    ]
  },
  {
    "id": "EV-KRP-64",
    "caseId": "OD-KRP-2026-0064",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-20T17:04:24.587Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-64",
        "type": "VEHICLE",
        "value": "OD-25-XX-8509"
      }
    ]
  },
  {
    "id": "EV-RYG-65",
    "caseId": "OD-RYG-2026-0065",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "VIDEO",
    "uploadedAt": "2026-08-15T08:50:50.692Z",
    "entitiesExtracted": [
      {
        "id": "ENT-N-01",
        "type": "PERSON",
        "value": "Unknown Subject Alias Ranga"
      }
    ]
  },
  {
    "id": "EV-JYP-72",
    "caseId": "OD-JYP-2026-0072",
    "description": "Collected during preliminary sweep. Initial tagging done.",
    "type": "DOCUMENT",
    "uploadedAt": "2026-08-12T08:07:50.166Z",
    "entitiesExtracted": [
      {
        "id": "ENT-V-02",
        "type": "VEHICLE",
        "value": "OD-05-XY-7777"
      }
    ]
  }
];
const alerts: IntelligenceAlert[] = [
  {
    "id": "ALT-001",
    "type": "CROSS_STATION_MATCH",
    "message": "Cross-station relationship detected. Vehicle OD-02-AB-1234 matched between Burglary and Armed Heist.",
    "relatedCaseId": "OD-BBSR-2026-0001",
    "targetCaseId": "OD-CTC-2026-00981",
    "targetStationId": "OP-CTC-CITY",
    "isRead": false,
    "createdAt": "2026-08-20T18:48:17.920Z"
  }
];

export const initialState: AppState = {
  currentUser: null,
  users,
  stations,
  cases,
  evidence,
  accessRequests: [
    {
      id: 'REQ-2026-00301',
      requestingStationId: 'OP-BBSR-CAP',
      requestingOfficerId: 'INV-BBSR-001',
      targetStationId: 'OP-CTC-CITY',
      targetCaseId: 'OD-CTC-2026-0008',
      reason: 'Cross-station phone correlation link.',
      status: 'PENDING',
      createdAt: '2026-08-19T10:00:00.000Z'
    },
    {
      id: 'REQ-2026-00302',
      requestingStationId: 'OP-BBSR-CAP',
      requestingOfficerId: 'INV-BBSR-001',
      targetStationId: 'OP-PAT-CITY',
      targetCaseId: 'OD-RKL-2026-0117',
      reason: 'Vehicle plate query matching pattern.',
      status: 'APPROVED',
      createdAt: '2026-08-18T14:30:00.000Z'
    },
    {
      id: 'REQ-2026-00303',
      requestingStationId: 'OP-BBSR-CAP',
      requestingOfficerId: 'INV-BBSR-001',
      targetStationId: 'OP-SAH-CITY',
      targetCaseId: 'OD-JYP-2026-0030',
      reason: 'Suspect association mapping.',
      status: 'REJECTED',
      createdAt: '2026-08-17T09:15:00.000Z'
    }
  ],
  alerts,
  isProcessingIntelligence: false,
  isLoading: true,
};
