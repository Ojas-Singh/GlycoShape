#!/bin/sh

rm /mnt/database/DB_temp/GlycoShape.zip

for directory in /mnt/database/DB_temp/*/
do

# Making a zipped file for each glycan
cd $directory
glycan=$(basename "$directory")
echo $glycan
rm $glycan.zip
zip -r $directory/$glycan.zip $glycan.json $glycan.svg PDB_format_HETATM CHARMM_format_HETATM GLYCAM_format_HETATM PDB_format_ATOM CHARMM_format_ATOM GLYCAM_format_ATOM 

done

# Making a zipped file of each zipped file, with some file movement to allow us to delete all zipped apart from our one of interest
cd /mnt/database/DB_temo/
cp /mnt/database/DB_temp/*/*zip .
zip /mnt/database/DB_temp/GlycoShape.zip *zip
mv GlycoShape.zip ..
rm *zip
mv ../GlycoShape.zip .
