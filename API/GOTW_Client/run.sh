#!/bin/bash
# Check if the URL argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <url>"
  exit 1
fi
url=$1
apiUrl="https://glycoshape.io"  # Replace with your actual API base URL
# Temporary files to store response headers and body
response_headers=$(mktemp)
response_body=$(mktemp)
# Send POST request to the API
curl -X POST -H "Content-Type: application/json" -d "{\"url\":\"$url\"}" \
  -D $response_headers -o $response_body "$apiUrl/api/gotw"
# Extract the file name from the headers
file_name=$(grep -i 'x-filename:' $response_headers | awk '{print $2}' | tr -d '\r')
# Set default file name if not found in headers
if [ -z "$file_name" ]; then
  file_name="output.zip"
fi
# Move the downloaded file to the correct name
mv $response_body $file_name
rm $response_headers
# Check if the file is a zip archive and extract it
if file "$file_name" | grep -q 'Zip archive data'; then
  extract_dir="${file_name%.zip}"
  unzip $file_name -d "$extract_dir"
  echo "File extracted to $extract_dir/"
  # Get the list of subfolders in the extracted directory
  subfolders=($(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d))
  # Handling the cases with 1 or 2 subfolders
  if [ ${#subfolders[@]} -eq 1 ]; then
    # If there's only one folder, make two copies with _2 and _3 suffixes
    cp -r "${subfolders[0]}" "${subfolders[0]}_2"
    cp -r "${subfolders[0]}" "${subfolders[0]}_3"
    subfolders+=("${subfolders[0]}_2" "${subfolders[0]}_3")
  elif [ ${#subfolders[@]} -eq 2 ]; then
    # If there are two folders, make one copy of each with _2 suffix
    cp -r "${subfolders[0]}" "${subfolders[0]}_2"
    cp -r "${subfolders[1]}" "${subfolders[1]}_2"
 subfolders+=("${subfolders[0]}_2" "${subfolders[1]}_2")
  fi
  # Navigate into each folder within the extracted directory and run the sbatch command
  for folder in "${subfolders[@]}"; do
    cd "$folder"
    if [ -f gotw_meluxina.sh ]; then
        sbatch gotw_iridis.sh
        echo "sbatch gotw_iridis.sh at $(pwd)"
    else
      echo "No gotw_iridis.sh in $(pwd)"
    fi
    cd - > /dev/null
  done
else
  echo "Downloaded file is not a zip archive."
fi