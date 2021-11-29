package enums

import "fmt"

type AccountType string

const (
	BUSINESS AccountType = "BUSINESS"
	CREATOR  AccountType = "CREATOR"
)

func (v AccountType) Validate() error {
	switch v {
	case BUSINESS, CREATOR:
		return nil
	default:
		return fmt.Errorf("%s is not a valid AccountType value", v)
	}
}
