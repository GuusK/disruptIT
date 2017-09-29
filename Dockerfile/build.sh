#!/bin/bash
docker build -t snic/disruptit:0.0.1 -f app.Dockerfile .
docker build -t snic/haproxy:0.0.1 -f haproxy.Dockerfile .