#!/bin/bash
set -euo pipefail
psql -h localhost -U postgres -c "CREATE USER soulsync WITH PASSWORD 'soulsync' CREATEDB;"
psql -h localhost -U postgres -c "CREATE DATABASE soulsync OWNER soulsync;"
