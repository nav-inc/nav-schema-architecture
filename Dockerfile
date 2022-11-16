FROM registry.nav.engineering/goldmaster/node:ubuntu-20.04
# Tooling is mostly JS, starting from the node goldmaster

ARG GIT_USER
ARG GIT_ACCESS_TOKEN
ARG WORKDIR
ARG GOINSTALLPATH

ENV DEBIAN_FRONTEND noninteractive

RUN git config --global url."https://$GIT_USER:$GIT_ACCESS_TOKEN@git.nav.com/".insteadOf https://git.nav.com/

RUN apt-get update \
  && apt-get install -y \
  apt-transport-https \
  bc \
  build-essential \
  ca-certificates \
  curl \
  gcc \
  git \
  git-core \
  gnupg-agent \
  libcurl4-openssl-dev \
  libffi-dev \
  libreadline-dev \
  librsvg2-dev \
  libssl-dev \
  libxml2-dev \
  libxslt1-dev \
  libyaml-dev \
  make \
  nodejs \
  python3 \
  python3-pip \
  software-properties-common \
  yarn \
  zlib1g-dev \
  && rm -rf /var/lib/apt/lists/*

# Get Go and its dependencies
RUN curl -sSfL https://golang.org/dl/go1.16.8.linux-amd64.tar.gz | tar xz -C /usr/local

ENV GOPATH "${GOINSTALLPATH}"
RUN mkdir -p "$GOPATH/src" "$GOPATH/bin" && chmod -R 777 "$GOPATH"
ENV PATH $GOPATH/bin:/usr/local/go/bin:$PATH

WORKDIR $WORKDIR

COPY . .

RUN curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.27.0 \
  && mv ./bin/* /usr/local/bin/
RUN GO111MODULE=on go get -v -u github.com/ory/go-acc golang.org/x/tools/cmd/goimports github.com/client9/misspell/cmd/misspell cloud.google.com/go github.com/yoheimuta/protolint/cmd/protolint

RUN apt-add-repository ppa:brightbox/ruby-ng
RUN apt-get update \
  && apt-get install -y \
  ruby2.7 \
  ruby2.7-dev \
  && rm -rf /var/lib/apt/lists/*

RUN gem update --system
RUN gem install bundler rubocop

# Get python and its dependencies
RUN pip3 install --upgrade pip distlib setuptools
RUN pip3 install yapf unify bumpversion autoflake

# CHANGE THIS COMMENT TO FORCE A DOCKER IMAGE REBUILD 4
