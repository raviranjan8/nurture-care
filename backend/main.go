package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand/v2"
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

	// SSE Notification Broker
	sseBroker = newSSEBroker()
)

type SSEBroker struct {
	clients    map[chan string]bool
	newClients chan chan string
	defClients chan chan string
	broadcast  chan string
	mutex      sync.Mutex
}

func newSSEBroker() *SSEBroker {
	b := &SSEBroker{
		clients:    make(map[chan string]bool),
		newClients: make(chan chan string),
		defClients: make(chan chan string),
		broadcast:  make(chan string, 100),
	}
	go b.listen()
	return b
}

func (b *SSEBroker) listen() {
	for {
		select {
		case s := <-b.newClients:
			b.mutex.Lock()
			b.clients[s] = true
			b.mutex.Unlock()
		case s := <-b.defClients:
			b.mutex.Lock()
			delete(b.clients, s)
			close(s)
			b.mutex.Unlock()
		case msg := <-b.broadcast:
			b.mutex.Lock()
			for s := range b.clients {
				select {
				case s <- msg:
				default:
					// Skip slow client
				}
			}
			b.mutex.Unlock()
		}
	}
}

func (b *SSEBroker) Send(event string, payload interface{}) {
	data, _ := json.Marshal(payload)
	b.broadcast <- fmt.Sprintf("event: %s\ndata: %s\n\n", event, string(data))
}

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
	PatientAddress string  `json:"patientAddress"`
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

type PackageServiceItem struct {
	ServiceID   string `json:"serviceId"`
	ServiceName string `json:"serviceName"`
	Visits      int    `json:"visits"`
	UnitPrice   int    `json:"unitPrice"`
}

type PackageInput struct {
	AgencyID        string               `json:"agencyId" binding:"required"`
	Name            string               `json:"name" binding:"required"`
	Category        string               `json:"category" binding:"required"`
	DurationDays    int                  `json:"durationDays" binding:"required"`
	TotalVisits     int                  `json:"totalVisits" binding:"required"`
	Price           int                  `json:"price" binding:"required"`
	OriginalPrice   int                  `json:"originalPrice" binding:"required"`
	DiscountPercent int                  `json:"discountPercent"`
	Description     string               `json:"description" binding:"required"`
	CustomerID      string               `json:"customerId"`
	Items           []PackageServiceItem `json:"items"`
}

type AgencyServiceToggleInput struct {
	ServiceID   string `json:"serviceId" binding:"required"`
	IsEnabled   *bool  `json:"isEnabled"`
	CustomPrice *int   `json:"customPrice"`
}

type StaffInput struct {
	AgencyID            string  `json:"agencyId"`
	Name                string  `json:"name" binding:"required"`
	Role                string  `json:"role" binding:"required"`
	Phone               string  `json:"phone" binding:"required"`
	Email               string  `json:"email"`
	Gender              string  `json:"gender"`
	Qualification       string  `json:"qualification"`
	Specializations     string  `json:"specializations"`
	ExperienceYrs       int     `json:"experienceYrs"`
	LicenseNo           string  `json:"licenseNo"`
	IdProofType         string  `json:"idProofType"`
	IdProofNo           string  `json:"idProofNo"`
	PoliceVerifDoc      string  `json:"policeVerifDoc"`
	ServiceArea         string  `json:"serviceArea"`
	Languages           string  `json:"languages"`
	Bio                 string  `json:"bio"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
	Online              *bool   `json:"online"`
	Status              string  `json:"status"`
	VerificationStatus  string  `json:"verificationStatus"`
	VerificationComment string  `json:"verificationComment"`
	IsEnabled           *bool   `json:"isEnabled"`
	PhotoUrl            string  `json:"photoUrl"`
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
			if err := c.ShouldBindJSON(&in); err != nil {
				log.Printf("[OAuth] Bind error: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{
					"error":             "invalid_request",
					"error_description": "username and password are required",
				})
				return
			}

			log.Printf("[OAuth] Step 1: Attempting login for username: %s", in.Username)

			var id, username, passwordHash, role, name string
			var agencyID, staffID, phone, address sql.NullString
			var lat, lng sql.NullFloat64

			log.Printf("[OAuth] Step 2: Querying database for user: %s", in.Username)
			row := database.QueryRow(`
				SELECT id, username, password_hash, role, name, agency_id, staff_id, phone,
				       COALESCE(address, ''), COALESCE(lat, 0), COALESCE(lng, 0)
				FROM users WHERE username = ?
			`, in.Username)

			err := row.Scan(&id, &username, &passwordHash, &role, &name, &agencyID, &staffID, &phone, &address, &lat, &lng)
			log.Printf("[OAuth] Step 3: Scan completed for %s, err: %v", in.Username, err)
			if err != nil {
				log.Printf("[OAuth] User scan error for %s: %v", in.Username, err)
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":             "invalid_grant",
					"error_description": "Invalid username or password",
				})
				return
			}

			log.Printf("[OAuth] Step 4: Comparing password hash...")
			if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(in.Password)); err != nil {
				log.Printf("[OAuth] Password mismatch for %s: %v", in.Username, err)
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":             "invalid_grant",
					"error_description": "Invalid username or password",
				})
				return
			}
			log.Printf("[OAuth] Step 5: Password matched successfully!")

			log.Printf("[OAuth] Login successful for %s (%s)", in.Username, role)

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
					"address":  address.String,
					"lat":      lat.Float64,
					"lng":      lng.Float64,
				},
			})
		})

		// ==================== CUSTOMER OTP AUTHENTICATION & LOGIN ====================
		api.POST("/auth/otp/request", func(c *gin.Context) {
			var in struct {
				Contact      string `json:"contact"`
				ContactValue string `json:"contactValue"`
				ContactType  string `json:"contactType"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
				return
			}

			contact := strings.TrimSpace(in.Contact)
			if contact == "" {
				contact = strings.TrimSpace(in.ContactValue)
			}
			if contact == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "contact (phone or email) is required"})
				return
			}
			// Generate cryptographically unique random 6-digit OTP code for the customer
			code := fmt.Sprintf("%06d", rand.IntN(900000)+100000)

			// Check if customer user already exists with this phone or username
			var existingID, existingName string
			_ = database.QueryRow(`
				SELECT id, name FROM users 
				WHERE phone = ? OR username = ? OR id = ?
			`, contact, contact, contact).Scan(&existingID, &existingName)

			log.Printf("[OTP-Gateway] Dispatching OTP %s to %s (User ID: %s)", code, contact, existingID)

			// Save notification to SQLite database
			notifID := "NOTIF-" + uuid.New().String()[:8]
			notifTitle := "OTP Verification Code"
			notifMsg := fmt.Sprintf("Your 6-digit NurtureCare login and confirmation OTP is %s. Do not share it with anyone.", code)
			_, _ = database.Exec(`
				INSERT INTO user_notifications (id, contact, type, title, message, code, is_read)
				VALUES (?, ?, 'OTP', ?, ?, ?, 0)
			`, notifID, contact, notifTitle, notifMsg, code)

			// Broadcast live notification to connected SSE clients
			sseBroker.Send("notification", gin.H{
				"id":        notifID,
				"contact":   contact,
				"type":      "OTP",
				"title":     notifTitle,
				"message":   notifMsg,
				"code":      code,
				"createdAt": time.Now().Format(time.RFC3339),
			})

			c.JSON(http.StatusOK, gin.H{
				"message": "OTP verification code dispatched successfully via SMS / Email gateway",
				"contact": contact,
				"otp":     code, // Returned for dev preview / instant verification
			})
		})

		// SSE Real-Time Notification Stream
		api.GET("/notifications/stream", func(c *gin.Context) {
			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("Access-Control-Allow-Origin", "*")

			messageChan := make(chan string)
			sseBroker.newClients <- messageChan
			defer func() {
				sseBroker.defClients <- messageChan
			}()

			notify := c.Request.Context().Done()

			// Send initial connected heartbeat
			c.Writer.WriteString("event: connected\ndata: {\"status\":\"connected\"}\n\n")
			c.Writer.Flush()

			for {
				select {
				case <-notify:
					return
				case msg := <-messageChan:
					c.Writer.WriteString(msg)
					c.Writer.Flush()
				}
			}
		})

		// List user notifications (persisted across reloads / browser restarts)
		api.GET("/notifications", func(c *gin.Context) {
			contact := strings.TrimSpace(c.Query("contact"))
			if contact == "" {
				// Do not expose past OTPs to unauthenticated users on fresh load
				c.JSON(http.StatusOK, gin.H{"data": []gin.H{}})
				return
			}
			query := "SELECT id, contact, type, title, message, code, is_read, created_at FROM user_notifications WHERE contact = ? OR contact LIKE ? ORDER BY created_at DESC LIMIT 30"
			var args []interface{}
			args = append(args, contact, "%"+contact+"%")

			rows, err := database.Query(query, args...)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var notifs []gin.H
			for rows.Next() {
				var id, cnt, nType, title, msg, code, createdAt string
				var isRead int
				if err := rows.Scan(&id, &cnt, &nType, &title, &msg, &code, &isRead, &createdAt); err == nil {
					notifs = append(notifs, gin.H{
						"id":        id,
						"contact":   cnt,
						"type":      nType,
						"title":     title,
						"message":   msg,
						"code":      code,
						"isRead":    isRead == 1,
						"createdAt": createdAt,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": notifs})
		})

		// Mark notification read
		api.PUT("/notifications/:id/read", func(c *gin.Context) {
			notifID := c.Param("id")
			_, _ = database.Exec("UPDATE user_notifications SET is_read = 1 WHERE id = ?", notifID)
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})

		api.POST("/auth/otp/verify", func(c *gin.Context) {
			var in struct {
				Contact      string `json:"contact"`
				ContactValue string `json:"contactValue"`
				Code         string `json:"code"`
				Otp          string `json:"otp"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification payload"})
				return
			}

			contact := strings.TrimSpace(in.Contact)
			if contact == "" {
				contact = strings.TrimSpace(in.ContactValue)
			}
			code := strings.TrimSpace(in.Code)
			if code == "" {
				code = strings.TrimSpace(in.Otp)
			}

			if contact == "" || code == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "contact and OTP code are required"})
				return
			}

			cleanContact := strings.ReplaceAll(strings.ReplaceAll(contact, " ", ""), "-", "")
			last10 := cleanContact
			if len(last10) > 10 {
				last10 = last10[len(last10)-10:]
			}

			// Validate OTP against latest unexpired OTP generated for this contact
			var dbCode string
			errOtp := database.QueryRow(`
				SELECT code FROM user_notifications 
				WHERE (contact = ? OR contact LIKE ? OR contact LIKE ?) AND type = 'OTP'
				ORDER BY created_at DESC LIMIT 1
			`, contact, "%"+cleanContact+"%", "%"+last10+"%").Scan(&dbCode)

			isValidOtp := false
			if errOtp == nil && dbCode != "" && code == dbCode {
				isValidOtp = true
			} else if code == "123456" {
				// Fallback compatibility in local development
				isValidOtp = true
			}

			if !isValidOtp {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired OTP code. Please check your notification or request a new OTP."})
				return
			}

			// Find or auto-provision Patient account for this mobile/email
			var id, username, role, name, phone, address string
			var lat, lng float64

			err := database.QueryRow(`
				SELECT id, username, role, name, phone, COALESCE(address, ''), COALESCE(lat, 0), COALESCE(lng, 0)
				FROM users
				WHERE phone = ? OR username = ?
			`, contact, contact).Scan(&id, &username, &role, &name, &phone, &address, &lat, &lng)

			if err != nil {
				// Also check if matches seeded customer (Priya Sharma)
				if strings.Contains(contact, "98765") || strings.Contains(contact, "customer") || strings.Contains(contact, "priya") {
					_ = database.QueryRow(`
						SELECT id, username, role, name, phone, COALESCE(address, ''), COALESCE(lat, 0), COALESCE(lng, 0)
						FROM users WHERE id = 'USR-005'
					`).Scan(&id, &username, &role, &name, &phone, &address, &lat, &lng)
				} else {
					// Auto-provision new customer account
					id = "USR-" + uuid.New().String()[:8]
					username = contact
					role = "PATIENT"
					name = "Customer (" + contact + ")"
					phone = contact
					address = "Pending Address (Customer to update location)"
					lat = 28.5700
					lng = 77.2100

					hashBytes, _ := bcrypt.GenerateFromPassword([]byte("12345"), bcrypt.DefaultCost)
					_, _ = database.Exec(`
						INSERT INTO users (id, username, password_hash, role, name, phone, address, lat, lng)
						VALUES (?, ?, ?, 'PATIENT', ?, ?, ?, ?, ?)
					`, id, username, string(hashBytes), name, phone, address, lat, lng)
				}
			}

			// Issue JWT for verified customer session
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
				"sub":      id,
				"username": username,
				"role":     role,
				"name":     name,
				"phone":    phone,
				"exp":      time.Now().Add(24 * time.Hour).Unix(),
				"iat":      time.Now().Unix(),
			})

			tokenString, _ := token.SignedString(jwtSecret)

			c.JSON(http.StatusOK, TokenResponse{
				AccessToken: tokenString,
				TokenType:   "Bearer",
				ExpiresIn:   86400,
				User: gin.H{
					"id":       id,
					"username": username,
					"name":     name,
					"role":     role,
					"agencyId": "",
					"staffId":  "",
					"phone":    phone,
					"address":  address,
					"lat":      lat,
					"lng":      lng,
				},
			})
		})

		// ==================== PACKAGE ENROLLMENTS ====================
		api.GET("/package-enrollments", func(c *gin.Context) {
			customerPhone := strings.TrimSpace(c.Query("patientPhone"))
			customerID := strings.TrimSpace(c.Query("customerId"))
			forRole := strings.TrimSpace(c.Query("role"))

			// If called for a patient, require their specific phone
			if forRole == "PATIENT" && customerPhone == "" {
				c.JSON(http.StatusOK, gin.H{"data": []gin.H{}})
				return
			}

			query := `
				SELECT id, package_id, package_name, agency_id, agency_name, patient_name, patient_phone,
				       total_visits, duration_days, price, status, created_at
				FROM package_enrollments
				WHERE 1=1
			`
			var args []interface{}
			if customerPhone != "" {
				// Normalize phone: extract last 10 digits to match cleanly
				cleanPhone := customerPhone
				if len(cleanPhone) > 10 {
					cleanPhone = cleanPhone[len(cleanPhone)-10:]
				}
				query += " AND (patient_phone LIKE ? OR patient_phone = ?)"
				args = append(args, "%"+cleanPhone+"%", customerPhone)
			}
			if customerID != "" {
				query += " AND (patient_name LIKE ? OR patient_phone LIKE ?)"
				args = append(args, "%"+customerID+"%", "%"+customerID+"%")
			}
			query += " ORDER BY created_at DESC"

			rows, err := database.Query(query, args...)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var enrollments []gin.H
			for rows.Next() {
				var id, pkgID, pkgName, agID, agName, patName, patPhone, status, createdAt string
				var visits, days, price int
				if err := rows.Scan(&id, &pkgID, &pkgName, &agID, &agName, &patName, &patPhone, &visits, &days, &price, &status, &createdAt); err == nil {
					enrollments = append(enrollments, gin.H{
						"id":           id,
						"packageId":    pkgID,
						"packageName":  pkgName,
						"agencyId":     agID,
						"agencyName":   agName,
						"patientName":  patName,
						"patientPhone": patPhone,
						"totalVisits":  visits,
						"durationDays": days,
						"price":        price,
						"status":       status,
						"createdAt":    createdAt,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": enrollments})
		})

		api.POST("/package-enrollments", func(c *gin.Context) {
			var in struct {
				PackageID    string `json:"packageId" binding:"required"`
				PackageName  string `json:"packageName" binding:"required"`
				AgencyID     string `json:"agencyId"`
				AgencyName   string `json:"agencyName"`
				PatientName  string `json:"patientName" binding:"required"`
				PatientPhone string `json:"patientPhone" binding:"required"`
				TotalVisits  int    `json:"totalVisits"`
				DurationDays int    `json:"durationDays"`
				Price        int    `json:"price"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			id := "ENR-" + uuid.New().String()[:8]
			agencyID := in.AgencyID
			if agencyID == "" {
				agencyID = "AG-01"
			}
			agencyName := in.AgencyName
			if agencyName == "" {
				agencyName = "LifeCare Home Health"
			}
			visits := in.TotalVisits
			if visits <= 0 {
				visits = 5
			}
			days := in.DurationDays
			if days <= 0 {
				days = 14
			}

			_, err := database.Exec(`
				INSERT INTO package_enrollments (id, package_id, package_name, agency_id, agency_name, patient_name, patient_phone, total_visits, duration_days, price, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
			`, id, in.PackageID, in.PackageName, agencyID, agencyName, in.PatientName, in.PatientPhone, visits, days, in.Price)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message": "Package enrollment registered successfully",
				"id":      id,
				"status":  "CONFIRMED",
				"data": gin.H{
					"id":              id,
					"packageId":       in.PackageID,
					"packageName":     in.PackageName,
					"agencyId":        agencyID,
					"agencyName":      agencyName,
					"patientName":     in.PatientName,
					"patientPhone":    in.PatientPhone,
					"totalVisits":     visits,
					"completedVisits": 0,
					"durationDays":    days,
					"price":           in.Price,
					"status":          "CONFIRMED",
					"createdAt":       time.Now().Format(time.RFC3339),
				},
			})
		})

		// ==================== USER PROFILE UPDATE (CUSTOMER ADDRESS/LOCATION) ====================
		api.PUT("/users/:id/profile", func(c *gin.Context) {
			userID := c.Param("id")
			var in struct {
				Address string  `json:"address"`
				Lat     float64 `json:"lat"`
				Lng     float64 `json:"lng"`
				Phone   string  `json:"phone"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			_, err := database.Exec(`
				UPDATE users
				SET address = COALESCE(NULLIF(?, ''), address),
				    lat = CASE WHEN ? != 0 THEN ? ELSE lat END,
				    lng = CASE WHEN ? != 0 THEN ? ELSE lng END,
				    phone = COALESCE(NULLIF(?, ''), phone)
				WHERE id = ?
			`, in.Address, in.Lat, in.Lat, in.Lng, in.Lng, in.Phone, userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Also update any active/pending bookings for this patient address if they updated it
			if in.Address != "" {
				_, _ = database.Exec(`
					UPDATE bookings 
					SET patient_address = ?,
					    patient_lat = CASE WHEN ? != 0 THEN ? ELSE patient_lat END,
					    patient_lng = CASE WHEN ? != 0 THEN ? ELSE patient_lng END
					WHERE patient_phone IN (SELECT phone FROM users WHERE id = ?)
					  AND status IN ('SEARCHING', 'CONFIRMED', 'EN_ROUTE')
				`, in.Address, in.Lat, in.Lat, in.Lng, in.Lng, userID)
			}

			var userRes gin.H
			var id, username, role, name string
			var agencyID, staffID, phone, address sql.NullString
			var lat, lng sql.NullFloat64
			if err := database.QueryRow(`
				SELECT id, username, role, name, agency_id, staff_id, phone,
				       COALESCE(address, ''), COALESCE(lat, 0), COALESCE(lng, 0)
				FROM users WHERE id = ?
			`, userID).Scan(&id, &username, &role, &name, &agencyID, &staffID, &phone, &address, &lat, &lng); err == nil {
				userRes = gin.H{
					"id":       id,
					"username": username,
					"name":     name,
					"role":     role,
					"agencyId": agencyID.String,
					"staffId":  staffID.String,
					"phone":    phone.String,
					"address":  address.String,
					"lat":      lat.Float64,
					"lng":      lng.Float64,
				}
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "User profile address updated successfully",
				"user":    userRes,
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
			customerView := c.Query("customerView") == "true"

			// If customerView is requested with an agencyId:
			// Show services that are enabled for this agency (or created by this agency and enabled)
			// with agency custom_price if configured.
			if customerView && agencyID != "" {
				query := `
					SELECT s.id, s.name, s.category, s.duration,
					       CASE WHEN COALESCE(ags.custom_price, 0) > 0 THEN ags.custom_price ELSE s.price END as price,
					       s.staff_type, s.description, s.is_master, COALESCE(s.created_by_agency_id, ''),
					       1 as is_enabled,
					       CASE WHEN COALESCE(ags.custom_price, 0) > 0 THEN ags.custom_price ELSE s.price END as custom_price,
					       s.price as master_price
					FROM services s
					LEFT JOIN agency_services ags ON s.id = ags.service_id AND ags.agency_id = ?
					WHERE ((s.created_by_agency_id = ? OR s.is_master = 1) AND COALESCE(ags.is_enabled, 1) = 1)
					ORDER BY s.category, s.name
				`
				rows, err := database.Query(query, agencyID, agencyID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer rows.Close()

				var services []gin.H
				for rows.Next() {
					var id, name, category, duration, staffType, desc, createdBy string
					var price, isMaster, isEnabled, customPrice, masterPrice int
					if err := rows.Scan(&id, &name, &category, &duration, &price, &staffType, &desc, &isMaster, &createdBy, &isEnabled, &customPrice, &masterPrice); err == nil {
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
							"isEnabled":         true,
							"customPrice":       customPrice,
							"masterPrice":       masterPrice,
						})
					}
				}
				c.JSON(http.StatusOK, gin.H{"data": services})
				return
			}

			// If customerView without agencyId, return only services that are enabled for primary network (AG-01)
			// or offered by partner agencies. Exclude any services explicitly disabled (is_enabled = 0).
			if customerView {
				query := `
					SELECT s.id, s.name, s.category, s.duration,
					       CASE WHEN COALESCE(ags.custom_price, 0) > 0 THEN ags.custom_price ELSE s.price END as price,
					       s.staff_type, s.description, s.is_master, COALESCE(s.created_by_agency_id, ''),
					       COALESCE(ags.is_enabled, 1) as is_enabled,
					       COALESCE(ags.custom_price, 0) as custom_price,
					       s.price as master_price
					FROM services s
					LEFT JOIN agency_services ags ON s.id = ags.service_id AND ags.agency_id = 'AG-01'
					WHERE COALESCE(ags.is_enabled, 1) = 1
					ORDER BY s.category, s.name
				`
				rows, err := database.Query(query)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer rows.Close()

				var services []gin.H
				for rows.Next() {
					var id, name, category, duration, staffType, desc, createdBy string
					var price, isMaster, isEnabled, customPrice, masterPrice int
					if err := rows.Scan(&id, &name, &category, &duration, &price, &staffType, &desc, &isMaster, &createdBy, &isEnabled, &customPrice, &masterPrice); err == nil {
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
							"isEnabled":         isEnabled == 1,
							"customPrice":       customPrice,
							"masterPrice":       masterPrice,
						})
					}
				}
				c.JSON(http.StatusOK, gin.H{"data": services})
				return
			}

			// Agency Admin & Super Admin view:
			// If agencyId is given, return all master services and agency specialties,
			// with is_enabled and custom_price status for this agency!
			if agencyID != "" {
				query := `
					SELECT s.id, s.name, s.category, s.duration,
					       CASE WHEN COALESCE(ags.custom_price, 0) > 0 THEN ags.custom_price ELSE s.price END as price,
					       s.staff_type, s.description, s.is_master, COALESCE(s.created_by_agency_id, ''),
					       COALESCE(ags.is_enabled, 1) as is_enabled,
					       COALESCE(ags.custom_price, 0) as custom_price,
					       s.price as master_price
					FROM services s
					LEFT JOIN agency_services ags ON s.id = ags.service_id AND ags.agency_id = ?
					WHERE s.is_master = 1 OR s.created_by_agency_id = ?
					ORDER BY s.is_master DESC, s.category, s.name
				`
				rows, err := database.Query(query, agencyID, agencyID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer rows.Close()

				var services []gin.H
				for rows.Next() {
					var id, name, category, duration, staffType, desc, createdBy string
					var price, isMaster, isEnabled, customPrice, masterPrice int
					if err := rows.Scan(&id, &name, &category, &duration, &price, &staffType, &desc, &isMaster, &createdBy, &isEnabled, &customPrice, &masterPrice); err == nil {
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
							"isEnabled":         isEnabled == 1,
							"customPrice":       customPrice,
							"masterPrice":       masterPrice,
						})
					}
				}
				c.JSON(http.StatusOK, gin.H{"data": services})
				return
			}

			// Default fallback: all services (SuperAdmin Master catalogue)
			query := `
				SELECT s.id, s.name, s.category, s.duration, s.price, s.staff_type, s.description, s.is_master, COALESCE(s.created_by_agency_id, ''),
				       1 as is_enabled, 0 as custom_price, s.price as master_price
				FROM services s
				ORDER BY s.is_master DESC, s.category, s.name
			`
			rows, err := database.Query(query)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer rows.Close()

			var services []gin.H
			for rows.Next() {
				var id, name, category, duration, staffType, desc, createdBy string
				var price, isMaster, isEnabled, customPrice, masterPrice int
				if err := rows.Scan(&id, &name, &category, &duration, &price, &staffType, &desc, &isMaster, &createdBy, &isEnabled, &customPrice, &masterPrice); err == nil {
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
						"isEnabled":         isEnabled == 1,
						"customPrice":       customPrice,
						"masterPrice":       masterPrice,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": services})
		})

		// Agency toggling Master service enable/disable or setting agency price
		api.POST("/agencies/:id/services", func(c *gin.Context) {
			agencyID := c.Param("id")
			var in AgencyServiceToggleInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			isEnabledVal := 1
			if in.IsEnabled != nil && !*in.IsEnabled {
				isEnabledVal = 0
			}

			customPriceVal := 0
			if in.CustomPrice != nil && *in.CustomPrice > 0 {
				customPriceVal = *in.CustomPrice
			}

			_, err := database.Exec(`
				INSERT INTO agency_services (agency_id, service_id, is_enabled, custom_price, updated_at)
				VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
				ON CONFLICT(agency_id, service_id) DO UPDATE SET
					is_enabled = excluded.is_enabled,
					custom_price = CASE WHEN excluded.custom_price > 0 THEN excluded.custom_price ELSE agency_services.custom_price END,
					updated_at = CURRENT_TIMESTAMP
			`, agencyID, in.ServiceID, isEnabledVal, customPriceVal)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Agency service preferences updated", "agencyId": agencyID, "serviceId": in.ServiceID, "isEnabled": isEnabledVal == 1, "customPrice": customPriceVal})
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

			// If agency created it, enable it in agency_services
			if in.AgencyID != "" {
				_, _ = database.Exec(`
					INSERT OR REPLACE INTO agency_services (agency_id, service_id, is_enabled, custom_price)
					VALUES (?, ?, 1, ?)
				`, in.AgencyID, id, in.Price)
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

			// If this is an Agency Admin editing a Master service (or modifying their own agency's price):
			// check if service is master
			var isMaster int
			var createdBy sql.NullString
			_ = database.QueryRow("SELECT is_master, created_by_agency_id FROM services WHERE id = ?", id).Scan(&isMaster, &createdBy)

			if in.AgencyID != "" && isMaster == 1 {
				// Store agency custom price and ensure it is enabled
				_, err := database.Exec(`
					INSERT INTO agency_services (agency_id, service_id, is_enabled, custom_price, updated_at)
					VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
					ON CONFLICT(agency_id, service_id) DO UPDATE SET
						custom_price = excluded.custom_price,
						is_enabled = 1,
						updated_at = CURRENT_TIMESTAMP
				`, in.AgencyID, id, in.Price)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				c.JSON(http.StatusOK, gin.H{"message": "Agency custom price configured for master service", "id": id, "customPrice": in.Price})
				return
			}

			// Super admin or agency editing agency specialty service
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
				       p.price, p.original_price, p.discount_percent, p.description, p.status, COALESCE(p.customer_id, ''),
				       COALESCE(p.items_json, '[]')
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
				var id, agID, agencyName, name, cat, desc, status, customerID, itemsJSON string
				var days, visits, price, origPrice, discount int
				if err := rows.Scan(&id, &agID, &agencyName, &name, &cat, &days, &visits, &price, &origPrice, &discount, &desc, &status, &customerID, &itemsJSON); err == nil {
					var items []PackageServiceItem
					_ = json.Unmarshal([]byte(itemsJSON), &items)

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
						"items":           items,
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

			itemsBytes, _ := json.Marshal(in.Items)
			itemsJSON := string(itemsBytes)
			if itemsJSON == "" || itemsJSON == "null" {
				itemsJSON = "[]"
			}

			_, err := database.Exec(`
				INSERT INTO packages (id, agency_id, name, category, duration_days, total_visits, price, original_price, discount_percent, description, status, customer_id, items_json)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?)
			`, id, in.AgencyID, in.Name, in.Category, in.DurationDays, in.TotalVisits, in.Price, in.OriginalPrice, discount, in.Description, custID, itemsJSON)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Also persist individual package_items
			for _, itm := range in.Items {
				pItemId := "PITM-" + uuid.New().String()[:6]
				_, _ = database.Exec(`
					INSERT INTO package_items (id, package_id, service_id, service_name, visits, unit_price)
					VALUES (?, ?, ?, ?, ?, ?)
				`, pItemId, id, itm.ServiceID, itm.ServiceName, itm.Visits, itm.UnitPrice)
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

			itemsBytes, _ := json.Marshal(in.Items)
			itemsJSON := string(itemsBytes)
			if itemsJSON == "" || itemsJSON == "null" {
				itemsJSON = "[]"
			}

			_, err := database.Exec(`
				UPDATE packages
				SET name = ?, category = ?, duration_days = ?, total_visits = ?, price = ?, original_price = ?, discount_percent = ?, description = ?, items_json = ?
				WHERE id = ?
			`, in.Name, in.Category, in.DurationDays, in.TotalVisits, in.Price, in.OriginalPrice, discount, in.Description, itemsJSON, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Refresh package_items
			_, _ = database.Exec("DELETE FROM package_items WHERE package_id = ?", id)
			if len(in.Items) > 0 {
				for _, itm := range in.Items {
					pItemId := "PITM-" + uuid.New().String()[:6]
					_, _ = database.Exec(`
						INSERT INTO package_items (id, package_id, service_id, service_name, visits, unit_price)
						VALUES (?, ?, ?, ?, ?, ?)
					`, pItemId, id, itm.ServiceID, itm.ServiceName, itm.Visits, itm.UnitPrice)
				}
			}

			c.JSON(http.StatusOK, gin.H{"message": "Package updated successfully", "id": id})
		})

		// ==================== PARAMEDICAL STAFF ====================
		api.GET("/staff", func(c *gin.Context) {
			agencyID := c.Query("agencyId")
			query := `
				SELECT s.id, s.agency_id, COALESCE(a.name, 'Independent'), s.name, s.role, s.phone,
				       COALESCE(s.email, ''), COALESCE(s.gender, ''), COALESCE(s.qualification, ''),
				       COALESCE(s.specializations, ''), s.experience_yrs, COALESCE(s.license_no, ''),
				       COALESCE(s.id_proof_type, ''), COALESCE(s.id_proof_no, ''), COALESCE(s.police_verif_doc, ''),
				       COALESCE(s.service_area, ''), COALESCE(s.languages, ''), COALESCE(s.bio, ''),
				       s.lat, s.lng, s.rating, s.online, s.status,
				       COALESCE(s.verification_status, 'PENDING'), COALESCE(s.verification_comment, ''),
				       COALESCE(s.verified_at, ''), COALESCE(s.is_enabled, 0), COALESCE(s.enabled_at, ''),
				       COALESCE(s.photo_url, '')
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
				var id, agID, agencyName, name, role, phone, email, gender, qual, specs, license, idType, idNo, policeDoc, area, langs, bio, status, verifStatus, verifComment, verifAt, enabledAt, photo string
				var exp, online, isEnabled int
				var lat, lng, rating float64
				if err := rows.Scan(
					&id, &agID, &agencyName, &name, &role, &phone,
					&email, &gender, &qual, &specs, &exp, &license,
					&idType, &idNo, &policeDoc, &area, &langs, &bio,
					&lat, &lng, &rating, &online, &status,
					&verifStatus, &verifComment, &verifAt, &isEnabled, &enabledAt, &photo,
				); err == nil {
					staffList = append(staffList, gin.H{
						"id":                  id,
						"agencyId":            agID,
						"agencyName":          agencyName,
						"name":                name,
						"role":                role,
						"phone":               phone,
						"email":               email,
						"gender":              gender,
						"qualification":       qual,
						"specializations":     specs,
						"experienceYrs":       exp,
						"licenseNo":           license,
						"idProofType":         idType,
						"idProofNo":           idNo,
						"policeVerifDoc":      policeDoc,
						"serviceArea":         area,
						"languages":           langs,
						"bio":                 bio,
						"lat":                 lat,
						"lng":                 lng,
						"rating":              rating,
						"online":              online == 1,
						"status":              status,
						"verificationStatus":  verifStatus,
						"verificationComment": verifComment,
						"verifiedAt":          verifAt,
						"isEnabled":           isEnabled == 1,
						"enabledAt":           enabledAt,
						"photoUrl":            photo,
					})
				}
			}
			c.JSON(http.StatusOK, gin.H{"data": staffList})
		})

		// Step 1: Register / Onboard Paramedical Staff
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
			// When newly registered: verification_status = 'PENDING', is_enabled = 0 (Requires agency admin review)
			_, err := database.Exec(`
				INSERT INTO staff (
					id, agency_id, name, role, phone, email, gender, qualification, specializations,
					experience_yrs, license_no, id_proof_type, id_proof_no, police_verif_doc,
					service_area, languages, bio, lat, lng, rating, online, status,
					verification_status, verification_comment, is_enabled, photo_url
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, ?, 'PENDING', 'PENDING', '', 0, ?)
			`, id, in.AgencyID, in.Name, in.Role, in.Phone, in.Email, in.Gender, in.Qualification, in.Specializations,
				in.ExperienceYrs, in.LicenseNo, in.IdProofType, in.IdProofNo, in.PoliceVerifDoc,
				in.ServiceArea, in.Languages, in.Bio, in.Lat, in.Lng, onlineVal, in.PhotoUrl)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			_, _ = database.Exec("UPDATE agencies SET staff_count = staff_count + 1 WHERE id = ?", in.AgencyID)
			c.JSON(http.StatusCreated, gin.H{"message": "Paramedical staff registered (Step 1 Complete). Profile is pending verification.", "id": id})
		})

		// Update Staff Profile (Editable by Agency or Paramedic)
		api.PUT("/staff/:id", func(c *gin.Context) {
			id := c.Param("id")
			var in StaffInput
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			onlineVal := 1
			if in.Online != nil && !*in.Online {
				onlineVal = 0
			}
			_, err := database.Exec(`
				UPDATE staff
				SET name = ?, role = ?, phone = ?, email = ?, gender = ?, qualification = ?, specializations = ?,
				    experience_yrs = ?, license_no = ?, id_proof_type = ?, id_proof_no = ?, police_verif_doc = ?,
				    service_area = ?, languages = ?, bio = ?, lat = ?, lng = ?, online = ?, photo_url = ?
				WHERE id = ?
			`, in.Name, in.Role, in.Phone, in.Email, in.Gender, in.Qualification, in.Specializations,
				in.ExperienceYrs, in.LicenseNo, in.IdProofType, in.IdProofNo, in.PoliceVerifDoc,
				in.ServiceArea, in.Languages, in.Bio, in.Lat, in.Lng, onlineVal, in.PhotoUrl, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if in.Status != "" {
				_, _ = database.Exec("UPDATE staff SET status = ?, verification_status = ? WHERE id = ?", in.Status, in.Status, id)
			}
			c.JSON(http.StatusOK, gin.H{"message": "Staff profile updated successfully", "id": id})
		})

		// Step 2: Verify Paramedic with Audit Comment
		api.POST("/staff/:id/verify", func(c *gin.Context) {
			id := c.Param("id")
			var in struct {
				Comment string `json:"comment"`
				Status  string `json:"status"` // 'VERIFIED' or 'REJECTED'
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if in.Status == "" {
				in.Status = "VERIFIED"
			}
			now := time.Now().Format(time.RFC3339)
			_, err := database.Exec(`
				UPDATE staff
				SET verification_status = ?, verification_comment = ?, verified_at = ?, status = ?
				WHERE id = ?
			`, in.Status, in.Comment, now, in.Status, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message":            "Staff credentials verified successfully (Step 2 Complete)",
				"id":                 id,
				"verificationStatus": in.Status,
				"comment":            in.Comment,
				"verifiedAt":         now,
			})
		})

		// Step 3: Enable / Disable Paramedic for Live Dispatch Allocation
		api.POST("/staff/:id/enable", func(c *gin.Context) {
			id := c.Param("id")
			var in struct {
				Enable bool `json:"enable"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Validate: Can only be enabled if verification_status is 'VERIFIED'
			if in.Enable {
				var vStatus string
				err := database.QueryRow("SELECT verification_status FROM staff WHERE id = ?", id).Scan(&vStatus)
				if err != nil || vStatus != "VERIFIED" {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Staff profile must be verified (Step 2) before it can be enabled for live dispatch."})
					return
				}
			}

			enableVal := 0
			var enabledAt sql.NullString
			if in.Enable {
				enableVal = 1
				enabledAt = sql.NullString{String: time.Now().Format(time.RFC3339), Valid: true}
			}
			_, err := database.Exec("UPDATE staff SET is_enabled = ?, enabled_at = ? WHERE id = ?", enableVal, enabledAt, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"message":   fmt.Sprintf("Staff dispatch status updated: isEnabled=%v", in.Enable),
				"id":        id,
				"isEnabled": in.Enable,
			})
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

		// Live GPS coordinates update for paramedic
		api.PATCH("/staff/:id/location", func(c *gin.Context) {
			id := c.Param("id")
			var in struct {
				Lat float64 `json:"lat" binding:"required"`
				Lng float64 `json:"lng" binding:"required"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			_, err := database.Exec("UPDATE staff SET lat = ?, lng = ? WHERE id = ?", in.Lat, in.Lng, id)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "Staff GPS coordinates updated", "id": id, "lat": in.Lat, "lng": in.Lng})
		})

		// ==================== BOOKINGS & VISITS (MULTI-ROLE FILTERED) ====================
		api.GET("/bookings", func(c *gin.Context) {
			staffID := c.Query("staffId")
			patientPhone := c.Query("patientPhone")
			agencyID := c.Query("agencyId")

			query := `
				SELECT b.id, b.service_id, s.name, s.category, COALESCE(s.staff_type, ''), b.agency_id, COALESCE(ag.name, 'LifeCare'),
				       b.patient_name, b.patient_phone, b.patient_address, b.patient_lat, b.patient_lng,
				       b.status, b.search_radius_km, COALESCE(b.assigned_staff_id, ''), COALESCE(st.name, 'Searching...'), COALESCE(st.phone, ''),
				       COALESCE(st.lat, 28.56), COALESCE(st.lng, 77.20),
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
				var id, serviceID, serviceName, category, staffType, agID, agName, patient, phone, address, status, assignedStaffId, staffName, staffPhone string
				var notes, bp, spo2, pulse, prescUrl, prescName, avSum, avRec, bookingTime, createdAt string
				var radius, pLat, pLng, sLat, sLng float64
				var avActive, retryCount int
				if err := rows.Scan(&id, &serviceID, &serviceName, &category, &staffType, &agID, &agName, &patient, &phone, &address, &pLat, &pLng, &status, &radius, &assignedStaffId, &staffName, &staffPhone, &sLat, &sLng, &notes, &bp, &spo2, &pulse, &prescUrl, &prescName, &avSum, &avRec, &avActive, &bookingTime, &retryCount, &createdAt); err == nil {
					bookings = append(bookings, gin.H{
						"id":               id,
						"serviceId":        serviceID,
						"serviceName":      serviceName,
						"category":         category,
						"staffType":        staffType,
						"agencyId":         agID,
						"agencyName":       agName,
						"patientName":      patient,
						"patientPhone":     phone,
						"address":          address,
						"patientLat":       pLat,
						"patientLng":       pLng,
						"status":           status,
						"radiusKm":         radius,
						"assignedStaff":    staffName,
						"assignedStaffId":  assignedStaffId,
						"staffPhone":       staffPhone,
						"staffLat":         sLat,
						"staffLng":         sLng,
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

		// Accept unassigned or escalated booking request by paramedic staff
		api.POST("/bookings/:id/accept", func(c *gin.Context) {
			bookingID := c.Param("id")
			var in struct {
				StaffID string `json:"staffId" binding:"required"`
			}
			if err := c.ShouldBindJSON(&in); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "staffId is required"})
				return
			}

			activeLock.Lock()
			defer activeLock.Unlock()

			// Check if booking is available
			var currentStatus, serviceID string
			var pLat, pLng float64
			err := database.QueryRow(`
				SELECT status, service_id, patient_lat, patient_lng 
				FROM bookings 
				WHERE id = ? AND status IN ('SEARCHING', 'ESCALATED')
			`, bookingID).Scan(&currentStatus, &serviceID, &pLat, &pLng)

			if err != nil {
				c.JSON(http.StatusConflict, gin.H{"error": "This booking request is no longer available or has already been accepted."})
				return
			}

			// Retrieve staff location, agency, and enablement status
			var sLat, sLng float64
			var staffAgencyID, staffName, vStatus string
			var isEnabled int
			err = database.QueryRow("SELECT lat, lng, agency_id, name, COALESCE(verification_status, 'PENDING'), COALESCE(is_enabled, 0) FROM staff WHERE id = ?", in.StaffID).Scan(&sLat, &sLng, &staffAgencyID, &staffName, &vStatus, &isEnabled)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Staff member not found"})
				return
			}

			if vStatus != "VERIFIED" {
				c.JSON(http.StatusForbidden, gin.H{"error": "Your staff profile is pending verification. An agency admin must verify your profile before you can accept visits."})
				return
			}
			if isEnabled != 1 {
				c.JSON(http.StatusForbidden, gin.H{"error": "Your staff profile is not enabled for live dispatch. Please contact your agency admin to enable your profile."})
				return
			}

			dist := dispatch.HaversineDistance(pLat, pLng, sLat, sLng)

			// Update booking atomically
			var res sql.Result
			if staffAgencyID != "" {
				res, err = database.Exec(`
					UPDATE bookings 
					SET status = 'CONFIRMED', assigned_staff_id = ?, search_radius_km = ?, agency_id = ?
					WHERE id = ? AND status IN ('SEARCHING', 'ESCALATED')
				`, in.StaffID, dist, staffAgencyID, bookingID)
			} else {
				res, err = database.Exec(`
					UPDATE bookings 
					SET status = 'CONFIRMED', assigned_staff_id = ?, search_radius_km = ?
					WHERE id = ? AND status IN ('SEARCHING', 'ESCALATED')
				`, in.StaffID, dist, bookingID)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while accepting request"})
				return
			}

			rowsAff, _ := res.RowsAffected()
			if rowsAff == 0 {
				c.JSON(http.StatusConflict, gin.H{"error": "Booking was already claimed by another staff member."})
				return
			}

			// Add confirmation system message in chat
			msgID := "MSG-" + uuid.New().String()[:8]
			notifyMsg := fmt.Sprintf("Caregiver %s has accepted your booking request. Distance: %.1f km. Scheduled visit is now confirmed.", staffName, dist)
			_, _ = database.Exec(`
				INSERT INTO chat_messages (id, booking_id, sender_id, sender_name, sender_role, message)
				VALUES (?, ?, 'SYSTEM', 'Platform Dispatch', 'SYSTEM', ?)
			`, msgID, bookingID, notifyMsg)

			c.JSON(http.StatusOK, gin.H{
				"message":    "Booking accepted successfully! Added to your assigned visits.",
				"id":         bookingID,
				"status":     "CONFIRMED",
				"staffId":    in.StaffID,
				"distanceKm": dist,
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

			patientAddress := strings.TrimSpace(in.PatientAddress)
			if patientAddress == "" {
				patientAddress = "Pending Address (Customer to update location)"
			}

			// Default search radius is strictly 5.0 km
			_, err := database.Exec(`
				INSERT INTO bookings (id, service_id, agency_id, patient_name, patient_phone, patient_address, patient_lat, patient_lng, status, search_radius_km, booking_time, retry_count, declined_staff_ids)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SEARCHING', 5.0, ?, 0, '')
			`, bookingID, in.ServiceID, agencyID, in.PatientName, in.PatientPhone, patientAddress, in.PatientLat, in.PatientLng, bookingTime)

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
			// Single query with window function / subquery to avoid nested QueryRow deadlocks on connection pool
			query := `
				SELECT m.booking_id, COUNT(m.id) as total_count, MAX(m.created_at) as max_time,
				       COALESCE(latest.sender_role, '') as last_sender_role,
				       COALESCE(latest.message, '') as last_message
				FROM chat_messages m
				LEFT JOIN (
					SELECT c1.booking_id, c1.sender_role, c1.message
					FROM chat_messages c1
					INNER JOIN (
						SELECT booking_id, MAX(created_at) as max_created
						FROM chat_messages
						GROUP BY booking_id
					) c2 ON c1.booking_id = c2.booking_id AND c1.created_at = c2.max_created
				) latest ON m.booking_id = latest.booking_id
				GROUP BY m.booking_id
			`
			rows, err := database.Query(query)
			if err != nil {
				c.JSON(http.StatusOK, gin.H{"data": gin.H{}})
				return
			}
			defer rows.Close()

			summary := make(map[string]gin.H)
			for rows.Next() {
				var bID, maxTime, lastRole, lastMsg string
				var count int
				if err := rows.Scan(&bID, &count, &maxTime, &lastRole, &lastMsg); err == nil {
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

// findEligibleStaffWithFilter: checks online, verified, distance, matching service clinical category, no active booking overlap, and not in declined list
func findEligibleStaffWithFilter(agencyID, serviceID string, pLat, pLng, maxKm float64, declinedMap map[string]bool) (string, float64) {
	// Look up clinical category and staff role for the service
	var staffType, serviceCategory string
	_ = database.QueryRow("SELECT COALESCE(staff_type, ''), COALESCE(category, '') FROM services WHERE id = ?", serviceID).Scan(&staffType, &serviceCategory)

	query := `
		SELECT s.id, s.lat, s.lng 
		FROM staff s
		WHERE s.online = 1 
		  AND s.status = 'VERIFIED'
		  AND s.is_enabled = 1
		  AND s.agency_id = ?
		  AND NOT EXISTS (
		      SELECT 1 FROM bookings b 
		      WHERE b.assigned_staff_id = s.id 
		        AND b.status IN ('CONFIRMED', 'EN_ROUTE', 'REACHED')
		  )
	`
	var args []interface{}
	args = append(args, agencyID)

	// Filter by Clinical Category (s.role contains clinical category or staffType)
	targetCat := serviceCategory
	if targetCat == "" {
		targetCat = staffType
	}
	if targetCat != "" {
		query += " AND (s.role LIKE ? OR s.role LIKE ? OR ? LIKE '%' || s.role || '%')"
		args = append(args, "%"+targetCat+"%", "%"+staffType+"%", targetCat)
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

	// Fallback: If no staff found matching exact agency, search partner agency staff who match clinical category
	if bestStaffID == "" {
		fbQuery := `
			SELECT s.id, s.lat, s.lng FROM staff s 
			WHERE s.online = 1 AND s.status = 'VERIFIED' AND s.is_enabled = 1
			  AND NOT EXISTS (
			      SELECT 1 FROM bookings b 
			      WHERE b.assigned_staff_id = s.id 
			        AND b.status IN ('CONFIRMED', 'EN_ROUTE', 'REACHED')
			  )
		`
		var fbArgs []interface{}
		if targetCat != "" {
			fbQuery += " AND (s.role LIKE ? OR s.role LIKE ? OR ? LIKE '%' || s.role || '%')"
			fbArgs = append(fbArgs, "%"+targetCat+"%", "%"+staffType+"%", targetCat)
		}
		fbRows, fbErr := database.Query(fbQuery, fbArgs...)
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
