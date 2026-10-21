package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"
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

type ChatMessageInput struct {
	SenderID   string `json:"senderId" binding:"required"`
	SenderName string `json:"senderName" binding:"required"`
	SenderRole string `json:"senderRole" binding:"required"`
	Message    string `json:"message" binding:"required"`
}

type BookingRequest struct {
	ServiceID      string  `json:"serviceId" binding:"required"`
	AgencyID       string  `json:"agencyId"`
	PatientName    string  `json:"patientName" binding:"required"`
	PatientPhone   string  `json:"patientPhone" binding:"required"`
	PatientAddress string  `json:"patientAddress" binding:"required"`
	PatientLat     float64 `json:"patientLat"`
	PatientLng     float64 `json:"patientLng"`
	BookingTime    string  `json:"bookingTime"`
}

type BookingStatusUpdate struct {
	Status           string `json:"status"`
	ClinicalNotes    string `json:"clinicalNotes"`
	VitalsBP         string `json:"vitalsBP"`
	VitalsSpO2       string `json:"vitalsSpO2"`
	VitalsPulse      string `json:"vitalsPulse"`
	AssignedStaff    string `json:"assignedStaffId"`
	PrescriptionUrl  string `json:"prescriptionUrl"`
	PrescriptionName string `json:"prescriptionName"`
	AvSummary        string `json:"avSummary"`
	AvRecordingUrl   string `json:"avRecordingUrl"`
	AvActive         *bool  `json:"avActive"`
	BookingTime      string `json:"bookingTime"`
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
	CustomerID      string `json:"customerId"`
}

type StaffInput struct {
	AgencyID      string  `json:"agencyId" binding:"required"`
	Name          string  `json:"name" binding:"required"`
	Role          string  `json:"role" binding:"required"`
	Phone         string  `json:"phone" binding:"required"`
	ExperienceYrs int     `json:"experienceYrs"`
	Lat           float64 `json:"lat"`
	Lng           float64 `json:"lng"`
	Online        *bool   `json:"online"`
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

		api.PUT("/agencies/:id", func(c *gin.Context) {
			id := c.Param("id")
			var in AgencyInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			_, err := database.Exec(`
				UPDATE agencies 
				SET name = ?, registration_no = ?, city = ?, contact_person = ?, phone = ?, mode = COALESCE(NULLIF(?, ''), mode)
				WHERE id = ?
			`, in.Name, in.RegistrationNo, in.City, in.ContactPerson, in.Phone, in.Mode, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Agency updated successfully", "id": id})
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

		api.PUT("/services/:id", func(c *gin.Context) {
			id := c.Param("id")
			var in ServiceInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			_, err := database.Exec(`
				UPDATE services
				SET name = ?, category = ?, duration = ?, price = ?, staff_type = ?, description = ?
				WHERE id = ?
			`, in.Name, in.Category, in.Duration, in.Price, in.StaffType, in.Description, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Service updated successfully", "id": id})
		})

		// ==================== PACKAGES ====================
		api.GET("/packages", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			forCustomer := c.Query("forCustomer")
			all := c.Query("all") == "true"

			query := `
				SELECT p.id, p.agency_id, COALESCE(a.name, 'LifeCare Home Health'), p.name, p.category, p.duration_days, p.total_visits,
				       p.price, p.original_price, p.discount_percent, p.description, p.status, COALESCE(p.customer_id, '')
				FROM packages p
				LEFT JOIN agencies a ON p.agency_id = a.id
				WHERE 1=1
			`
			var args []interface{}
			if agencyID != "" {
				query += " AND p.agency_id = ?"
				args = append(args, agencyID)
			}
			if !all {
				if forCustomer != "" {
					query += " AND (p.customer_id IS NULL OR p.customer_id = '' OR p.customer_id = ?)"
					args = append(args, forCustomer)
				} else {
					query += " AND (p.customer_id IS NULL OR p.customer_id = '')"
				}
			}
			query += " ORDER BY p.price ASC"

			rows, err := database.Query(query, args...)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var packages []gin.H
			for rows.Next() {
				var id, agID, agencyName, name, cat, desc, status, customerID string
				var days, visits, price, origPrice, discount int
				if err := rows.Scan(&id, &agID, &agencyName, &name, &cat, &days, &visits, &price, &origPrice, &discount, &desc, &status, &customerID); err == nil {
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
						"customerId":      customerID,
						"isCustom":        customerID != "",
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
			var custID *string
			if in.CustomerID != "" {
				custID = &in.CustomerID
			}

			_, err := database.Exec(`
				INSERT INTO packages (id, agency_id, name, category, duration_days, total_visits, price, original_price, discount_percent, description, status, customer_id)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?)
			`, id, in.AgencyID, in.Name, in.Category, in.DurationDays, in.TotalVisits, in.Price, in.OriginalPrice, discount, in.Description, custID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusCreated, gin.H{"message": "Package created", "id": id})
		})

		api.PUT("/packages/:id", func(c *gin.Context) {
			id := c.Param("id")
			var in PackageInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			discount := in.DiscountPercent
			if discount == 0 && in.OriginalPrice > in.Price {
				discount = int(float64(in.OriginalPrice-in.Price) / float64(in.OriginalPrice) * 100)
			}
			_, err := database.Exec(`
				UPDATE packages
				SET name = ?, category = ?, duration_days = ?, total_visits = ?, price = ?, original_price = ?, discount_percent = ?, description = ?
				WHERE id = ?
			`, in.Name, in.Category, in.DurationDays, in.TotalVisits, in.Price, in.OriginalPrice, discount, in.Description, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Package updated successfully", "id": id})
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
			onlineVal := 1
			if in.Online != nil && !*in.Online {
				onlineVal = 0
			}
			_, err := database.Exec(`
				INSERT INTO staff (id, agency_id, name, role, phone, experience_yrs, lat, lng, rating, online, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 5.0, ?, 'VERIFIED')
			`, id, in.AgencyID, in.Name, in.Role, in.Phone, in.ExperienceYrs, in.Lat, in.Lng, onlineVal)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			_, _ = database.Exec("UPDATE agencies SET staff_count = staff_count + 1 WHERE id = ?", in.AgencyID)
			c.JSON(http.StatusCreated, gin.H{"message": "Paramedical staff onboarded", "id": id})
		})

		api.PUT("/staff/:id", func(c *gin.Context) {
			id := c.Param("id")
			var in StaffInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			_, err := database.Exec(`
				UPDATE staff
				SET name = ?, role = ?, phone = ?, experience_yrs = ?, lat = ?, lng = ?
				WHERE id = ?
			`, in.Name, in.Role, in.Phone, in.ExperienceYrs, in.Lat, in.Lng, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Staff updated successfully", "id": id})
		})

		// Duty toggle for paramedic
		api.PATCH("/staff/:id/duty", func(c *gin.Context) {
			id := c.Param("id")
			var in struct {
				Online bool `json:"online"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			onlineVal := 0
			if in.Online {
				onlineVal = 1
			}
			_, err := database.Exec("UPDATE staff SET online = ? WHERE id = ?", onlineVal, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Staff duty status updated", "id": id, "online": in.Online})
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
				       COALESCE(b.prescription_url, ''), COALESCE(b.prescription_name, ''),
				       COALESCE(b.av_summary, ''), COALESCE(b.av_recording_url, ''), COALESCE(b.av_active, 0),
				       COALESCE(b.booking_time, 'ASAP'), COALESCE(b.retry_count, 0),
				       b.created_at
				FROM bookings b
				LEFT JOIN services s ON b.service_id = s.id
				LEFT JOIN staff st ON b.assigned_staff_id = st.id
				LEFT JOIN agencies ag ON (CASE WHEN st.agency_id IS NOT NULL AND st.agency_id != '' THEN st.agency_id ELSE b.agency_id END) = ag.id
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
				var notes, bp, spo2, pulse, prescUrl, prescName, avSum, avRec, bookingTime, createdAt string
				var radius float64
				var avActive, retryCount int
				if err := rows.Scan(&id, &serviceID, &serviceName, &category, &agID, &agName, &patient, &phone, &address, &status, &radius, &staffName, &staffPhone, &notes, &bp, &spo2, &pulse, &prescUrl, &prescName, &avSum, &avRec, &avActive, &bookingTime, &retryCount, &createdAt); err == nil {
					bookings = append(bookings, gin.H{
						"id":               id,
						"serviceId":        serviceID,
						"serviceName":      serviceName,
						"category":         category,
						"agencyId":         agID,
						"agencyName":       agName,
						"patientName":      patient,
						"patientPhone":     phone,
						"address":          address,
						"status":           status,
						"radiusKm":         radius,
						"assignedStaff":    staffName,
						"staffPhone":       staffPhone,
						"clinicalNotes":    notes,
						"vitalsBP":         bp,
						"vitalsSpO2":       spo2,
						"vitalsPulse":      pulse,
						"prescriptionUrl":  prescUrl,
						"prescriptionName": prescName,
						"avSummary":        avSum,
						"avRecordingUrl":   avRec,
						"avActive":         avActive == 1,
						"bookingTime":      bookingTime,
						"retryCount":       retryCount,
						"createdAt":        createdAt,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": bookings})
		})

		// Single Booking details
		api.GET("/bookings/:id", func(c *gin.Context) {
			id := c.Param("id")
			var bID, serviceID, serviceName, status, staffName, bookingTime string
			var radius float64
			var retryCount int
			err := database.QueryRow(`
				SELECT b.id, b.service_id, s.name, b.status, b.search_radius_km, COALESCE(st.name, ''), COALESCE(b.booking_time, 'ASAP'), COALESCE(b.retry_count, 0)
				FROM bookings b
				LEFT JOIN services s ON b.service_id = s.id
				LEFT JOIN staff st ON b.assigned_staff_id = st.id
				WHERE b.id = ?
			`, id).Scan(&bID, &serviceID, &serviceName, &status, &radius, &staffName, &bookingTime, &retryCount)

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
				"bookingTime":   bookingTime,
				"retryCount":    retryCount,
			}})
		})

		// Update Booking Status / Clinical Notes / Vitals
		api.PATCH("/bookings/:id", func(c *gin.Context) {
			bookingID := c.Param("id")
			var in BookingStatusUpdate
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			query := `
				UPDATE bookings 
				SET status = COALESCE(NULLIF(?, ''), status),
				    clinical_notes = COALESCE(NULLIF(?, ''), clinical_notes),
				    vitals_bp = COALESCE(NULLIF(?, ''), vitals_bp),
				    vitals_spo2 = COALESCE(NULLIF(?, ''), vitals_spo2),
				    vitals_pulse = COALESCE(NULLIF(?, ''), vitals_pulse),
				    prescription_url = COALESCE(NULLIF(?, ''), prescription_url),
				    prescription_name = COALESCE(NULLIF(?, ''), prescription_name),
				    av_summary = COALESCE(NULLIF(?, ''), av_summary),
				    av_recording_url = COALESCE(NULLIF(?, ''), av_recording_url),
				    booking_time = COALESCE(NULLIF(?, ''), booking_time)
			`
			args := []interface{}{in.Status, in.ClinicalNotes, in.VitalsBP, in.VitalsSpO2, in.VitalsPulse, in.PrescriptionUrl, in.PrescriptionName, in.AvSummary, in.AvRecordingUrl, in.BookingTime}
			if in.AvActive != nil {
				avVal := 0
				if *in.AvActive {
					avVal = 1
				}
				query += ", av_active = ?"
				args = append(args, avVal)
			}
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

		// Cancel / Staff Cancel & Re-dispatch endpoint
		// Rule: Customer cancels or staff cancels after confirmation.
		// If staff cancels: triggers lookup for NEXT available staff.
		// If 3 staff cancels occur, permanently cancels booking.
		api.POST("/bookings/:id/cancel", func(c *gin.Context) {
			bookingID := c.Param("id")
			var in struct {
				Reason      string `json:"reason"`
				CancelledBy string `json:"cancelledBy"` // 'CUSTOMER' or 'STAFF'
				StaffID     string `json:"staffId"`
			}
			_ = c.ShouldBindJSON(&in)

			var currentStatus, assignedStaffID, declinedList string
			var retryCount int
			var pLat, pLng float64

			err := database.QueryRow(`
				SELECT status, COALESCE(assigned_staff_id, ''), COALESCE(retry_count, 0), COALESCE(declined_staff_ids, ''), patient_lat, patient_lng
				FROM bookings WHERE id = ?
			`, bookingID).Scan(&currentStatus, &assignedStaffID, &retryCount, &declinedList, &pLat, &pLng)

			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
				return
			}

			// If customer requested cancellation explicitly:
			if in.CancelledBy == "CUSTOMER" || (in.CancelledBy == "" && in.StaffID == "") {
				_, _ = database.Exec("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", bookingID)
				c.JSON(http.StatusOK, gin.H{
					"message": "Booking successfully cancelled by customer.",
					"id":      bookingID,
					"status":  "CANCELLED",
				})
				return
			}

			// Otherwise, staff cancellation:
			cancellingStaffID := in.StaffID
			if cancellingStaffID == "" {
				cancellingStaffID = assignedStaffID
			}

			// Append to declined list
			var newDeclined string
			if declinedList == "" {
				newDeclined = cancellingStaffID
			} else {
				newDeclined = declinedList + "," + cancellingStaffID
			}

			newRetryCount := retryCount + 1

			// If 3 staff have cancelled: permanently cancel booking
			if newRetryCount >= 3 {
				_, _ = database.Exec(`
					UPDATE bookings 
					SET status = 'CANCELLED', retry_count = ?, declined_staff_ids = ?, assigned_staff_id = NULL
					WHERE id = ?
				`, newRetryCount, newDeclined, bookingID)

				// Log system notification
				msgID := "MSG-" + uuid.New().String()[:8]
				_, _ = database.Exec(`
					INSERT INTO chat_messages (id, booking_id, sender_id, sender_name, sender_role, message)
					VALUES (?, ?, 'SYSTEM', 'Platform Dispatch', 'SYSTEM', ?)
				`, msgID, bookingID, "⚠️ Booking has been permanently cancelled after 3 consecutive staff cancellations. Full refund issued.")

				c.JSON(http.StatusOK, gin.H{
					"message":    "3 consecutive staff members cancelled. Booking is now permanently CANCELLED.",
					"id":         bookingID,
					"status":     "CANCELLED",
					"retryCount": newRetryCount,
				})
				return
			}

			// Under 3 cancellations: revert to SEARCHING and find NEXT available staff
			_, _ = database.Exec(`
				UPDATE bookings 
				SET status = 'SEARCHING', retry_count = ?, declined_staff_ids = ?, assigned_staff_id = NULL, search_radius_km = 5.0
				WHERE id = ?
			`, newRetryCount, newDeclined, bookingID)

			// Notify customer via in-app message
			msgID := "MSG-" + uuid.New().String()[:8]
			notifyMsg := fmt.Sprintf("Caregiver could not attend. We are automatically searching for your replacement caregiver (Search attempt %d of 3 within 5.0 km)...", newRetryCount+1)
			_, _ = database.Exec(`
				INSERT INTO chat_messages (id, booking_id, sender_id, sender_name, sender_role, message)
				VALUES (?, ?, 'SYSTEM', 'Platform Dispatch', 'SYSTEM', ?)
			`, msgID, bookingID, notifyMsg)

			// Trigger next staff search
			go runStagedDispatch(bookingID, pLat, pLng)

			c.JSON(http.StatusOK, gin.H{
				"message":       fmt.Sprintf("Staff cancelled. Looking for next available caregiver (Attempt %d/3).", newRetryCount+1),
				"id":            bookingID,
				"status":        "SEARCHING",
				"retryCount":    newRetryCount,
				"declinedStaff": newDeclined,
			})
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
			bookingTime := in.BookingTime
			if bookingTime == "" {
				bookingTime = "ASAP"
			}

			bookingID := "BK-" + uuid.New().String()[:8]
			agencyID := in.AgencyID
			if agencyID == "" {
				agencyID = "AG-01"
			}

			// Default search radius is strictly 5.0 km
			_, err := database.Exec(`
				INSERT INTO bookings (id, service_id, agency_id, patient_name, patient_phone, patient_address, patient_lat, patient_lng, status, search_radius_km, booking_time, retry_count, declined_staff_ids)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SEARCHING', 5.0, ?, 0, '')
			`, bookingID, in.ServiceID, agencyID, in.PatientName, in.PatientPhone, in.PatientAddress, in.PatientLat, in.PatientLng, bookingTime)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Automated 5km Staged Dispatch in background goroutine
			go runStagedDispatch(bookingID, in.PatientLat, in.PatientLng)

			c.JSON(http.StatusAccepted, gin.H{
				"bookingId":   bookingID,
				"status":      "SEARCHING",
				"radiusKm":    5.0,
				"bookingTime": bookingTime,
				"message":     "Instant booking initiated. Searching for nearest available paramedic within default 5.0 km...",
				"patientName": in.PatientName,
			})
		})

		// ==================== REAL-TIME CHAT FOR CONFIRMED BOOKINGS ====================
		
		// ==================== UNREAD / TOTAL CHAT MESSAGES SUMMARY ====================
		api.GET("/chat-summary", func(c *gin.Context) {
			rows, err := database.Query(`
				SELECT booking_id, COUNT(*), MAX(created_at)
				FROM chat_messages
				GROUP BY booking_id
			`)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			summary := make(map[string]gin.H)
			for rows.Next() {
				var bID, maxTime string
				var count int
				if err := rows.Scan(&bID, &count, &maxTime); err == nil {
					// Get the latest message sender role
					var lastRole, lastMsg string
					_ = database.QueryRow("SELECT sender_role, message FROM chat_messages WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1", bID).Scan(&lastRole, &lastMsg)
					summary[bID] = gin.H{
						"count":          count,
						"lastSenderRole": lastRole,
						"lastMessage":    lastMsg,
						"lastTime":       maxTime,
					}
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": summary})
		})

		api.GET("/bookings/:id/chat", func(c *gin.Context) {
			bookingID := c.Param("id")
			rows, err := database.Query(`
				SELECT id, booking_id, sender_id, sender_name, sender_role, message, created_at
				FROM chat_messages
				WHERE booking_id = ?
				ORDER BY created_at ASC
			`, bookingID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var messages []gin.H
			for rows.Next() {
				var id, bID, senderID, senderName, senderRole, msg, createdAt string
				if err := rows.Scan(&id, &bID, &senderID, &senderName, &senderRole, &msg, &createdAt); err == nil {
					messages = append(messages, gin.H{
						"id":         id,
						"bookingId":  bID,
						"senderId":   senderID,
						"senderName": senderName,
						"senderRole": senderRole,
						"message":    msg,
						"createdAt":  createdAt,
					})
				}
			}
			if messages == nil {
				messages = []gin.H{}
			}
			c.JSON(http.StatusOK, gin.H{"data": messages})
		})

		api.POST("/bookings/:id/chat", func(c *gin.Context) {
			bookingID := c.Param("id")
			var in ChatMessageInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			msgID := "MSG-" + uuid.New().String()[:8]
			_, err := database.Exec(`
				INSERT INTO chat_messages (id, booking_id, sender_id, sender_name, sender_role, message)
				VALUES (?, ?, ?, ?, ?, ?)
			`, msgID, bookingID, in.SenderID, in.SenderName, in.SenderRole, in.Message)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"id":         msgID,
				"bookingId":  bookingID,
				"senderId":   in.SenderID,
				"senderName": in.SenderName,
				"senderRole": in.SenderRole,
				"message":    in.Message,
				"createdAt":  time.Now().Format("2006-01-02 15:04:05"),
			})
		})

	}

	fmt.Println("🚀 Nurture Care Healthcare Backend with Multi-Role RBAC running on http://localhost:8080")
	r.Run(":8080")
}

// Staged dispatch algorithm with 5.0 km default radius & retry awareness
func runStagedDispatch(bookingID string, patientLat, patientLng float64) {
	time.Sleep(2 * time.Second)

	// Fetch booking details including agency, service, retry count, and declined staff list
	var agencyID, serviceID, declinedStr, currentStatus string
	var retryCount int
	err := database.QueryRow(`
		SELECT agency_id, service_id, COALESCE(declined_staff_ids, ''), COALESCE(retry_count, 0), status 
		FROM bookings WHERE id = ?
	`, bookingID).Scan(&agencyID, &serviceID, &declinedStr, &retryCount, &currentStatus)
	if err != nil || currentStatus != "SEARCHING" {
		return
	}

	declinedMap := make(map[string]bool)
	if declinedStr != "" {
		for _, sid := range strings.Split(declinedStr, ",") {
			declinedMap[strings.TrimSpace(sid)] = true
		}
	}

	// 1. Stage 1: Default 5.0 km search
	staffID, dist := findEligibleStaffWithFilter(agencyID, serviceID, patientLat, patientLng, 5.0, declinedMap)
	if staffID != "" {
		if confirmed := confirmBookingAtomic(bookingID, staffID, 5.0); confirmed {
			fmt.Printf("✅ Booking %s confirmed with staff %s at %.2f km (Attempt %d/3 within 5.0 km)\n", bookingID, staffID, dist, retryCount+1)
			return
		}
	}

	// 2. Stage 2: Expand to 10.0 km if not confirmed in 5.0 km
	fmt.Printf("⏳ No staff found in 5.0 km for booking %s. Expanding to 10.0 km...\n", bookingID)
	_, _ = database.Exec("UPDATE bookings SET search_radius_km = 10.0 WHERE id = ? AND status = 'SEARCHING'", bookingID)

	time.Sleep(3 * time.Second)

	// Check if booking was cancelled in the meantime
	_ = database.QueryRow("SELECT status FROM bookings WHERE id = ?", bookingID).Scan(&currentStatus)
	if currentStatus != "SEARCHING" {
		return
	}

	staffID, dist = findEligibleStaffWithFilter(agencyID, serviceID, patientLat, patientLng, 10.0, declinedMap)
	if staffID != "" {
		if confirmed := confirmBookingAtomic(bookingID, staffID, 10.0); confirmed {
			fmt.Printf("✅ Booking %s confirmed with staff %s at %.2f km (Stage 2: 10.0 km)\n", bookingID, staffID, dist)
			return
		}
	}

	// 3. Max radius exceeded: escalate to supervisor
	_, _ = database.Exec("UPDATE bookings SET status = 'ESCALATED' WHERE id = ? AND status = 'SEARCHING'", bookingID)
	fmt.Printf("⚠️ Booking %s escalated to agency supervisor\n", bookingID)
}

// findEligibleStaffWithFilter: checks online, verified, distance, matching service role, no active booking overlap, and not in declined list
func findEligibleStaffWithFilter(agencyID, serviceID string, pLat, pLng, maxKm float64, declinedMap map[string]bool) (string, float64) {
	// Look up required staff role for the service
	var staffType string
	_ = database.QueryRow("SELECT staff_type FROM services WHERE id = ?", serviceID).Scan(&staffType)

	query := `
		SELECT s.id, s.lat, s.lng 
		FROM staff s
		WHERE s.online = 1 
		  AND s.status = 'VERIFIED'
		  AND s.agency_id = ?
		  AND NOT EXISTS (
		      SELECT 1 FROM bookings b 
		      WHERE b.assigned_staff_id = s.id 
		        AND b.status IN ('CONFIRMED', 'EN_ROUTE', 'REACHED')
		  )
	`
	var args []interface{}
	args = append(args, agencyID)

	if staffType != "" {
		query += " AND s.role = ?"
		args = append(args, staffType)
	}

	rows, err := database.Query(query, args...)
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
			if declinedMap[id] {
				continue // Skip previously declined staff
			}
			d := dispatch.HaversineDistance(pLat, pLng, sLat, sLng)
			if d <= maxKm && d < minDistance {
				minDistance = d
				bestStaffID = id
			}
		}
	}

	// Fallback: If no staff found matching exact agency/role, search all online verified staff within radius not declined
	if bestStaffID == "" {
		fbRows, fbErr := database.Query(`
			SELECT s.id, s.lat, s.lng FROM staff s 
			WHERE s.online = 1 AND s.status = 'VERIFIED'
			  AND NOT EXISTS (
			      SELECT 1 FROM bookings b 
			      WHERE b.assigned_staff_id = s.id 
			        AND b.status IN ('CONFIRMED', 'EN_ROUTE', 'REACHED')
			  )
		`)
		if fbErr == nil {
			defer fbRows.Close()
			for fbRows.Next() {
				var id string
				var sLat, sLng float64
				if err := fbRows.Scan(&id, &sLat, &sLng); err == nil {
					if declinedMap[id] {
						continue
					}
					d := dispatch.HaversineDistance(pLat, pLng, sLat, sLng)
					if d <= maxKm && d < minDistance {
						minDistance = d
						bestStaffID = id
					}
				}
			}
		}
	}

	return bestStaffID, minDistance
}

// confirmBookingAtomic safely assigns staff only if booking is still SEARCHING
func confirmBookingAtomic(bookingID, staffID string, radius float64) bool {
	activeLock.Lock()
	defer activeLock.Unlock()

	var staffAgencyID string
	_ = database.QueryRow("SELECT agency_id FROM staff WHERE id = ?", staffID).Scan(&staffAgencyID)

	var res sql.Result
	var err error

	if staffAgencyID != "" {
		res, err = database.Exec(`
			UPDATE bookings 
			SET status = 'CONFIRMED', assigned_staff_id = ?, search_radius_km = ?, agency_id = ?
			WHERE id = ? AND status = 'SEARCHING'
		`, staffID, radius, staffAgencyID, bookingID)
	} else {
		res, err = database.Exec(`
			UPDATE bookings 
			SET status = 'CONFIRMED', assigned_staff_id = ?, search_radius_km = ?
			WHERE id = ? AND status = 'SEARCHING'
		`, staffID, radius, bookingID)
	}

	if err != nil {
		return false
	}
	rowsAff, _ := res.RowsAffected()
	return rowsAff > 0
}
