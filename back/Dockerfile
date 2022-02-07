FROM python:3.8

ARG USER_ID
ARG GROUP_ID
ARG LOG_PATH

ENV PYTHONUNBUFFERED 1
RUN mkdir /back
WORKDIR /back
COPY . /back/

RUN mkdir /config
ADD /config/requirements.pip /config/

RUN mkdir /logs
RUN mkdir /pids

RUN apt-get -qq update && \
    apt-get install --no-install-recommends -y apt-utils build-essential sshpass locales locales-all && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    /usr/local/bin/python -m pip install --upgrade pip && \
    pip install -r /config/requirements.pip && \
    rm -rf ~/.cache/ && \
    groupadd -g ${GROUP_ID} appuser && \
    useradd -m -u ${USER_ID} -g appuser appuser

# Set the locale
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

RUN chown appuser:appuser /pids
USER appuser
