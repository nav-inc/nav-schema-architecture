module NavSchemaArchitecture::Api::Tweet::MyTweets
  module MyTweets
    # User Tweets payload
    #
    # generator version 1

    def self.Tweet(id, date, body)
      raise(InvalidTweetError, "Required value id is undefined") unless defined? id
      raise(InvalidTweetError, "id must be a String") unless id.is_a?(String)
      raise(InvalidTweetError, "Required value date is undefined") unless defined? date
      raise(InvalidTweetError, "date must be a Date") unless date.is_a?(Date)
      raise(InvalidTweetError, "Required value body is undefined") unless defined? body
      raise(InvalidTweetError, "body must be a String") unless body.is_a?(String)

      {
        "id" => id,
        "date" => date,
        "body" => body
      }
    end

    class InvalidTweetError < StandardError
    end

    def self.build(id, username, tweets, pinnedTweet)
      raise(InvalidMyTweetsError, "Required value id is undefined") unless defined? id
      raise(InvalidMyTweetsError, "id must be a String") unless id.is_a?(String)
      raise(InvalidMyTweetsError, "Invalid id type") if id.set? && !id.match?(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      raise(InvalidMyTweetsError, "Required value username is undefined") unless defined? username
      raise(InvalidMyTweetsError, "username must be a String") unless username.is_a?(String)
      raise(InvalidMyTweetsError, "Required value tweets is undefined") unless defined? tweets
      raise(InvalidMyTweetsError, "tweets must be an array") unless tweets.is_a?(Array)

      raise(InvalidMyTweetsError, "pinnedTweet must be a Hash") if pinnedTweet.set? && !pinnedTweet.is_a?(Hash)

      {
        "id" => id,
        "username" => username,
        "tweets" => tweets,
        "pinnedTweet" => pinnedTweet
      }
    end

    class InvalidMyTweetsError < StandardError
    end
  end
end
