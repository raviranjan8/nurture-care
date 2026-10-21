package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"nurture-care/backend/internal/modules/dispatch"
	"nurture-care/backend/internal/platform/db"
)

var (
	database   *sql.DB
	activeLock sync.Mutex // Concurrency lock for 0% double-booking
	jwtSecret  = []byte("nurture-care-oauth2-secret-2026")
)

type TokenRequest struct {
	GrantType string `json:"grant_type" form:"grant_type"`
	Username  string `json:"username" form:"username" binding:"required"`
	Password  string `json:"password" form:"password" binding:"required"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	User        gin.H  `json:"user"`
}

type BookingRequest struct {
	ServiceID      string  `json:"serviceId" binding:"required"`
	AgencyID       string  `json:"agencyId"`
	PatientName    string  `json:"patientName" binding:"required"`
	PatientPhone   string  `json:"patientPhone" binding:"required"`
	PatientAddress string  `json:"patientAddress" binding:"required"`
	PatientLat     float64 `json:"patientLat"`
	PatientLng     float64 `json:"patientLng"`
}

type BookingStatusUpdate struct {
	Status        string `json:"status" binding:"required"`
	ClinicalNotes string `json:"clinicalNotes"`
	VitalsBP      string `json:"vitalsBP"`
	VitalsSpO2    string `json:"vitalsSpO2"`
	VitalsPulse   string `json:"vitalsPulse"`
	AssignedStaff string `json:"assignedStaffId"`
}

type AgencyInput struct {
	Name           string `json:"name" binding:"required"`
	RegistrationNo string `json:"registrationNo" binding:"required"`
	City           string `json:"city" binding:"required"`
	ContactPerson  string `json:"contactPerson" binding:"required"`
	Phone          string `json:"phone" binding:"required"`
	Mode           string `json:"mode"`
}

type ServiceInput struct {
	Name        string `json:"name" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Duration    string `json:"duration" binding:"required"`
	Price       int    `json:"price" binding:"required"`
	StaffType   string `json:"staffType" binding:"required"`
	Description string `json:"description" binding:"required"`
	IsMaster    *bool  `json:"isMaster"`
	AgencyID    string `json:"agencyId"`
}

type PackageInput struct {
	AgencyID        string `json:"agencyId" binding:"required"`
	Name            string `json:"name" binding:"required"`
	Category        string `json:"category" binding:"required"`
	DurationDays    int    `json:"durationDays" binding:"required"`
	TotalVisits     int    `json:"totalVisits" binding:"required"`
	Price           int    `json:"price" binding:"required"`
	OriginalPrice   int    `json:"originalPrice" binding:"required"`
	DiscountPercent int    `json:"discountPercent"`
	Description     string `json:"description" binding:"required"`
}

type StaffInput struct {
	AgencyID      string  `json:"agencyId" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	Role          string  `json:"role" binding:"required"`
	Phone         string  `json:"phone" binding:"required"`
	ExperienceYrs int     `json:"experienceYrs"`
	Lat           float64 `json:"lat"`
	Lng           float64 `json:"lng"`
}

type AlertInput struct {
	AgencyID string `json:"agencyId" binding:"required"`
	Type     string `json:"type" binding:"required"`
	Severity string `json:"severity" binding:"required"`
	Title    string `json:"title" binding:"required"`
	Message  string `json:"message" binding:"required"`
}

func main() {
	var err error
	database, err = db.InitDB("nurture_care.db")
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize database: %v", err))
	}
	defer database.Close()

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		// Healthcheck
		api.GET("/healthz", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "app": "Nurture Care API", "db": "SQLite embedded (zero-install)"})
		})

		// ==================== OAUTH2 MULTI-ROLE AUTHENTICATION ====================
		api.POST("/oauth/token", func(c *gin.Context) {
			var in TokenRequest
			if err := c.ShouldBind(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error":             "invalid_request",
					"error_description": "username and password are required",
				})
				return
			}

			var id, username, passwordHash, role, name string
			var agencyID, staffID, phone sql.NullString

			row := database.QueryRow(`
				SELECT id, username, password_hash, role, name, agency_id, staff_id, phone 
				FROM users WHERE username = ?
			`, in.Username)

			err := row.Scan(&id, &username, &passwordHash, &role, &name, &agencyID, &staffID, &phone)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":             "invalid_grant",
					"error_description": "Invalid username or password",
				})
				return
			}

			if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(in.Password)); err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":             "invalid_grant",
					"error_description": "Invalid username or password",
				})
				return
			}

			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"sub":       id,
				"username":  username,
				"role":      role,
				"name":      name,
				"agency_id": agencyID.String,
				"staff_id":  staffID.String,
				"phone":     phone.String,
				"exp":       time.Now().Add(24 * time.Hour).Unix(),
				"iat":       time.Now().Unix(),
			})

			tokenString, err := token.SignedString(jwtSecret)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue token"})
				return
			}

			c.JSON(http.StatusOK, TokenResponse{
				AccessToken: tokenString,
				TokenType:   "Bearer",
				ExpiresIn:   86400,
				User: gin.H{
					"id":       id,
					"username": username,
					"name":     name,
					"role":     role,
					"agencyId": agencyID.String,
					"staffId":  staffID.String,
					"phone":    phone.String,
				},
			})
		})

		// ==================== SUPER ADMIN METRICS ====================
		api.GET("/admin/metrics", func(c *gin.Context) {
			var totalAgencies, activeStaff, totalBookings, totalRevenue int
			var avgCompletionRate, avgResponseMin float64

			_ = database.QueryRow("SELECT COUNT(*) FROM agencies WHERE status = 'ACTIVE'").Scan(&totalAgencies)
			_ = database.QueryRow("SELECT COUNT(*) FROM staff WHERE online = 1").Scan(&activeStaff)
			_ = database.QueryRow("SELECT COUNT(*) FROM bookings").Scan(&totalBookings)
			_ = database.QueryRow("SELECT COALESCE(SUM(total_revenue), 0), COALESCE(AVG(completion_rate), 95.0), COALESCE(AVG(avg_response_min), 4.0) FROM agencies").
				Scan(&totalRevenue, &avgCompletionRate, &avgResponseMin)

			var pendingAlerts int
			_ = database.QueryRow("SELECT COUNT(*) FROM agency_alerts WHERE status = 'SENT'").Scan(&pendingAlerts)

			c.JSON(http.StatusOK, gin.H{"data": gin.H{
				"totalAgencies":     totalAgencies,
				"activeStaff":       activeStaff,
				"totalBookings":     totalBookings,
				"totalRevenue":      totalRevenue,
				"avgCompletionRate": avgCompletionRate,
				"avgResponseMin":    avgResponseMin,
				"pendingAlerts":     pendingAlerts,
			}})
		})

		// ==================== AGENCY ALERTS & WARNINGS ====================
		api.GET("/agency-alerts", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			query := `
				SELECT al.id, al.agency_id, COALESCE(ag.name, 'All Agencies'), al.type, al.severity, al.title, al.message, al.status, al.created_at
				FROM agency_alerts al
				LEFT JOIN agencies ag ON al.agency_id = ag.id
			`
			var rows *sql.Rows
			var err error
			if agencyID != "" {
				query += " WHERE al.agency_id = ? ORDER BY al.created_at DESC"
				rows, err = database.Query(query, agencyID)
			} else {
				query += " ORDER BY al.created_at DESC"
				rows, err = database.Query(query)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var alerts []gin.H
			for rows.Next() {
				var id, agID, agName, typ, sev, title, msg, status, createdAt string
				if err := rows.Scan(&id, &agID, &agName, &typ, &sev, &title, &msg, &status, &createdAt); err == nil {
					alerts = append(alerts, gin.H{
						"id":         id,
						"agencyId":   agID,
						"agencyName": agName,
						"type":       typ,
						"severity":   sev,
						"title":      title,
						"message":    msg,
						"status":     status,
						"createdAt":  createdAt,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": alerts})
		})

		api.POST("/agency-alerts", func(c *gin.Context) {
			var in AlertInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			id := "ALT-" + uuid.New().String()[:6]
			_, err := database.Exec(`
				INSERT INTO agency_alerts (id, agency_id, type, severity, title, message, status)
				VALUES (?, ?, ?, ?, ?, ?, 'SENT')
			`, id, in.AgencyID, in.Type, in.Severity, in.Title, in.Message)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Alert notification dispatched to agency", "id": id})
		})

		// ==================== AGENCIES ====================
		api.GET("/agencies", func(c *gin.Context) {
			rows, err := database.Query(`
				SELECT id, name, registration_no, city, contact_person, phone, mode, status, 
				       rating, staff_count, total_revenue, completion_rate, avg_response_min 
				FROM agencies ORDER BY rating DESC
			`)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var agencies []gin.H
			for rows.Next() {
				var id, name, reg, city, contact, phone, mode, status string
				var rating, compRate, avgResp float64
				var staffCount, revenue int
				if err := rows.Scan(&id, &name, &reg, &city, &contact, &phone, &mode, &status, &rating, &staffCount, &revenue, &compRate, &avgResp); err == nil {
					agencies = append(agencies, gin.H{
						"id":             id,
						"name":           name,
						"registrationNo": reg,
						"city":           city,
						"contactPerson":  contact,
						"phone":          phone,
						"mode":           mode,
						"status":         status,
						"rating":         rating,
						"staffCount":     staffCount,
						"totalRevenue":   revenue,
						"completionRate": compRate,
						"avgResponseMin": avgResp,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": agencies})
		})

		api.POST("/agencies", func(c *gin.Context) {
			var in AgencyInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			id := "AG-" + uuid.New().String()[:6]
			mode := in.Mode
			if mode == "" {
				mode = "HYBRID"
			}
			_, err := database.Exec(`
				INSERT INTO agencies (id, name, registration_no, city, contact_person, phone, mode, status, rating, staff_count, total_revenue, completion_rate, avg_response_min)
				VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 5.0, 0, 0, 100.0, 3.5)
			`, id, in.Name, in.RegistrationNo, in.City, in.ContactPerson, in.Phone, mode)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Agency onboarded successfully", "id": id})
		})

		// ==================== SERVICES ====================
		api.GET("/services", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			query := `
				SELECT s.id, s.name, s.category, s.duration, s.price, s.staff_type, s.description, s.is_master, COALESCE(s.created_by_agency_id, '')
				FROM services s
			`
			var rows *sql.Rows
			var err error
			if agencyID != "" {
				query += " WHERE s.is_master = 1 OR s.created_by_agency_id = ? ORDER BY s.is_master DESC, s.category, s.name"
				rows, err = database.Query(query, agencyID)
			} else {
				query += " ORDER BY s.is_master DESC, s.category, s.name"
				rows, err = database.Query(query)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var services []gin.H
			for rows.Next() {
				var id, name, category, duration, staffType, desc, createdBy string
				var price, isMaster int
				if err := rows.Scan(&id, &name, &category, &duration, &price, &staffType, &desc, &isMaster, &createdBy); err == nil {
					services = append(services, gin.H{
						"id":                id,
						"name":              name,
						"category":          category,
						"duration":          duration,
						"price":             price,
						"staffType":         staffType,
						"description":       desc,
						"isMaster":          isMaster == 1,
						"createdByAgencyId": createdBy,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": services})
		})

		api.POST("/services", func(c *gin.Context) {
			var in ServiceInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			id := "SRV-" + uuid.New().String()[:6]
			isMasterVal := 1
			if in.IsMaster != nil && !*in.IsMaster {
				isMasterVal = 0
			}
			var createdByAgency *string
			if in.AgencyID != "" && isMasterVal == 0 {
				createdByAgency = &in.AgencyID
			}

			_, err := database.Exec(`
				INSERT INTO services (id, name, category, duration, price, staff_type, description, is_master, created_by_agency_id)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`, id, in.Name, in.Category, in.Duration, in.Price, in.StaffType, in.Description, isMasterVal, createdByAgency)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Service saved successfully", "id": id, "isMaster": isMasterVal == 1})
		})

		// ==================== PACKAGES ====================
		api.GET("/packages", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			query := `
				SELECT p.id, p.agency_id, a.name, p.name, p.category, p.duration_days, p.total_visits,
				       p.price, p.original_price, p.discount_percent, p.description, p.status
				FROM packages p
				LEFT JOIN agencies a ON p.agency_id = a.id
			`
			var rows *sql.Rows
			var err error
			if agencyID != "" {
				query += " WHERE p.agency_id = ? ORDER BY p.price ASC"
				rows, err = database.Query(query, agencyID)
			} else {
				query += " ORDER BY p.price ASC"
				rows, err = database.Query(query)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var packages []gin.H
			for rows.Next() {
				var id, agID, agencyName, name, cat, desc, status string
				var days, visits, price, origPrice, discount int
				if err := rows.Scan(&id, &agID, &agencyName, &name, &cat, &days, &visits, &price, &origPrice, &discount, &desc, &status); err == nil {
					packages = append(packages, gin.H{
						"id":              id,
						"agencyId":        agID,
						"agencyName":      agencyName,
						"name":            name,
						"category":        cat,
						"durationDays":    days,
						"totalVisits":     visits,
						"price":           price,
						"originalPrice":   origPrice,
						"discountPercent": discount,
						"description":     desc,
						"status":          status,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": packages})
		})

		api.POST("/packages", func(c *gin.Context) {
			var in PackageInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			id := "PKG-" + uuid.New().String()[:6]
			discount := in.DiscountPercent
			if discount == 0 && in.OriginalPrice > in.Price {
				discount = int(float64(in.OriginalPrice-in.Price) / float64(in.OriginalPrice) * 100)
			}
			_, err := database.Exec(`
				INSERT INTO packages (id, agency_id, name, category, duration_days, total_visits, price, original_price, discount_percent, description, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
			`, id, in.AgencyID, in.Name, in.Category, in.DurationDays, in.TotalVisits, in.Price, in.OriginalPrice, discount, in.Description)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Package created", "id": id})
		})

		// ==================== PARAMEDICAL STAFF ====================
		api.GET("/staff", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			query := `
				SELECT s.id, s.agency_id, COALESCE(a.name, 'Independent'), s.name, s.role, s.phone, s.experience_yrs,
				       s.lat, s.lng, s.rating, s.online, s.status
				FROM staff s
				LEFT JOIN agencies a ON s.agency_id = a.id
			`
			var rows *sql.Rows
			var err error
			if agencyID != "" {
				query += " WHERE s.agency_id = ? ORDER BY s.rating DESC"
				rows, err = database.Query(query, agencyID)
			} else {
				query += " ORDER BY s.rating DESC"
				rows, err = database.Query(query)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var staffList []gin.H
			for rows.Next() {
				var id, agID, agencyName, name, role, phone, status string
				var exp, online int
				var lat, lng, rating float64
				if err := rows.Scan(&id, &agID, &agencyName, &name, &role, &phone, &exp, &lat, &lng, &rating, &online, &status); err == nil {
					staffList = append(staffList, gin.H{
						"id":            id,
						"agencyId":      agID,
						"agencyName":    agencyName,
						"name":          name,
						"role":          role,
						"phone":         phone,
						"experienceYrs": exp,
						"lat":           lat,
						"lng":           lng,
						"rating":        rating,
						"online":        online == 1,
						"status":        status,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": staffList})
		})

		api.POST("/staff", func(c *gin.Context) {
			var in StaffInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			id := "STF-" + uuid.New().String()[:6]
			if in.Lat == 0 {
				in.Lat = 28.5600
			}
			if in.Lng == 0 {
				in.Lng = 77.2100
			}
			_, err := database.Exec(`
				INSERT INTO staff (id, agency_id, name, role, phone, experience_yrs, lat, lng, rating, online, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1, 'VERIFIED')
			`, id, in.AgencyID, in.Name, in.Role, in.Phone, in.ExperienceYrs, in.Lat, in.Lng)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			_, _ = database.Exec("UPDATE agencies SET staff_count = staff_count + 1 WHERE id = ?", in.AgencyID)
			c.JSON(http.StatusCreated, gin.H{"message": "Paramedical staff onboarded", "id": id})
		})

		// ==================== BOOKINGS & VISITS (MULTI-ROLE FILTERED) ====================
		api.GET("/bookings", func(c *gin.Context) {
			staffID := c.Query("staffId")
			patientPhone := c.Query("patientPhone")
			agencyID := c.Query("agencyId")

			query := `
				SELECT b.id, b.service_id, s.name, s.category, b.agency_id, COALESCE(ag.name, 'LifeCare'),
				       b.patient_name, b.patient_phone, b.patient_address,
				       b.status, b.search_radius_km, COALESCE(st.name, 'Searching...'), COALESCE(st.phone, ''),
				       COALESCE(b.clinical_notes, ''), COALESCE(b.vitals_bp, ''), COALESCE(b.vitals_spo2, ''), COALESCE(b.vitals_pulse, ''),
				       b.created_at
				FROM bookings b
				LEFT JOIN services s ON b.service_id = s.id
				LEFT JOIN agencies ag ON b.agency_id = ag.id
				LEFT JOIN staff st ON b.assigned_staff_id = st.id
				WHERE 1=1
			`
			var args []interface{}
			if staffID != "" {
				query += " AND b.assigned_staff_id = ?"
				args = append(args, staffID)
			}
			if patientPhone != "" {
				query += " AND b.patient_phone LIKE ?"
				args = append(args, "%"+patientPhone+"%")
			}
			if agencyID != "" {
				query += " AND b.agency_id = ?"
				args = append(args, agencyID)
			}
			query += " ORDER BY b.created_at DESC"

			rows, err := database.Query(query, args...)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var bookings []gin.H
			for rows.Next() {
				var id, serviceID, serviceName, category, agID, agName, patient, phone, address, status, staffName, staffPhone string
				var notes, bp, spo2, pulse, createdAt string
				var radius float64
				if err := rows.Scan(&id, &serviceID, &serviceName, &category, &agID, &agName, &patient, &phone, &address, &status, &radius, &staffName, &staffPhone, &notes, &bp, &spo2, &pulse, &createdAt); err == nil {
					bookings = append(bookings, gin.H{
						"id":            id,
						"serviceId":     serviceID,
						"serviceName":   serviceName,
						"category":      category,
						"agencyId":      agID,
						"agencyName":    agName,
						"patientName":   patient,
						"patientPhone":  phone,
						"address":       address,
						"status":        status,
						"radiusKm":      radius,
						"assignedStaff": staffName,
						"staffPhone":    staffPhone,
						"clinicalNotes": notes,
						"vitalsBP":      bp,
						"vitalsSpO2":    spo2,
						"vitalsPulse":   pulse,
						"createdAt":     createdAt,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": bookings})
		})

		// Single Booking details
		api.GET("/bookings/:id", func(c *gin.Context) {
			id := c.Param("id")
			var bID, serviceID, serviceName, status, staffName string
			var radius float64
			err := database.QueryRow(`
				SELECT b.id, b.service_id, s.name, b.status, b.search_radius_km, COALESCE(st.name, '')
				FROM bookings b
				LEFT JOIN services s ON b.service_id = s.id
				LEFT JOIN staff st ON b.assigned_staff_id = st.id
				WHERE b.id = ?
			`, id).Scan(&bID, &serviceID, &serviceName, &status, &radius, &staffName)

			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"data": gin.H{
				"id":            bID,
				"serviceId":     serviceID,
				"serviceName":   serviceName,
				"status":        status,
				"radiusKm":      radius,
				"assignedStaff": staffName,
			}})
		})

		// Update Booking Status / Clinical Notes / Vitals (by Paramedic or Care Coordinator)
		api.PATCH("/bookings/:id", func(c *gin.Context) {
			bookingID := c.Param("id")
			var in BookingStatusUpdate
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			query := `
				UPDATE bookings 
				SET status = ?, clinical_notes = COALESCE(NULLIF(?, ''), clinical_notes),
				    vitals_bp = COALESCE(NULLIF(?, ''), vitals_bp),
				    vitals_spo2 = COALESCE(NULLIF(?, ''), vitals_spo2),
				    vitals_pulse = COALESCE(NULLIF(?, ''), vitals_pulse)
			`
			args := []interface{}{in.Status, in.ClinicalNotes, in.VitalsBP, in.VitalsSpO2, in.VitalsPulse}
			if in.AssignedStaff != "" {
				query += ", assigned_staff_id = ?"
				args = append(args, in.AssignedStaff)
			}
			query += " WHERE id = ?"
			args = append(args, bookingID)

			_, err := database.Exec(query, args...)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Booking updated successfully", "id": bookingID, "status": in.Status})
		})

		api.POST("/bookings", func(c *gin.Context) {
			var in BookingRequest
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if in.PatientLat == 0 {
				in.PatientLat = 28.5700
			}
			if in.PatientLng == 0 {
				in.PatientLng = 77.2100
			}

			bookingID := "BK-" + uuid.New().String()[:8]
			agencyID := in.AgencyID
			if agencyID == "" {
				agencyID = "AG-01"
			}

			_, err := database.Exec(`
				INSERT INTO bookings (id, service_id, agency_id, patient_name, patient_phone, patient_address, patient_lat, patient_lng, status, search_radius_km)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SEARCHING', 5.0)
			`, bookingID, in.ServiceID, agencyID, in.PatientName, in.PatientPhone, in.PatientAddress, in.PatientLat, in.PatientLng)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Automated 2-Stage Dispatch (5km -> 10km) in background goroutine
			go runStagedDispatch(bookingID, in.PatientLat, in.PatientLng)

			c.JSON(http.StatusAccepted, gin.H{
				"bookingId":   bookingID,
				"status":      "SEARCHING",
				"radiusKm":    5.0,
				"message":     "Instant booking initiated. Searching for nearest available paramedic within 5.0 km...",
				"patientName": in.PatientName,
			})
		})
	}

	fmt.Println("🚀 Nurture Care Healthcare Backend with Multi-Role RBAC running on http://localhost:8080")
	r.Run(":8080")
}

func runStagedDispatch(bookingID string, patientLat, patientLng float64) {
	time.Sleep(3 * time.Second)
	staffID, dist := findEligibleStaff(patientLat, patientLng, 5.0)

	if staffID != "" {
		confirmBooking(bookingID, staffID, 5.0)
		fmt.Printf("✅ Booking %s automatically confirmed with %s at distance %.2f km (Stage 1: 5km)\n", bookingID, staffID, dist)
		return
	}

	fmt.Printf("⏳ No staff accepted in 5km for booking %s. Expanding search radius to 10 km...\n", bookingID)
	_, _ = database.Exec("UPDATE bookings SET search_radius_km = 10.0 WHERE id = ?", bookingID)

	time.Sleep(3 * time.Second)
	staffID, dist = findEligibleStaff(patientLat, patientLng, 10.0)

	if staffID != "" {
		confirmBooking(bookingID, staffID, 10.0)
		fmt.Printf("✅ Booking %s automatically confirmed with %s at distance %.2f km (Stage 2: 10km)\n", bookingID, staffID, dist)
		return
	}

	_, _ = database.Exec("UPDATE bookings SET status = 'ESCALATED' WHERE id = ?", bookingID)
	fmt.Printf("⚠️ Booking %s escalated to agency supervisor\n", bookingID)
}

func findEligibleStaff(pLat, pLng, maxKm float64) (string, float64) {
	rows, err := database.Query("SELECT id, lat, lng FROM staff WHERE online = 1")
	if err != nil {
		return "", 0
	}
	defer rows.Close()

	var bestStaffID string
	var minDistance float64 = 9999.0

	for rows.Next() {
		var id string
		var sLat, sLng float64
		if err := rows.Scan(&id, &sLat, &sLng); err == nil {
			d := dispatch.HaversineDistance(pLat, pLng, sLat, sLng)
			if d <= maxKm && d < minDistance {
				minDistance = d
				bestStaffID = id
			}
		}
	}

	return bestStaffID, minDistance
}

func confirmBooking(bookingID, staffID string, radius float64) {
	activeLock.Lock()
	defer activeLock.Unlock()

	_, _ = database.Exec(`
		UPDATE bookings 
		SET status = 'CONFIRMED', assigned_staff_id = ?, search_radius_km = ?
		WHERE id = ? AND status = 'SEARCHING'
	`, staffID, radius, bookingID)
}
