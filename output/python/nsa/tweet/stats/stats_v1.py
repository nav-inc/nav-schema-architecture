import re
import datetime
from dateutil import parser as dateutil_parser
from typing import Any, Callable, List, TypeVar, Union

# api.tweet.stats

# Tweet stats
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


class Stat:
    def __init__(self, *, views: int, likes: int, retweets: int, responses: int) -> None:

        is_required(views)
        is_required(likes)
        is_required(retweets)
        is_required(responses)

        self.views = views
        self.likes = likes
        self.retweets = retweets
        self.responses = responses

    @staticmethod
    def from_dict(obj: Any) -> 'Stat':
        if obj is None: return None
        assert isinstance(obj, dict)

        is_required(obj.get('views'))
        is_required(obj.get('likes'))
        is_required(obj.get('retweets'))
        is_required(obj.get('responses'))

        views = from_int(obj.get('views'))
        likes = from_int(obj.get('likes'))
        retweets = from_int(obj.get('retweets'))
        responses = from_int(obj.get('responses'))
        return Stat(views=views, likes=likes, retweets=retweets, responses=responses)

    def to_dict(self) -> dict:
        hash: dict = {}

        is_required(self.views)
        is_required(self.likes)
        is_required(self.retweets)
        is_required(self.responses)

        hash['views'] = from_int(self.views)
        hash['likes'] = from_int(self.likes)
        hash['retweets'] = from_int(self.retweets)
        hash['responses'] = from_int(self.responses)
        return hash


def from_Stat(x: Any) -> Stat:
    if x is None: return None
    assert isinstance(x, Stat)
    return x


class Stats:
    def __init__(self, *, id: str, date: datetime.date, stats: Stat) -> None:

        is_required(id)
        is_required(date)
        is_required(stats)

        self.id = id
        self.date = date
        self.stats = stats

    @staticmethod
    def from_dict(obj: Any) -> 'Stats':

        assert isinstance(obj, dict)

        id = from_str(obj.get('id'))
        date = from_Date(obj.get('date'))
        stats = Stat.from_dict(obj.get('stats'))
        return Stats(id=id, date=date, stats=stats)

    def to_dict(self) -> dict:
        hash: dict = {}
        hash['id'] = from_str(self.id)
        hash['date'] = from_Date(self.date)
        hash['stats'] = self.stats.to_dict()
        return hash


def from_Stats(x: Any) -> Stats:
    assert isinstance(x, Stats)
    return x
