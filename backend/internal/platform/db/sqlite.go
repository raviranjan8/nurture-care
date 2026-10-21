package db

import (
	"database/sql"
	"log"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

// InitDB initializes an embedded SQLite database (zero-install)
func InitDB(filepath string) (*sql.DB, error) {
	// Enable WAL mode & busy timeout for concurrent safety
	dsn := filepath + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1) // Prevent database locked errors in SQLite

	if err := db.Ping(); err != nil {
		return nil, err
	}

	log.Printf("Embedded SQLite DB initialized successfully at %s", filepath)

	// Create Core Tables
	createSchema := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL,
		name TEXT NOT NULL,
		agency_id TEXT,
		staff_id TEXT,
		phone TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS agencies (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		registration_no TEXT NOT NULL,
		city TEXT NOT NULL,
		contact_person TEXT NOT NULL,
		phone TEXT NOT NULL,
		mode TEXT DEFAULT 'HYBRID',
		status TEXT DEFAULT 'ACTIVE',
		rating REAL DEFAULT 4.8,
		staff_count INTEGER DEFAULT 0,
		total_revenue INTEGER DEFAULT 0,
		completion_rate REAL DEFAULT 96.5,
		avg_response_min REAL DEFAULT 4.2
	);

	CREATE TABLE IF NOT EXISTS agency_alerts (
		id TEXT PRIMARY KEY,
		agency_id TEXT NOT NULL,
		type TEXT NOT NULL,
		severity TEXT NOT NULL,
		title TEXT NOT NULL,
		message TEXT NOT NULL,
		status TEXT DEFAULT 'SENT',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS services (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		duration TEXT NOT NULL,
		price INTEGER NOT NULL,
		original_price INTEGER DEFAULT 0,
		discount_percent INTEGER DEFAULT 0,
		staff_type TEXT NOT NULL,
		description TEXT NOT NULL,
		is_master INTEGER DEFAULT 1,
		created_by_agency_id TEXT
	);

	CREATE TABLE IF NOT EXISTS packages (
		id TEXT PRIMARY KEY,
		agency_id TEXT NOT NULL,
		name TEXT NOT NULL,
		category TEXT NOT NULL,
		duration_days INTEGER NOT NULL,
		total_visits INTEGER NOT NULL,
		price INTEGER NOT NULL,
		original_price INTEGER NOT NULL,
		discount_percent INTEGER NOT NULL,
		description TEXT NOT NULL,
		status TEXT DEFAULT 'PUBLISHED',
		customer_id TEXT,
		expires_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS chat_messages (
		id TEXT PRIMARY KEY,
		booking_id TEXT NOT NULL,
		sender_id TEXT NOT NULL,
		sender_name TEXT NOT NULL,
		sender_role TEXT NOT NULL,
		message TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS staff (
		id TEXT PRIMARY KEY,
		agency_id TEXT NOT NULL,
		name TEXT NOT NULL,
		role TEXT NOT NULL,
		phone TEXT NOT NULL,
		experience_yrs INTEGER DEFAULT 3,
		lat REAL NOT NULL,
		lng REAL NOT NULL,
		online INTEGER DEFAULT 1,
		rating REAL DEFAULT 4.9,
		status TEXT DEFAULT 'VERIFIED'
	);

	CREATE TABLE IF NOT EXISTS bookings (
		id TEXT PRIMARY KEY,
		service_id TEXT NOT NULL,
		agency_id TEXT NOT NULL,
		patient_name TEXT NOT NULL,
		patient_phone TEXT NOT NULL,
		patient_address TEXT NOT NULL,
		patient_lat REAL NOT NULL,
		patient_lng REAL NOT NULL,
		status TEXT DEFAULT 'SEARCHING',
		assigned_staff_id TEXT,
		search_radius_km REAL DEFAULT 5.0,
		clinical_notes TEXT,
		vitals_bp TEXT,
		vitals_spo2 TEXT,
		vitals_pulse TEXT,
		booking_time TEXT DEFAULT 'ASAP',
		retry_count INTEGER DEFAULT 0,
		declined_staff_ids TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err = db.Exec(createSchema)
	if err != nil {
		return nil, err
	}

	// Automatic Schema Migrations
	_, _ = db.Exec("ALTER TABLE services ADD COLUMN original_price INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE services ADD COLUMN discount_percent INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE packages ADD COLUMN customer_id TEXT")
	_, _ = db.Exec("ALTER TABLE packages ADD COLUMN expires_at DATETIME")
	_, _ = db.Exec("ALTER TABLE packages ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN prescription_url TEXT")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN prescription_name TEXT")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN av_summary TEXT")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN av_recording_url TEXT")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN av_active INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN arrived_at DATETIME")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN booking_time TEXT DEFAULT 'ASAP'")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN retry_count INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE bookings ADD COLUMN declined_staff_ids TEXT DEFAULT ''")
	_, _ = db.Exec(`CREATE TABLE IF NOT EXISTS chat_messages (
		id TEXT PRIMARY KEY,
		booking_id TEXT NOT NULL,
		sender_id TEXT NOT NULL,
		sender_name TEXT NOT NULL,
		sender_role TEXT NOT NULL,
		message TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)


	// Seed Sample Data
	seedUsers(db)
	seedAgencies(db)
	seedServices(db)
	seedPackages(db)
	seedStaff(db)
	seedAlerts(db)
	seedSampleBookings(db)

	return db, nil
}

func seedUsers(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		return
	}

	hashBytes, _ := bcrypt.GenerateFromPassword([]byte("12345"), bcrypt.DefaultCost)
	hash := string(hashBytes)

	// 1. Super Admin
	_, _ = db.Exec(`INSERT OR IGNORE INTO users (id, username, password_hash, role, name, agency_id, staff_id, phone)
		VALUES ('USR-001', 'admin', ?, 'SUPER_ADMIN', 'Platform Administrator', NULL, NULL, '+91 99999 11111')`, hash)

	// 2. Agency Admin (LifeCare Health - AG-01)
	_, _ = db.Exec(`INSERT OR IGNORE INTO users (id, username, password_hash, role, name, agency_id, staff_id, phone)
		VALUES ('USR-002', 'agency', ?, 'AGENCY_ADMIN', 'LifeCare Agency Director', 'AG-01', NULL, '+91 98110 12345')`, hash)

	// 3. Agency Customer Care / Coordinator (LifeCare Health - AG-01)
	_, _ = db.Exec(`INSERT OR IGNORE INTO users (id, username, password_hash, role, name, agency_id, staff_id, phone)
		VALUES ('USR-003', 'care', ?, 'AGENCY_CARE', 'LifeCare Care Coordinator', 'AG-01', NULL, '+91 98110 99887')`, hash)

	// 4. Paramedical Staff (Nurse Pooja Sharma - STF-101)
	_, _ = db.Exec(`INSERT OR IGNORE INTO users (id, username, password_hash, role, name, agency_id, staff_id, phone)
		VALUES ('USR-004', 'paramedical', ?, 'PARAMEDIC', 'Pooja Sharma, RN', 'AG-01', 'STF-101', '+91 98765 43210')`, hash)

	// 5. Customer / Patient (Mrs. Priya Sharma)
	_, _ = db.Exec(`INSERT OR IGNORE INTO users (id, username, password_hash, role, name, agency_id, staff_id, phone)
		VALUES ('USR-005', 'customer', ?, 'PATIENT', 'Priya Sharma (Patient)', NULL, NULL, '+91 98765 12345')`, hash)

	log.Printf("Default multi-role users seeded: admin, agency, care, paramedical, customer (Password: 12345)")
}

func seedAgencies(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM agencies").Scan(&count)
	if count > 0 {
		return
	}

	agencies := []struct {
		id, name, reg, city, contact, phone, mode string
		rating                                     float64
		staffCount, revenue                        int
		compRate, avgResp                          float64
	}{
		{"AG-01", "LifeCare Home Health", "REG-DEL-2024-001", "New Delhi", "Dr. Rajesh Gupta", "+91 98110 12345", "HYBRID", 4.9, 38, 248500, 98.2, 3.4},
		{"AG-02", "Apollo Care At Home", "REG-DEL-2023-882", "South Delhi & Gurugram", "Sunil Mehta", "+91 98220 54321", "WHITE_LABEL", 4.8, 65, 512000, 97.4, 4.1},
		{"AG-03", "Nightingale Care Services", "REG-NOI-2025-104", "Noida & Ghaziabad", "Preeti Saxena", "+91 98330 98765", "MARKETPLACE", 4.3, 24, 134200, 84.5, 9.8},
		{"AG-04", "HealHome Physio & Nursing", "REG-DEL-2024-512", "West Delhi", "Vikas Khurana", "+91 98440 67890", "HYBRID", 4.85, 19, 189400, 95.8, 4.8},
	}

	for _, a := range agencies {
		_, _ = db.Exec(`INSERT OR IGNORE INTO agencies (id, name, registration_no, city, contact_person, phone, mode, status, rating, staff_count, total_revenue, completion_rate, avg_response_min)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?)`,
			a.id, a.name, a.reg, a.city, a.contact, a.phone, a.mode, a.rating, a.staffCount, a.revenue, a.compRate, a.avgResp)
	}
}

func seedAlerts(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM agency_alerts").Scan(&count)
	if count > 0 {
		return
	}

	alerts := []struct {
		id, agencyId, typ, sev, title, msg string
	}{
		{"ALT-01", "AG-03", "LOW_RATING", "HIGH", "Rating dropped below 4.5 threshold", "Nightingale Care average customer rating is currently 4.3. Review customer complaint logs immediately."},
		{"ALT-02", "AG-03", "SLOW_DISPATCH", "MEDIUM", "Average dispatch acceptance time > 8 mins", "Average response time is 9.8 mins. Paramedic acceptance velocity requires attention."},
		{"ALT-03", "AG-01", "MILESTONE", "LOW", "Top Performing Agency for October 2026", "LifeCare Home Health reached 98.2% visit completion rate with 3.4 min auto-dispatch velocity."},
	}

	for _, a := range alerts {
		_, _ = db.Exec(`INSERT OR IGNORE INTO agency_alerts (id, agency_id, type, severity, title, message) VALUES (?, ?, ?, ?, ?, ?)`,
			a.id, a.agencyId, a.typ, a.sev, a.title, a.msg)
	}
}

func seedServices(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM services").Scan(&count)
	if count > 0 {
		return
	}

	services := []struct {
		id, name, cat, dur string
		price              int
		staff, desc        string
	}{
		{"NUR-001", "Injection (IM/IV/SC)", "Nursing", "15-30 min", 299, "Registered Nurse", "Safe administration of prescribed injections under sterile conditions."},
		{"NUR-002", "IV Drip / Infusion Therapy", "Nursing", "1-3 hours", 699, "Registered Nurse", "Intravenous fluid & medication setup, flow monitoring and post-care."},
		{"NUR-003", "Catheter Insertion & Care", "Nursing", "30-45 min", 549, "Registered Nurse", "Foley/silicone catheter insertion, bladder wash and hygiene maintenance."},
		{"NUR-005", "Wound Dressing & Bed Sore Care", "Nursing", "30-60 min", 499, "Registered Nurse", "Surgical wound cleaning, aseptic dressing, and bedsore management."},
		{"PHY-001", "Post-Knee/Hip Rehab", "Physiotherapy", "45-60 min", 799, "Physiotherapist", "Targeted recovery exercises, gait training, and mobility restoration."},
		{"PHY-004", "Stroke & Neuro Rehabilitation", "Physiotherapy", "60 min", 899, "Neuro Physiotherapist", "Motor re-education, balance enhancement, and muscle spasticity treatment."},
		{"ELD-001", "12-Hour Assisted Care Attendant", "Elderly Care", "12 Hours", 1199, "Certified Caregiver", "Assistance with bathing, feeding, medication reminders, and vital checks."},
		{"LAB-001", "Complete Blood Count (CBC) at Home", "Lab & Diagnostics", "15 min", 349, "Phlebotomist", "Fast, painless sample collection delivered to NABL certified lab."},
	}

	for _, s := range services {
		_, _ = db.Exec(`INSERT OR IGNORE INTO services (id, name, category, duration, price, staff_type, description, is_master) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
			s.id, s.name, s.cat, s.dur, s.price, s.staff, s.desc)
	}
}

func seedPackages(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM packages").Scan(&count)
	if count > 0 {
		return
	}

	pkgs := []struct {
		id, agencyId, name, cat string
		days, visits, price, origPrice, discount int
		desc string
	}{
		{"PKG-01", "AG-01", "Post-Surgery Recovery (7 Days)", "Nursing", 7, 14, 4999, 6999, 28, "Daily nurse visits for IV drip, wound dressing, vital checks and medication administration."},
		{"PKG-02", "AG-01", "Stroke Rehabilitation Intensive (14 Days)", "Physiotherapy", 14, 14, 8999, 12599, 29, "Daily 1-hour sessions with neuro-physiotherapist, gait re-education, and spasticity reduction."},
		{"PKG-03", "AG-02", "Senior Compassion Care (30 Days)", "Elderly Care", 30, 30, 24999, 35999, 30, "Dedicated 12-hr daily attendant care for assistance with mobility, personal hygiene, and companion engagement."},
		{"PKG-04", "AG-03", "Cardiac & Diabetes Monitoring (Monthly)", "Lab & Diagnostics", 30, 4, 1899, 2499, 24, "Weekly home visits for lipid profile, HbA1c, fasting glucose, ECG at home and doctor review."},
	}

	for _, p := range pkgs {
		_, _ = db.Exec(`INSERT OR IGNORE INTO packages (id, agency_id, name, category, duration_days, total_visits, price, original_price, discount_percent, description, status)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
			p.id, p.agencyId, p.name, p.cat, p.days, p.visits, p.price, p.origPrice, p.discount, p.desc)
	}
}

func seedStaff(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM staff").Scan(&count)
	if count > 0 {
		return
	}

	staffList := []struct {
		id, agencyId, name, role, phone string
		exp                              int
		lat, lng, rating                 float64
	}{
		{"STF-101", "AG-01", "Pooja Sharma, RN", "Registered Nurse", "+91 98765 43210", 7, 28.5580, 77.2030, 4.95},
		{"STF-102", "AG-01", "Rahul Verma, BPT", "Physiotherapist", "+91 98765 43211", 5, 28.5800, 77.2200, 4.88},
		{"STF-103", "AG-02", "Sunita Nair, RN", "Registered Nurse", "+91 98765 43212", 9, 28.6200, 77.2100, 4.92},
		{"STF-104", "AG-03", "Amit Kumar, DMLT", "Phlebotomist", "+91 98765 43213", 4, 28.5400, 77.1800, 4.85},
		{"STF-105", "AG-02", "Deepak Joshi", "Certified Caregiver", "+91 98765 43214", 6, 28.5600, 77.1950, 4.89},
		{"STF-106", "AG-04", "Meenakshi Sundaram, RN", "Registered Nurse", "+91 98765 43215", 8, 28.5720, 77.2150, 4.97},
	}

	for _, s := range staffList {
		_, _ = db.Exec(`INSERT OR IGNORE INTO staff (id, agency_id, name, role, phone, experience_yrs, lat, lng, rating, online, status)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'VERIFIED')`,
			s.id, s.agencyId, s.name, s.role, s.phone, s.exp, s.lat, s.lng, s.rating)
	}
}

func seedSampleBookings(db *sql.DB) {
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&count)
	if count > 0 {
		return
	}

	bookings := []struct {
		id, serviceId, agencyId, patient, phone, addr string
		lat, lng float64
		status, staffId string
		notes, bp, spo2, pulse string
	}{
		{
			"BK-9001", "NUR-002", "AG-01", "Priya Sharma (Patient)", "+91 98765 12345", "Flat 402, Green Glen Layout, Delhi NCR",
			28.5700, 77.2100, "CONFIRMED", "STF-101",
			"IV Saline + Cefotaxime 1g administered. Patient resting comfortably.", "120/80 mmHg", "99%", "74 bpm",
		},
		{
			"BK-9002", "NUR-005", "AG-01", "Priya Sharma (Patient)", "+91 98765 12345", "Flat 402, Green Glen Layout, Delhi NCR",
			28.5700, 77.2100, "COMPLETED", "STF-101",
			"Aseptic dressing applied on post-op knee incision. Wound healing normally with zero exudate.", "118/76 mmHg", "98%", "76 bpm",
		},
		{
			"BK-9003", "PHY-001", "AG-01", "Rajiv Khanna", "+91 98111 22334", "C-12 Hauz Khas Enclave, New Delhi",
			28.5490, 77.2010, "SEARCHING", "",
			"Post-knee rehab session requested for evening visit.", "", "", "",
		},
	}

	for _, b := range bookings {
		_, _ = db.Exec(`INSERT OR IGNORE INTO bookings 
			(id, service_id, agency_id, patient_name, patient_phone, patient_address, patient_lat, patient_lng, status, assigned_staff_id, search_radius_km, clinical_notes, vitals_bp, vitals_spo2, vitals_pulse)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, ?, ?, ?, ?)`,
			b.id, b.serviceId, b.agencyId, b.patient, b.phone, b.addr, b.lat, b.lng, b.status, b.staffId, b.notes, b.bp, b.spo2, b.pulse)
	}
}
