#!/usr/bin/env bash

###############################################################################
# Title       : gotw.sh
# Description : A single script that can:
#               1) Download and unpack GOTW data from GlycoShape (`gotw`).
#               2) Submit the resulting data for simulation (`submit`).
#               3) Update itself from a GitHub RAW URL (`update`).
#               4) Display help usage (`-h` or `--help`).
#               5) Fetch WURCS from GlyTouCan ID, convert to GLYCAM, and show 
#                  a condensed GLYCAM URL in the terminal (`glytoucan`).
#               6) Convert a WURCS string to a condensed GLYCAM URL (`wurcs`).
#               7) Cleanup folders that already exist on the server (`cleanup`).
#               8) Check if a Glycam string exists on the GlycoShape server (`exist`).
# Author      : Ojas Singh
# Version     : 1.1.0
###############################################################################

SCRIPT_URL="https://raw.githubusercontent.com/Ojas-Singh/GlycoShape/refs/heads/main/API/GOTW_Client/gotw.sh"

# =============================================================================
# FUNCTIONS
# =============================================================================

usage() {
    cat <<EOF
Usage:
  $0 [COMMAND] [OPTIONS]

Commands:
  run <GLYCAM URL>    Download simulation files from the GlycoShape API,
                      and sbatch all replicas. (need GLYCAM json URL, when all minimizations are done, the link of "Download All")
  submit [OPTIONS]    Submit all finished simulation folder(s) to GlycoShape Server.
  update              Update this script to newer version.
  iupac <IUPAC>       Convert IUPAC condensed notation to GLYCAM via WURCS
                      and print a condensed GLYCAM URL.
  glytoucan <GTCID>   Fetch the WURCS from GlyTouCan ID via the GlyCosmos API, 
                      convert to GLYCAM, and print a condensed GLYCAM URL. (Glytoucan should have all defined linakge)
  wurcs <WURCS>       Convert a WURCS string to a condensed GLYCAM URL. (WURCS should have all defined linakge)
  cleanup             Delete folders if they already exist on the server.
  exist <GLYCAM>      Check if a Glycam string exists on the server.
  backup <folder> <username> <password> <destination>
                      Upload a folder to the user's ownCloud (drive.glycoshape.io) drive using WebDAV.
  -h, --help          Display this help message.

Options for 'submit' (optional):
  -e  <email>               Set the email address (default: name@email.com)
  -t  <temperature>         Set the temperature (default: 300)
  -m  <md_package>          Set the MD package (default: GROMACS)
  -ff <force_field>         Set the force field (default: GLYCAM_06j)
  -p  <pressure>            Set the pressure (default: 1)
  -sc <salt_concentration>  Set the salt concentration (default: 200)
  -c  <comments>            Add optional comments

Examples:
  1) Download GOTW zip, unpack, and run simulation:
       $0 run https://glycam.org/json/download/project/cb/ee185831-f02d-45d3-84c6-5f4ae74a7d47

  2) Submit with custom email:
       $0 submit -e mymail@example.com

  3) Update this script to the latest version:
       $0 update

  4) Convert a GlyTouCan ID to a GLYCAM condensed URL:
       $0 glytoucan G30370YC
  
  5) Convert Wurcs to GLYCAM condensed URL:
       $0 wurcs WURCS=2.0/5,9,8/[a2122h-1b_1-5_2*NCC/3=O][a1122h-1b_1-5][a1122h-1a_1-5][a2112h-1b_1-5][Aad21122h-2a_2-6_5*NCCO/3=O]/1-1-2-3-1-4-5-3-1/a4-b1_b4-c1_c3-d1_c6-h1_d2-e1_e4-f1_f6-g2_h2-i1
  
  6) Cleanup folders that already exist on the server:
       $0 cleanup
  7) Convert IUPAC condensed notation to GLYCAM URL:
       $0 iupac "Man(a1-3)[Man(a1-6)]Man(b1-4)GlcNAc(b1-4)GlcNAc(b1-"
EOF
}

# -----------------------------------------------------------------------------
# Updates this script from GitHub
# -----------------------------------------------------------------------------
update_script() {
    echo "Updating script from: $SCRIPT_URL"
    tmp_file=$(mktemp)
    if curl -fsSL "$SCRIPT_URL" -o "$tmp_file"; then
        chmod +x "$tmp_file"
        mv "$tmp_file" "$0"
        echo "Script updated successfully!"
    else
        echo "Failed to download update. Please check the URL or your network."
        rm -f "$tmp_file"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# GOTW FUNCTION: Download and unpack .zip, replicate folders, run sbatch
# -----------------------------------------------------------------------------
gotw_func() {
    local url="$1"
    if [ -z "$url" ]; then
        echo "Error: missing URL argument."
        echo "Usage: $0 run <GLYCAM URL>"
        exit 1
    fi

    local apiUrl="https://glycoshape.io"
    local response_headers
    response_headers=$(mktemp)
    local response_body
    response_body=$(mktemp)

    # POST request to GlycoShape
    curl -X POST -H "Content-Type: application/json" -d "{\"url\":\"$url\"}" \
      -D "$response_headers" -o "$response_body" "$apiUrl/api/gotw"

    local file_name
    file_name=$(grep -i 'x-filename:' "$response_headers" | awk '{print $2}' | tr -d '\r')

    if [ -z "$file_name" ]; then
        file_name="output.zip"
    fi

    mv "$response_body" "$file_name"
    rm "$response_headers"

    if file "$file_name" | grep -qi 'Zip archive data'; then
        local extract_dir="${file_name%.zip}"
        unzip "$file_name" -d "$extract_dir"
        echo "File extracted to $extract_dir/"

        local subfolders=()
        mapfile -t subfolders < <(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d)

        # Replicate folders
        if [ ${#subfolders[@]} -eq 1 ]; then
            cp -r "${subfolders[0]}" "${subfolders[0]}_2"
            cp -r "${subfolders[0]}" "${subfolders[0]}_3"
            subfolders+=("${subfolders[0]}_2" "${subfolders[0]}_3")
        elif [ ${#subfolders[@]} -eq 2 ]; then
            cp -r "${subfolders[0]}" "${subfolders[0]}_2"
            cp -r "${subfolders[1]}" "${subfolders[1]}_2"
            subfolders+=("${subfolders[0]}_2" "${subfolders[1]}_2")
        fi

        # Run sbatch gotw_iridis.sh if found
        for folder in "${subfolders[@]}"; do
            cd "$folder" || continue
            if [ -f gotw_iridis.sh ]; then
                sbatch gotw_iridis.sh
                echo "sbatch gotw_iridis.sh at $(pwd)"
            else
                echo "No gotw_iridis.sh in $(pwd)"
            fi
            cd - >/dev/null || exit
        done
    else
        echo "Downloaded file is not a zip archive."
    fi
}

# -----------------------------------------------------------------------------
# Helper for 'submit'
# -----------------------------------------------------------------------------
check_exists() {
    local glycan_string="$1"
    local encoded_glycan
    encoded_glycan=$(echo "$glycan_string" | sed -e 's/\[/\%5B/g' -e 's/\]/\%5D/g')
    local base_url="https://glycoshape.io/api/exist/"
    local query_url="${base_url}${encoded_glycan}"
    local response
    response=$(curl -s "$query_url")
    echo "$response"
}

merge_pdbs() {
    local output_file=$1
    shift

    # Skip if output file already exists
    if [ -f "$output_file" ]; then
        echo "Output file $output_file already exists, skipping merge."
        return 0
    fi

    # Initialize output file
    > "$output_file"

    for pdb_file in "$@"; do
        if [ ! -f "$pdb_file" ]; then
            echo "File $pdb_file not found!"
            return 1
        fi
        cat "$pdb_file" >> "$output_file"
    done
    return 0
}

# -----------------------------------------------------------------------------
# SUBMIT FUNCTION
# -----------------------------------------------------------------------------
submit_func() {
    local email="name@email.com"
    local temperature="300"
    local md_package="GROMACS"
    local force_field="GLYCAM_06j"
    local pressure="1"
    local salt_concentration="200"
    local comments=""

    while getopts "e:t:m:ff:p:sc:c:" opt; do
        case $opt in
            e) email="$OPTARG" ;;
            t) temperature="$OPTARG" ;;
            m) md_package="$OPTARG" ;;
            ff) force_field="$OPTARG" ;;
            p) pressure="$OPTARG" ;;
            sc) salt_concentration="$OPTARG" ;;
            c) comments="$OPTARG" ;;
            *)
                usage
                exit 1
                ;;
        esac
    done

    for dir in */; do
        [ -d "$dir" ] || continue

        local folder_name
        folder_name=$(basename "$dir")

        local response
        response=$(check_exists "$folder_name")

        if [[ "$response" == *'"exists":true'* ]]; then
            echo "Skipping ${dir} as it already exists on the glycoshape.io server."
            continue
        fi

        local pdb_files=()
        local mol2_file_found=false
        local info_json_found=false
        local subfolder_count=0
        local all_have_glycan=true

        # --------------------------------------------
        #  Gather pdb, mol2, and optionally info.json
        # --------------------------------------------
        for subdir in "${dir}"*/; do
            [ -d "$subdir" ] || continue

            local glycan_pdb_path="${subdir}glycan.dry.pdb"
            local glycan_mol2_path="${subdir}glycan.dry.mol2"
            local glycan_info_json_path="${subdir}info.json"
            ((subfolder_count++))

            # Check for glycan.dry.pdb
            if [ -f "$glycan_pdb_path" ]; then
                pdb_files+=("$glycan_pdb_path")
            else
                echo "Missing glycan.dry.pdb in ${subdir}, skipping ${dir}."
                all_have_glycan=false
                break
            fi

            # Copy the first glycan.dry.mol2 to outer directory if found
            if [ -f "$glycan_mol2_path" ] && [ "$mol2_file_found" = false ]; then
                cp "$glycan_mol2_path" "$dir"
                mol2_file_found=true
                echo "Copied ${glycan_mol2_path} to ${dir}"
            fi

            # Copy the first info.json to outer directory if found
            if [ -f "$glycan_info_json_path" ] && [ "$info_json_found" = false ]; then
                cp "$glycan_info_json_path" "$dir"
                info_json_found=true
                echo "Copied ${glycan_info_json_path} to ${dir}"
            fi
        done

        if [ "$all_have_glycan" = false ] || [ "${#pdb_files[@]}" -eq 0 ]; then
            echo "Skipping ${dir} as not all subdirectories have glycan.dry.pdb files."
            continue
        fi

        # --------------------------------------------
        #  Merge PDBs and handle simulation length
        # --------------------------------------------
        if ! merge_pdbs "${dir}output.pdb" "${pdb_files[@]}"; then
            echo "Failed to merge PDB files for ${dir}"
            continue
        fi

        local simulation_length
        simulation_length=$(echo "$subfolder_count * 0.5" | bc)

        # Check if we have the .mol2 in the outer directory (or fallback search)
        local mol_file
        if [ "$mol2_file_found" = false ]; then
            mol_file=$(find "$dir" -name "glycan.dry.mol2" -type f | head -n 1)
        else
            mol_file=$(find "$dir" -maxdepth 1 -name "glycan.dry.mol2" -type f)
        fi

        if [ -z "$mol_file" ]; then
            echo "No glycan.dry.mol2 found in ${dir}"
            continue
        fi

        # Check if we have info.json in the outer directory
        local info_json_file
        info_json_file=$(find "$dir" -maxdepth 1 -name "info.json" -type f)

        local simulation_file="${dir}output.pdb"
        if [ ! -f "$simulation_file" ]; then
            echo "Simulation file not found at ${simulation_file}"
            continue
        fi

        # --------------------------------------------
        #  Upload
        # --------------------------------------------
        echo "Uploading ${dir}..."

        # Build the curl command
        # We'll add -F infoJson=... only if info_json_file is non-empty
        curl_cmd=(
            curl -X POST https://glycoshape.io/api/submit
            -F "simulationFile=@${simulation_file}"
            -F "molFile=@${mol_file}"
            -F "email=${email}"
            -F "glycamName=${folder_name}"
            -F "simulationLength=${simulation_length}"
            -F "mdPackage=${md_package}"
            -F "forceField=${force_field}"
            -F "temperature=${temperature}"
            -F "pressure=${pressure}"
            -F "saltConcentration=${salt_concentration}"
            -F "comments=${comments}"
            -F "glyTouCanID=TODO"
            --output /dev/null
            --write-out "%{http_code}\n"
            --progress-bar
        )

        # If info.json exists, add it
        if [ -n "$info_json_file" ]; then
            curl_cmd+=( -F "infoJson=@${info_json_file}" )
        fi

        # Execute the curl command
        "${curl_cmd[@]}"

        echo -e "\nForm submission completed for ${dir}."
    done
}

# -----------------------------------------------------------------------------
# GLYTOUCAN FUNCTION
# -----------------------------------------------------------------------------
glytoucan_func() {
    local gtcid="$1"
    if [ -z "$gtcid" ]; then
        echo "Error: missing GlyTouCan ID."
        usage
        exit 1
    fi

    # Step 1: Fetch WURCS for the GlyTouCan ID
    local wurcs_response
    wurcs_response=$(curl -s -d "gtcid=${gtcid}" https://api.glycosmos.org/sparqlist/gtcid2seqs)

    # Extract the WURCS string using grep
    local wurcs
    wurcs=$(echo "$wurcs_response" | grep -oP '"wurcs":\s*"\K[^"]+')

    if [ -z "$wurcs" ]; then
        echo "Error: No WURCS found for GlyTouCan ID: $gtcid"
        exit 1
    fi


    # Step 2: Convert WURCS to GLYCAM
    local glycam_response
    glycam_response=$(curl -s -d "[\"$wurcs\"]" https://api.glycosmos.org/glycanformatconverter/2.10.4/wurcs2glycam)

    # Extract the GLYCAM string using grep
    local glycam
    glycam=$(echo "$glycam_response" | grep -oP '"GLYCAM":\s*"\K[^"]+')

    if [ -z "$glycam" ]; then
        echo "Error: No GLYCAM found for WURCS: $wurcs"
        exit 1
    fi

    # Step 3: Print the condensed GLYCAM URL
    echo "https://glycam.org/url/condensed/${glycam}"
}

# -----------------------------------------------------------------------------
# WURCS TO GLYCAM FUNCTION: Convert WURCS to GLYCAM URL
# -----------------------------------------------------------------------------
wurcs_to_glycam_func() {
    local wurcs="$1"
    if [ -z "$wurcs" ]; then
        echo "Error: missing WURCS string."
        echo "Usage: $0 wurcs <WURCS>"
        exit 1
    fi

    # Convert WURCS to GLYCAM using Glycosmos API
    local glycam_response
    glycam_response=$(curl -s -d "[\"$wurcs\"]" https://api.glycosmos.org/glycanformatconverter/2.10.4/wurcs2glycam)

    # Extract the GLYCAM string from the response
    local glycam
    glycam=$(echo "$glycam_response" | grep -oP '"GLYCAM":\s*"\K[^"]+')

    if [ -z "$glycam" ]; then
        echo "Error: No GLYCAM found for WURCS: $wurcs"
        exit 1
    fi

    # Print the condensed GLYCAM URL
    echo "https://glycam.org/url/condensed/${glycam}"
}

# -----------------------------------------------------------------------------
# IUPAC TO GLYCAM FUNCTION: Convert IUPAC to GLYCAM URL via WURCS
# -----------------------------------------------------------------------------
iupac_to_glycam_func() {
    local iupac="$1"
    if [ -z "$iupac" ]; then
        echo "Error: missing IUPAC string."
        echo "Usage: $0 iupac <IUPAC>"
        exit 1
    fi
    
    # Ensure the IUPAC string ends with one of (a1-), (a1-, (b1-), or (b1- if it doesn't already
    if ! [[ "$iupac" =~ \([ab]1-\)$ ]] && ! [[ "$iupac" =~ \([ab]1-$ ]]; then
        iupac="${iupac}(a1-"
    fi
    
    echo "Processing IUPAC: $iupac"
    
    # Step 1: Convert IUPAC to WURCS using Glycosmos API
    local wurcs_response
    wurcs_response=$(curl -s -d "[\"$iupac\"]" https://api.glycosmos.org/glycanformatconverter/2.10.4/iupaccondensed2wurcs)
    
    # Extract the WURCS string from the response
    local wurcs
    wurcs=$(echo "$wurcs_response" | grep -oP '"wurcs":\s*"\K[^"]+')
    
    if [ -z "$wurcs" ]; then
        echo "Error: No WURCS found for IUPAC: $iupac"
        echo "API Response: $wurcs_response"
        exit 1
    fi
    
    echo "Converted to WURCS: $wurcs"
    
    # Step 2: Convert WURCS to GLYCAM
    local glycam_response
    glycam_response=$(curl -s -d "[\"$wurcs\"]" https://api.glycosmos.org/glycanformatconverter/2.10.4/wurcs2glycam)
    
    # Extract the GLYCAM string from the response
    local glycam
    glycam=$(echo "$glycam_response" | grep -oP '"GLYCAM":\s*"\K[^"]+')
    
    if [ -z "$glycam" ]; then
        echo "Error: No GLYCAM found for WURCS: $wurcs"
        echo "API Response: $glycam_response"
        exit 1
    fi
    
    echo "Converted to GLYCAM: $glycam"
    
    # Step 3: Print the condensed GLYCAM URL
    echo "GLYCAM URL: https://glycam.org/url/condensed/${glycam}"
}

# -----------------------------------------------------------------------------
# CLEANUP FUNCTION: Delete folders if they already exist on the server
# -----------------------------------------------------------------------------
cleanup_func() {
    for dir in */; do
        # Skip if not a directory
        [ -d "$dir" ] || continue

        # Get the folder name
        local folder_name
        folder_name=$(basename "$dir")

        # Check if the folder exists on the server
        local response
        response=$(check_exists "$folder_name")

        # If the folder exists, delete it
        if [[ "$response" == *'"exists":true'* ]]; then
            echo "Deleting folder '${folder_name}' as it exists on the server."
            rm -rf "$dir"
        else
            echo "Skipping folder '${folder_name}' as it does not exist on the server."
        fi
    done
}


# -----------------------------------------------------------------------------
# UPLOAD FUNCTION: Upload a folder to the user's ownCloud drive using WebDAV
# -----------------------------------------------------------------------------
upload_func() {
    local folder="$1"
    local username="$2"
    local password="$3"
    local destination="$4"

    # Validate inputs
    if [ -z "$folder" ] || [ -z "$username" ] || [ -z "$password" ] || [ -z "$destination" ]; then
        echo "Error: Missing required arguments"
        echo "Usage: $0 backup <folder> <username> <password> <destination>"
        return 1
    fi

    # Ensure folder exists
    if [ ! -d "$folder" ]; then
        echo "Error: Folder '$folder' not found"
        return 1
    fi

    # Base WebDAV URL
    local base_url="https://drive.glycoshape.io/remote.php/dav/files/${username}/${destination}"
    
    # Create base directory
    curl -s -u "${username}:${password}" -X MKCOL "${base_url}" || true

    # Upload files
    find "$folder" -type f -print0 | while IFS= read -r -d '' file; do
        # Get relative path
        local rel_path="${file#$folder/}"
        local dir_path=$(dirname "$rel_path")
        
        # Create remote directory structure
        if [ "$dir_path" != "." ]; then
            local current_path=""
            local IFS='/'
            read -ra DIRS <<< "$dir_path"
            for dir in "${DIRS[@]}"; do
                current_path="${current_path}${dir}/"
                local dir_url="${base_url}/${current_path}"
                dir_url=$(echo "$dir_url" | sed 's/ /%20/g' | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
                curl -s -u "${username}:${password}" -X MKCOL "$dir_url" || true
            done
        fi

        # Prepare upload URL, encode special chars
        local upload_url="${base_url}/${rel_path}"
        upload_url=$(echo "$upload_url" | sed 's/ /%20/g; s/\[/%5B/g; s/\]/%5D/g; s/#/%23/g')

        echo "Uploading: $file -> $upload_url"
        # Only show progress bar and success/failure messages
        if curl --globoff --progress-bar -u "${username}:${password}" -T "$file" "$upload_url" -H "Overwrite: T" \
            2> >(awk '!/^</' >&2) \
            > /dev/null 2>/dev/null; then
            echo "✓ Uploaded: $file"
        else 
            echo "✗ Failed to upload: $file"
        fi
    done
}


# =============================================================================
# MAIN DISPATCH
# =============================================================================
if [ $# -eq 0 ]; then
    usage
    exit 0
fi

command="$1"
shift

case "$command" in
    -h|--help)
        usage
        exit 0
        ;;
    update)
        update_script
        ;;
    run)
        gotw_func "$@"
        ;;
    submit)
        submit_func "$@"
        ;;
    iupac)
        iupac_to_glycam_func "$@"
        ;;
    glytoucan)
        glytoucan_func "$@"
        ;;
    wurcs)
        wurcs_to_glycam_func "$@"
        ;;
    cleanup)
        cleanup_func
        ;;
    exist)
        check_exists "$@"
        ;;  
    backup)
        upload_func "$@"
        ;;

    *)
        echo "Error: Unknown command '$command'"
        echo "Try '$0 --help' for usage."
        exit 1
        ;;
esac
