import re
import datetime
from dateutil import parser as dateutil_parser
from typing import Any, Callable, List, Literal, Optional, TypeVar, Union

# api.tweet.profile

# User profile payload
#
# generator version 1

T = TypeVar('T')


def from_str(x: Any) -> str:
    if x is None: return None
    assert isinstance(x, str)
    return x


def from_int(x: Any) -> int:
    if x is None: return None
    assert isinstance(x, int) and not isinstance(x, bool)
    return x


def from_list(f: Callable[[Any], T], x: Any) -> List[T]:
    if x is None: return None
    assert isinstance(x, list)
    return [f(y) for y in x]


def from_bool(x: Any) -> bool:
    if x is None: return None
    assert isinstance(x, bool)
    return x


def from_Any(x: Any) -> Any:
    return x


def is_required(x: Any) -> Any:
    assert x is not None
    return x


def from_Date(x: Union[str, datetime.date]) -> datetime.date:
    if x is None: return None
    if isinstance(x, str): x = datetime.date.fromisoformat(x)
    assert isinstance(x, datetime.date)
    return x


def from_DateTime(x: Union[str, datetime.datetime]) -> datetime.datetime:
    if x is None: return None
    if isinstance(x, str): x = dateutil_parser.isoparse(x)
    assert isinstance(x, datetime.datetime)
    return x


UUID_pattern = re.compile('^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$')


def from_UUID(x: Any) -> str:
    if x is None: return None

    assert isinstance(x, str)
    assert UUID_pattern.match(x)
    return x


Phone_pattern = re.compile('^\\+?[1-9]\\d{1,14}$')


def from_Phone(x: Any) -> str:
    if x is None: return None

    assert isinstance(x, str)
    assert Phone_pattern.match(x)
    return x


ZIPCode_pattern = re.compile('^[0-9]{5}(?:-[0-9]{4})?$')


def from_ZIPCode(x: Any) -> str:
    if x is None: return None

    assert isinstance(x, str)
    assert ZIPCode_pattern.match(x)
    return x


def from_Email(x: Any) -> str:
    if x is None: return None

    assert isinstance(x, str)
    return x


def from_Any(x: Any) -> dict:
    if x is None: return None

    assert isinstance(x, dict)
    return x


AccountType = Literal['BUSINESS', 'CREATOR']


def from_AccountType(x: AccountType):
    return x


class Profile:
    def __init__(
        self,
        *,
        id: str,
        username: str,
        firstName: Optional[str] = None,
        lastName: Optional[str] = None,
        bio: Optional[str] = None,
        birthdate: Optional[datetime.date] = None,
        email: str,
        accountType: Optional[AccountType] = None,
        verified: Optional[bool] = None
    ) -> None:

        is_required(id)
        from_UUID(id)
        is_required(username)
        is_required(email)
        from_AccountType(accountType)

        self.id = id
        self.username = username
        self.firstName = firstName
        self.lastName = lastName
        self.bio = bio
        self.birthdate = birthdate
        self.email = email
        self.accountType = accountType
        self.verified = verified

    @staticmethod
    def from_dict(obj: Any) -> 'Profile':

        assert isinstance(obj, dict)

        id = from_UUID(obj.get('id'))
        username = from_str(obj.get('username'))
        firstName = from_str(obj.get('firstName'))
        lastName = from_str(obj.get('lastName'))
        bio = from_str(obj.get('bio'))
        birthdate = from_Date(obj.get('birthdate'))
        email = from_Email(obj.get('email'))
        accountType = AccountType.from_dict(obj.get('accountType'))
        verified = from_bool(obj.get('verified'))
        return Profile(
            id=id,
            username=username,
            firstName=firstName,
            lastName=lastName,
            bio=bio,
            birthdate=birthdate,
            email=email,
            accountType=accountType,
            verified=verified
        )

    def to_dict(self) -> dict:
        hash: dict = {}
        hash['id'] = from_UUID(self.id)
        hash['username'] = from_str(self.username)
        hash['firstName'] = from_str(self.firstName)
        hash['lastName'] = from_str(self.lastName)
        hash['bio'] = from_str(self.bio)
        hash['birthdate'] = from_Date(self.birthdate)
        hash['email'] = from_Email(self.email)
        hash['accountType'] = from_AccountType(self.accountType)
        hash['verified'] = from_bool(self.verified)
        return hash


def from_Profile(x: Any) -> Profile:
    assert isinstance(x, Profile)
    return x
