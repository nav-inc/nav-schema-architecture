require "active_support/core_ext/string/inflections" # for constantize()

module NavSchemaArchitecture::Event
  module Enums
    # Every collection of enums here is dynamically generated based the arrays
    # in this gem's top-level file.
    #
    # Unfortunately, we can't refer to it in a readable way in our code. This
    # part allows us to do that, and to validate it.
    #
    # Example:
    #   pry> MYENUM = %i[ONE TWO THREE FOUR]
    #   pry> my_enum = NSA::Event::Enums::MyEnum::TWO
    #   pry> my_enum
    #   => :TWO
    #   pry> NSA::Event::Enums.my_enum_validate_value(my_enum)
    #   => true
    begin
      errors, consts = constants.partition { |e| e.to_s.end_with?("Error") }

      # Get friendly names of the modules from the errors
      names = {}
      errors.map do |sym|
        name = sym.to_s.delete_prefix("Invalid").delete_suffix("Error")
        const = name.upcase.to_sym
        names[const] = name if consts.include?(const)
      end

      consts.each do |sym|
        mod = const_set(names[sym], Module.new)
        items = "NavSchemaArchitecture::Event::Enums::#{sym}".constantize
        items.each { |item| mod.const_set(item, item) }
      end
    end
  end
end
