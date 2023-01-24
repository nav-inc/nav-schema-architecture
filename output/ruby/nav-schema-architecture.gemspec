# frozen_string_literal: true

$LOAD_PATH.push(File.dirname(__FILE__))

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.required_ruby_version = ">= 2.7"
  s.name        = "nav-schema-architecture"
  s.version     = "1.1.0"
  s.authors     = ["JJ Dubray"]
  s.email       = ["jdubray@gmail.com"]
  s.homepage    = "https://git.nav.com/engineering/nav-schema-architecture/output/ruby"
  s.summary     = "Nav Common Data Model"
  s.description = "Nav common data model and event formats"
  s.license     = "Nonstandard"

  s.add_dependency("activesupport", ">= 5")

  s.files = Dir["nsa/**/*"]
  s.require_path = ["nsa"]
  s.metadata = {
    "rubygems_mfa_required" => "true"
  }
end
