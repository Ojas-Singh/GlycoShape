#!/bin/bash

# Usage function
usage() {
    echo "Usage: $0 -e <email> [-t <default_temperature>] [-m <default_md_package>] [-ff <default_force_field>] [-p <default_pressure>] [-sc <default_salt_concentration>] [-c <default_comments>]"
    exit 1
}

# Function to check if glycan exists
check_exists() {
    local glycan_string="$1"
    local encoded_glycan=$(echo "$glycan_string" | sed -e 's/\[/\%5B/g' -e 's/\]/\%5D/g')
    local base_url="https://glycoshape.io/api/exist/"
    local query_url="${base_url}${encoded_glycan}"
    local response=$(curl -s "$query_url")
    echo "$response"
}

# Function to merge PDB files
merge_pdbs() {
    local output_file=$1
    shift
    # Initialize output file
    > "$output_file"
    # Loop through each input PDB file
    for pdb_file in "$@"; do
        if [ ! -f "$pdb_file" ]; then
            echo "File $pdb_file not found!"
            return 1
        fi
        # Append the content of the current PDB file to the output file
        cat "$pdb_file" >> "$output_file"
    done
    return 0
}

# Default values
email="silvia.dandrea.2023@mumail.ie"
temperature="300"
md_package="GROMACS"
force_field="GLYCAM_06j"
pressure="1"
salt_concentration="200"
comments=""

# Parse command line arguments
while getopts "e:t:m:ff:p:sc:c:" opt; do
    case $opt in
        e) email="$OPTARG" ;;
        t) temperature="$OPTARG" ;;
        m) md_package="$OPTARG" ;;
        ff) force_field="$OPTARG" ;;
        p) pressure="$OPTARG" ;;
        sc) salt_concentration="$OPTARG" ;;
        c) comments="$OPTARG" ;;
        *) usage ;;
    esac
done

# Loop over all directories in the current directory
for dir in */; do
    folder_name=$(basename "$dir")
    
    # Check if glycan exists on server
    response=$(check_exists "$folder_name")
    if [[ "$response" == '"exists":true' ]]; then
        echo "Skipping ${dir} as it already exists on the glycoshape.io server."
        continue
    fi

    # Array to store glycan.dry.pdb paths
    pdb_files=()
    mol2_file_found=false

    # Loop over all subdirectories
    all_have_glycan=true
    subfolder_count=0
    for subdir in "${dir}"*/; do
        glycan_pdb_path="${subdir}glycan.dry.pdb"
        glycan_mol2_path="${subdir}glycan.dry.mol2"
        ((subfolder_count++))

        # Check for glycan.dry.pdb files
        if [ -f "${glycan_pdb_path}" ]; then
            pdb_files+=("${glycan_pdb_path}")
        else
            echo "Missing glycan.dry.pdb in ${subdir}, skipping ${dir}."
            all_have_glycan=false
            break
        fi

        # Check and copy glycan.dry.mol2 if found
        if [ -f "${glycan_mol2_path}" ] && [ "$mol2_file_found" = false ]; then
            cp "${glycan_mol2_path}" "${dir}"
            mol2_file_found=true
            echo "Copied ${glycan_mol2_path} to ${dir}"
        fi
    done

    # Merge PDB files if all are present
    if [ "$all_have_glycan" = true ] && [ "${#pdb_files[@]}" -gt 0 ]; then
        if ! merge_pdbs "${dir}output.pdb" "${pdb_files[@]}"; then
            echo "Failed to merge PDB files for ${dir}"
            continue
        fi
    else
        echo "Skipping ${dir} as not all subdirectories have glycan.dry.pdb files."
        continue
    fi

    # Calculate simulation length
    simulation_length=$(echo "$subfolder_count * 0.5" | bc)

    # Find mol2 file
    if [ "$mol2_file_found" = false ]; then
        mol_file=$(find "${dir}" -name "glycan.dry.mol2" -type f | head -n 1)
    else
        mol_file=$(find "${dir}" -name "glycan.dry.mol2" -type f -maxdepth 1)
    fi

    if [ -z "$mol_file" ]; then
        echo "Molecular file (mol2) not found in any subdirectory of the folder ${dir}"
        continue
    fi

    # Define simulation file path
    simulation_file="${dir}/output.pdb"
    if [ ! -f "$simulation_file" ]; then
        echo "Simulation file not found at ${simulation_file}"
        continue
    fi

    # Submit to server
    curl -X POST https://glycoshape.io/api/submit \
        -F "simulationFile=@${simulation_file}" \
        -F "molFile=@${mol_file}" \
        -F "email=${email}" \
        -F "glycamName=${folder_name}" \
        -F "simulationLength=${simulation_length}" \
        -F "mdPackage=${md_package}" \
        -F "forceField=${force_field}" \
        -F "temperature=${temperature}" \
        -F "pressure=${pressure}" \
        -F "saltConcentration=${salt_concentration}" \
        -F "comments=${comments}" \
        -F "glyTouCanID=TODO"

    echo "Form submission completed for ${dir}."
done