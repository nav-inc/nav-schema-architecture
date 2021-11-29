# FIXME: This resolves classes belonging to non-existent modules.
#        This is a bad thing we're doing.
module NavSchemaArchitecture
  module Event; end
end

# A shorthand alias for convenience
NSA = NavSchemaArchitecture

module NavSchemaArchitecture::Event::Enums
  ACCOUNTTYPE = %i[BUSINESS CREATOR].freeze

  def self.account_type_value_valid?(v)
    ACCOUNTTYPE.include?(v)
  end

  class InvalidAccountTypeError < StandardError
  end
end

require "active_support/core_ext/object/blank"
require "date"

require_relative "utils"
require_relative "enums"
require_relative "profile/profile/profile_v1"
require_relative "tweet/my_tweets/my_tweets_v1"
require_relative "tweet/stats/stats_v1"
