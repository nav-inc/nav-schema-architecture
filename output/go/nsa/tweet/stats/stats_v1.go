git add -Apackage api_tweet_stats_stats

import (
	"fmt"
	"time"
)

// Tweet stats

type Stat struct {
	Views     *int64 `json:"views,omitempty"`
	Likes     *int64 `json:"likes,omitempty"`
	Retweets  *int64 `json:"retweets,omitempty"`
	Responses *int64 `json:"responses,omitempty"`
}

func (o Stat) Validate() error {

	if o.Views == nil {
		return fmt.Errorf("Views is a required property of Stat")
	}

	if o.Likes == nil {
		return fmt.Errorf("Likes is a required property of Stat")
	}

	if o.Retweets == nil {
		return fmt.Errorf("Retweets is a required property of Stat")
	}

	if o.Responses == nil {
		return fmt.Errorf("Responses is a required property of Stat")
	}

	return nil
}

type Stats struct {
	Id    *string    `json:"id,omitempty"`
	Date  *time.Time `json:"date,omitempty"`
	Stats *Stat      `json:"stats,omitempty"`
}

func (o Stats) Validate() error {

	if o.Id == nil {
		return fmt.Errorf("Id is a required property of Stats")
	}

	if o.Date == nil {
		return fmt.Errorf("Date is a required property of Stats")
	}

	if o.Stats == nil {
		return fmt.Errorf("Stats is a required property of Stats")
	}

	StatsError := o.Stats.Validate()
	if StatsError != nil {
		return fmt.Errorf("Stats is invalid %s", StatsError)
	}

	return nil
}
