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
	@echo " To redirect logs on a ELK stack a, digit: "
	@echo "		make ELK_HOST=your-elk-site.com ELK_PORT=5044 start"
	@echo " "
	@echo " Docs: https://github.com/next-crs4/penelope/blob/master/README.md"
	@echo " "

start: check config
	docker-compose -f ./back/docker-compose.yml build --build-arg USER_ID=${USERID} --build-arg GROUP_ID=${GROUPID}
	docker-compose -f ./front/docker-compose.yml up -d
	docker-compose -f ./back/docker-compose.yml up -d

stop:
	docker-compose -f ./back/docker-compose.yml down
	docker-compose -f ./front/docker-compose.yml down

check:
	@[ -f ${INIT_FILE} ] || { echo "ERROR: init file (${INIT_FILE}) doesn't exist"; echo "exiting.."; exit 1; }
	if [ -f ${ENV_FILE} ]; then  rm ${ENV_FILE}; fi;

config:
	touch ${ENV_FILE}
ifdef ELK_HOST
	echo "ELK_HOST=${ELK_HOST}" >> ${ENV_FILE}
endif
ifdef ELK_PORT
	echo "ELK_PORT=${ELK_PORT}" >> ${ENV_FILE}
endif

clean: stop
	docker rmi back_back:latest
	docker rmi nginx:latest
	docker rmi python:2.7
