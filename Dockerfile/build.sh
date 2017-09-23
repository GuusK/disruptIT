#!/bin/bash
ALL=false

if [[ $1 == "all" ]] ; then
	ALL=true
fi
echo $ALL
if [[ $1 == "app" ]] || [[ ALL ]] ; then
	docker build -t snic/disruptit:0.0.1 -f app.Dockerfile .
fi

if [[ $1 == "haproxy" ]] || [[ ALL ]] ; then
	docker build -t snic/haproxy:0.0.1 -f haproxy.Dockerfile .
fi