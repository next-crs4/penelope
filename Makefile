UNAME_S := $(shell uname -s)
USERID=$(shell id -u)
BRIDGE:=$(shell docker network ls | grep br01)

ifeq ($(UNAME_S), Darwin)
GROUPID=1000
else
GROUPID=$(shell id -g)
endif

start:
	docker-compose -f ./back/docker-compose.yml build --build-arg USER_ID=${USERID} --build-arg GROUP_ID=${GROUPID}
	docker-compose -f ./back/docker-compose.yml up -d
	docker-compose -f ./front/docker-compose.yml up -d

stop:
	docker-compose -f ./back/docker-compose.yml down
	docker-compose -f ./front/docker-compose.yml down
