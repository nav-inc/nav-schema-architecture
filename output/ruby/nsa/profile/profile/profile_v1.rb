module NavSchemaArchitecture::Api::Tweet::Profile
  module Profile
    # User profile payload
    #
    # generator version 1

    def self.build(id, username, firstName, lastName, bio, birthdate, email, accountType, verified)
      raise(InvalidProfileError, "Required value id is undefined") unless defined? id
      raise(InvalidProfileError, "id must be a String") unless id.is_a?(String)
      raise(InvalidProfileError, "Invalid id type") if id.set? && !id.match?(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      raise(InvalidProfileError, "Required value username is undefined") unless defined? username
      raise(InvalidProfileError, "username must be a String") unless username.is_a?(String)

      raise(InvalidProfileError, "firstName must be a String") if firstName.set? && !firstName.is_a?(String)

      raise(InvalidProfileError, "lastName must be a String") if lastName.set? && !lastName.is_a?(String)

      raise(InvalidProfileError, "bio must be a String") if bio.set? && !bio.is_a?(String)

      raise(InvalidProfileError, "birthdate must be a Date") if birthdate.set? && !birthdate.is_a?(Date)

      raise(InvalidProfileError, "Required value email is undefined") unless defined? email
      raise(InvalidProfileError, "email must be a String") unless email.is_a?(String)
      raise(InvalidProfileError, "Enum value #{accountType} is invalid") if accountType.set? && !NavSchemaArchitecture::Event::Enums.account_type_value_valid?(accountType)

      raise(InvalidProfileError, "verified must be a boolean") if verified.set? && ![true, false].include?(verified)

      {
        "id" => id,
        "username" => username,
        "firstName" => firstName,
        "lastName" => lastName,
        "bio" => bio,
        "birthdate" => birthdate,
        "email" => email,
        "accountType" => accountType,
        "verified" => verified
      }
    end

    class InvalidProfileError < StandardError
    end
  end
end
