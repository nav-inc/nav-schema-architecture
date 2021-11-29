import re
import datetime
from dateutil import parser as dateutil_parser
from typing import Any, Callable, List, Optional, TypeVar, Union

# api.tweet.myTweets

# User Tweets payload
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


class Tweet:
    def __init__(self, *, id: str, date: datetime.date, body: str) -> None:

        is_required(id)
        is_required(date)
        is_required(body)

        self.id = id
        self.date = date
        self.body = body

    @staticmethod
    def from_dict(obj: Any) -> 'Tweet':
        if obj is None: return None
        assert isinstance(obj, dict)

        is_required(obj.get('id'))
        is_required(obj.get('date'))
        is_required(obj.get('body'))

        id = from_str(obj.get('id'))
        date = from_Date(obj.get('date'))
        body = from_str(obj.get('body'))
        return Tweet(id=id, date=date, body=body)

    def to_dict(self) -> dict:
        hash: dict = {}

        is_required(self.id)
        is_required(self.date)
        is_required(self.body)

        hash['id'] = from_str(self.id)
        hash['date'] = from_Date(self.date)
        hash['body'] = from_str(self.body)
        return hash


def from_Tweet(x: Any) -> Tweet:
    if x is None: return None
    assert isinstance(x, Tweet)
    return x


class MyTweets:
    def __init__(self, *, id: str, username: str, tweets: List[Tweet], pinnedTweet: Optional[Tweet] = None) -> None:

        is_required(id)
        from_UUID(id)
        is_required(username)
        is_required(tweets)
        from_list(from_Tweet, tweets)

        self.id = id
        self.username = username
        self.tweets = tweets
        self.pinnedTweet = pinnedTweet

    @staticmethod
    def from_dict(obj: Any) -> 'MyTweets':

        assert isinstance(obj, dict)

        id = from_UUID(obj.get('id'))
        username = from_str(obj.get('username'))
        tweets = Tweet.from_dict(obj.get('tweets'))
        pinnedTweet = Tweet.from_dict(obj.get('pinnedTweet'))
        return MyTweets(id=id, username=username, tweets=tweets, pinnedTweet=pinnedTweet)

    def to_dict(self) -> dict:
        hash: dict = {}
        hash['id'] = from_UUID(self.id)
        hash['username'] = from_str(self.username)
        hash['tweets'] = self.tweets.to_dict()
        hash['pinnedTweet'] = None if self.pinnedTweet is None else self.pinnedTweet.to_dict()
        return hash


def from_MyTweets(x: Any) -> MyTweets:
    assert isinstance(x, MyTweets)
    return x
