#!/bin/bash

#chmod +x merge.sh
# Check if at least two arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 output_file.pdb input_file1.pdb [input_file2.pdb ...]"
    exit 1
fi

# Output file
output_file=$1
shift  # Remove the output file from the arguments

# Initialize output file
> $output_file

# Loop through each input PDB file
for pdb_file in "$@"; do
    if [ ! -f "$pdb_file" ]; then
        echo "File $pdb_file not found!"
        exit 1
    fi

    # Append the content of the current PDB file to the output file
    cat "$pdb_file" >> $output_file
done

echo "All PDB files have been merged into $output_file."