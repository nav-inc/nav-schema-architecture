module NavSchemaArchitecture::Api::Tweet::Stats
  module Stats
    # Tweet stats
    #
    # generator version 1

    def self.Stat(views, likes, retweets, responses)
      raise(InvalidStatError, "Required value views is undefined") unless defined? views
      raise(InvalidStatError, "views must be a Numeric") unless views.is_a?(Numeric)
      raise(InvalidStatError, "Required value likes is undefined") unless defined? likes
      raise(InvalidStatError, "likes must be a Numeric") unless likes.is_a?(Numeric)
      raise(InvalidStatError, "Required value retweets is undefined") unless defined? retweets
      raise(InvalidStatError, "retweets must be a Numeric") unless retweets.is_a?(Numeric)
      raise(InvalidStatError, "Required value responses is undefined") unless defined? responses
      raise(InvalidStatError, "responses must be a Numeric") unless responses.is_a?(Numeric)

      {
        "views" => views,
        "likes" => likes,
        "retweets" => retweets,
        "responses" => responses
      }
    end

    class InvalidStatError < StandardError
    end

    def self.build(id, date, stats)
      raise(InvalidStatsError, "Required value id is undefined") unless defined? id
      raise(InvalidStatsError, "id must be a String") unless id.is_a?(String)
      raise(InvalidStatsError, "Required value date is undefined") unless defined? date
      raise(InvalidStatsError, "date must be a Date") unless date.is_a?(Date)
      raise(InvalidStatsError, "Required value stats is undefined") unless defined? stats
      raise(InvalidStatsError, "stats must be a Hash") unless stats.is_a?(Hash)

      {
        "id" => id,
        "date" => date,
        "stats" => stats
      }
    end

    class InvalidStatsError < StandardError
    end
  end
end
