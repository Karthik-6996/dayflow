// src/mocks/users.js
// Matches TABLES.users schema: id, employee_id, email, role, name, phone, address, job_title, department, salary, profile_pic, bank_details

export const mockUsers = [
  {
    id: "usr-001-emp",
    employee_id: "DF-1001",
    email: "karthikgirish2007@gmail.com",
    role: "employee",
    name: "Karthik Girish",
    phone: "+91 98765 43210",
    address: "742 Evergreen Terrace, Suite 4B, Springfield, OR 97477",
    job_title: "Product Engineer",
    department: "Engineering",
    salary: 1450000, // ₹14.5 LPA
    profile_pic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "HDFC Bank Ltd",
      account_no: "50100492817491",
      ifsc: "HDFC0001234",
      pan: "KGIRK1234F",
      uan: "100982374611",
      pf_no: "BG/BNG/1009823/001"
    }
  },
  {
    id: "usr-002-adm",
    employee_id: "DF-ADM01",
    email: "admin@dayflow.internal",
    role: "admin",
    name: "System Administrator",
    phone: "+91 98111 22334",
    address: "100 Innovation Parkway, Floor 8, San Jose, CA 95110",
    job_title: "Head of People Operations & IT",
    department: "Human Resources",
    salary: 2400000, // ₹24.0 LPA
    profile_pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "ICICI Bank Ltd",
      account_no: "000201589412",
      ifsc: "ICIC0000002",
      pan: "ADMNT5849K",
      uan: "100192837465",
      pf_no: "BG/BNG/1001928/002"
    }
  },
  {
    id: "usr-003-emp",
    employee_id: "DF-1002",
    email: "sarah.jenkins@dayflow.internal",
    role: "employee",
    name: "Sarah Jenkins",
    phone: "+91 98765 43210",
    address: "Flat 402, Palm Meadows, Whitefield, Bengaluru, Karnataka 560066",
    job_title: "Senior Product Designer",
    department: "Design & UX",
    salary: 1450000, // ₹14.5 LPA
    profile_pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "HDFC Bank Ltd",
      account_no: "50100492817492",
      ifsc: "HDFC0001234",
      pan: "ABCDE1234F",
      uan: "100982374612",
      pf_no: "BG/BNG/1009823/003"
    }
  },
  {
    id: "usr-004-adm",
    employee_id: "DF-1003",
    email: "alex.rivera@dayflow.internal",
    role: "admin",
    name: "Alex Rivera",
    phone: "+91 98111 22334",
    address: "Tower 3, Prestige Tech Vista, Kadubeesanahalli, Bengaluru, Karnataka 560103",
    job_title: "Head of People Operations",
    department: "Human Resources",
    salary: 2400000, // ₹24.0 LPA
    profile_pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "ICICI Bank Ltd",
      account_no: "000201589413",
      ifsc: "ICIC0000002",
      pan: "ALEXR5849K",
      uan: "100192837466",
      pf_no: "BG/BNG/1001928/004"
    }
  },
  {
    id: "usr-005-emp",
    employee_id: "DF-1004",
    email: "marcus.chen@dayflow.internal",
    role: "employee",
    name: "Marcus Chen",
    phone: "+91 97400 11223",
    address: "Villa 18, Windmills of Your Mind, EPIP Zone, Bengaluru, Karnataka 560048",
    job_title: "Full Stack Engineer",
    department: "Engineering",
    salary: 1650000, // ₹16.5 LPA
    profile_pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "State Bank of India",
      account_no: "30948271039",
      ifsc: "SBIN0004123",
      pan: "MCHNE9871P",
      uan: "100483920184",
      pf_no: "BG/BNG/1004839/005"
    }
  },
  {
    id: "usr-006-emp",
    employee_id: "DF-1005",
    email: "priya.sharma@dayflow.internal",
    role: "employee",
    name: "Priya Sharma",
    phone: "+91 99887 76655",
    address: "B-204, Embassy Residency, Bellandur, Outer Ring Road, Bengaluru, Karnataka 560103",
    job_title: "Engineering Manager",
    department: "Engineering",
    salary: 2250000, // ₹22.5 LPA
    profile_pic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "Axis Bank Ltd",
      account_no: "918020048172931",
      ifsc: "UTIB0000142",
      pan: "PSHRM4729Q",
      uan: "100728394819",
      pf_no: "BG/BNG/1007283/006"
    }
  },
  {
    id: "usr-007-emp",
    employee_id: "DF-1006",
    email: "david.kim@dayflow.internal",
    role: "employee",
    name: "David Kim",
    phone: "+91 96543 21098",
    address: "14/A, Indiranagar 100ft Road, 1st Stage, Bengaluru, Karnataka 560038",
    job_title: "Marketing Strategist",
    department: "Marketing",
    salary: 1100000, // ₹11.0 LPA
    profile_pic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "Kotak Mahindra Bank",
      account_no: "8492019482",
      ifsc: "KKBK0000421",
      pan: "DKIMX3921T",
      uan: "100918273645",
      pf_no: "BG/BNG/1009182/007"
    }
  },
  {
    id: "usr-008-adm",
    employee_id: "DF-1007",
    email: "elena.rostova@dayflow.internal",
    role: "admin",
    name: "Elena Rostova",
    phone: "+91 98450 67890",
    address: "Penthouse 12, Sobha Morzaria Grandeur, Bannerghatta Road, Bengaluru, Karnataka 560029",
    job_title: "Director of HR & Compliance",
    department: "Human Resources",
    salary: 2600000, // ₹26.0 LPA
    profile_pic: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&auto=format&fit=crop&q=80",
    bank_details: {
      bank_name: "HDFC Bank Ltd",
      account_no: "50100938472615",
      ifsc: "HDFC0000053",
      pan: "EROST7291M",
      uan: "100619283746",
      pf_no: "BG/BNG/1006192/008"
    }
  }
];
