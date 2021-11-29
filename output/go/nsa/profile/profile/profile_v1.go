package api_tweet_profile_profile

import (
	"fmt"
	"time"

	"git.nav.com/engineering/nav-schema-architecture/output/go/nsa/enums"
)

// User profile payload

type Profile struct {
	Id          *string            `json:"id,omitempty"`
	Username    *string            `json:"username,omitempty"`
	FirstName   *string            `json:"firstName,omitempty"`
	LastName    *string            `json:"lastName,omitempty"`
	Bio         *string            `json:"bio,omitempty"`
	Birthdate   *time.Time         `json:"birthdate,omitempty"`
	Email       *string            `json:"email,omitempty"`
	AccountType *enums.AccountType `json:"accountType,omitempty"`
	Verified    *bool              `json:"verified,omitempty"`
}

func (o Profile) Validate() error {

	if o.Id == nil {
		return fmt.Errorf("Id is a required property of Profile")
	}

	if o.Username == nil {
		return fmt.Errorf("Username is a required property of Profile")
	}

	if o.Email == nil {
		return fmt.Errorf("Email is a required property of Profile")
	}

	if o.AccountType != nil {

		AccountTypeError := o.AccountType.Validate()
		if AccountTypeError != nil {
			return fmt.Errorf("AccountType is invalid %s", AccountTypeError)
		}

	}

	return nil
}
