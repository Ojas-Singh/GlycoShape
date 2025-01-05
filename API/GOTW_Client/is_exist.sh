#!/bin/bash
# Check if a Glycan string is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <GlycanString>"
  exit 1
fi
# Get the Glycan string from the first argument
glycan_string="$1"
# URL-encode the special characters [ and ]
encoded_glycan=$(echo "$glycan_string" | sed -e 's/\[/\%5B/g' -e 's/\]/\%5D/g')
# Define the base URL for the query
base_url="https://glycoshape.io/api/exist/"
# Complete URL for the curl request
query_url="${base_url}${encoded_glycan}"
# Query the server using curl
curl "$query_url"

