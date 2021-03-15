INIT_FILE=./front/html/app/init.module.js

UNAME_S := $(shell uname -s)
USERID=$(shell id -u)
BRIDGE:=$(shell docker network ls | grep br01)

ifeq ($(UNAME_S), Darwin)
GROUPID=1000
else
GROUPID=$(shell id -g)
endif


start: check
	docker-compose -f ./back/docker-compose.yml build --build-arg USER_ID=${USERID} --build-arg GROUP_ID=${GROUPID}
	docker-compose -f ./back/docker-compose.yml up -d
	docker-compose -f ./front/docker-compose.yml up -d

stop:
	docker-compose -f ./back/docker-compose.yml down
	docker-compose -f ./front/docker-compose.yml down

check:
	@[ -f ${INIT_FILE} ] || { echo "ERROR: init file (${INIT_FILE}) doesn't exist"; echo "exiting.."; exit 1; }
