class Object
  alias set? present?
end

class FalseClass
  def set?
    # special case where .present? and .blank? fails us
    true
  end
end
