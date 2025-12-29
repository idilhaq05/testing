// models/otp.go
package models

import (
	"sync"
	"time"
)

type OTPData struct {
	Code      string
	ExpiresAt time.Time
	Attempts  int
}

var (
	OTPStore = make(map[string]OTPData)
	OTPMutex = sync.RWMutex{}
)
