import pathlib
from setuptools import setup, find_packages

# The directory containing this file
HERE = pathlib.Path(__file__)

# The text of the README file
README = (HERE.parent.parent.parent / 'README.md').read_text()

setup(
    author='JJ Dubray',
    classifiers=['Programming Language :: Python :: 3.8'],
    description='Nav common data model and event formats',
    install_requires=['dateutil'],
    keywords='schema',
    long_description_content_type='text/markdown',
    long_description=README,
    name='nav-schema-architecture',
    packages=find_packages(include=['nsa', 'nsa.*']),
    package_data={'nsa': ['py.typed']},
    python_requires='>= 3.8',
    setup_requires='pip >= 18',
    url='https://git.nav.com/engineering/nav-schema-architecture/output/python',
    version='0.0.88',
)
