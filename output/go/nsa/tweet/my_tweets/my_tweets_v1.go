package api_tweet_myTweets_myTweets

import (
	"fmt"
	"time"
)

// User Tweets payload

type Tweet struct {
	Id   *string    `json:"id,omitempty"`
	Date *time.Time `json:"date,omitempty"`
	Body *string    `json:"body,omitempty"`
}

func (o Tweet) Validate() error {

	if o.Id == nil {
		return fmt.Errorf("Id is a required property of Tweet")
	}

	if o.Date == nil {
		return fmt.Errorf("Date is a required property of Tweet")
	}

	if o.Body == nil {
		return fmt.Errorf("Body is a required property of Tweet")
	}

	return nil
}

type MyTweets struct {
	Id          *string `json:"id,omitempty"`
	Username    *string `json:"username,omitempty"`
	Tweets      []Tweet `json:"tweets,omitempty"`
	PinnedTweet *Tweet  `json:"pinnedTweet,omitempty"`
}

func (o MyTweets) Validate() error {

	if o.Id == nil {
		return fmt.Errorf("Id is a required property of MyTweets")
	}

	if o.Username == nil {
		return fmt.Errorf("Username is a required property of MyTweets")
	}

	if o.Tweets == nil {
		return fmt.Errorf("Tweets is a required property of MyTweets")
	}

	for _, tweetsElement := range o.Tweets {
		TweetsError := tweetsElement.Validate()
		if TweetsError != nil {
			return fmt.Errorf("An element of Tweets is invalid %s", TweetsError)
		}
	}

	if o.PinnedTweet != nil {

		PinnedTweetError := o.PinnedTweet.Validate()
		if PinnedTweetError != nil {
			return fmt.Errorf("PinnedTweet is invalid %s", PinnedTweetError)
		}

	}

	return nil
}
