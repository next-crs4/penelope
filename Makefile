INIT_FILE=./front/html/app/init.module.js
ENV_FILE=./back/.env

UNAME_S := $(shell uname -s)
USERID=$(shell id -u)
BRIDGE:=$(shell docker network ls | grep br01)

ifeq ($(UNAME_S), Darwin)
GROUPID=1000
else
GROUPID=$(shell id -g)
endif



help:
	@echo " "
	@echo " Penelope - a complete LIMS for NGS Labs "
	@echo " https://github.com/next-crs4/penelope"
	@echo " "
	@echo " Please use \`make [options] <target>\` where <target> is one of"
	@echo "     start           bring up Penelope LIMS"
	@echo "     stop            bring down Penelope LIMS"
	@echo "     clean           remove Penelope LIMS from your computer"
	@echo "  "
	@echo " options:"
	@echo " 	LOG_PATH				destination folder of log files"
	@echo " 	ELK_HOST				the host of the Logstash server"
	@echo " 	ELK_PORT				the port of the Logstash server"

	@echo " usage: "
	@echo "		make LOG_PATH=/path/to/log/files [ELK_HOST=your-elk-site.com ELK_PORT=5044] start"
	@echo " "
	@echo " Docs: https://github.com/next-crs4/penelope/blob/master/README.md"
	@echo " "

start: check config
	docker-compose -f ./back/docker-compose.yml build --build-arg USER_ID=${USERID} --build-arg GROUP_ID=${GROUPID}
	docker-compose -f ./front/docker-compose.yml build
	docker-compose -f ./front/docker-compose.yml up -d
	docker-compose -f ./back/docker-compose.yml up -d

stop:
	docker-compose -f ./back/docker-compose.yml down
	docker-compose -f ./front/docker-compose.yml down

check:
ifndef LOG_PATH
	echo "ERROR: argument LOG_PATH is required" && exit 1
endif
	@[ -f ${INIT_FILE} ] || { echo "ERROR: init file (${INIT_FILE}) doesn't exist"; echo "exiting.."; exit 1; }
	@[ -f ${ENV_FILE} ] &&  { rm ${ENV_FILE}; }

config:
	@touch ${ENV_FILE}
ifdef LOG_PATH
	@mkdir -p ${LOG_PATH}
	@echo "LOG_PATH=${LOG_PATH}" >> ${ENV_FILE}
endif
ifdef ELK_HOST
	@echo "ELK_HOST=${ELK_HOST}" >> ${ENV_FILE}
endif
ifdef ELK_PORT
	@echo "ELK_PORT=${ELK_PORT}" >> ${ENV_FILE}
endif

clean: stop
	docker rmi back_back:latest
	docker rmi nginx:latest
	docker rmi python:3.8
