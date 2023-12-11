#!/usr/bin/env python3

import os
import re
import glob
import shutil

directories = glob.glob("/mnt/database/DB_temp/*/")
for directory in directories:
    print(f"Converting for {directory.split('/')[-2]}")
    
    os.chdir(directory)
    if os.path.exists("GLYCAM_format_ATOM"):
        shutil.rmtree("GLYCAM_format_ATOM")
        shutil.rmtree("PDB_format_ATOM")
        shutil.rmtree("CHARMM_format_ATOM")
        shutil.rmtree("GLYCAM_format_HETATM")
        shutil.rmtree("PDB_format_HETATM")
        shutil.rmtree("CHARMM_format_HETATM")
    os.mkdir("GLYCAM_format_ATOM")
    os.mkdir("PDB_format_ATOM")
    os.mkdir("CHARMM_format_ATOM")
    os.mkdir("GLYCAM_format_HETATM")
    os.mkdir("PDB_format_HETATM")
    os.mkdir("CHARMM_format_HETATM")

    pdb_files = glob.glob("*pdb")
    for pdb in pdb_files:

        # Tidied GLYCAM name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        filedata = filedata.replace("ATOM  ", "HETATM")
        with open(f"GLYCAM_format_HETATM/{pdb.split('.')[0]}.pdb", 'w') as file:
            file.write(filedata)

        # Tidied PDB name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        filedata = filedata.replace("ATOM  ", "HETATM")
        filedata = re.sub("\s\wYA", " NDG", filedata) # GlcNAc alpha
        filedata = re.sub("\s\wYB", " NAG", filedata) # GlcNAc beta
        filedata = re.sub("\s\wVA", " A2G", filedata) # GalNAc alpha
        filedata = re.sub("\s\wVB", " NGA", filedata) # GalNAc beta
        filedata = re.sub("\s\wGA", " GLC", filedata) # Glc alpha
        filedata = re.sub("\s\wGB", " BGC", filedata) # Glc beta
        filedata = re.sub("\s\wGL", " NGC", filedata) # Neu5Gc alpha
        filedata = re.sub("\s\wLA", " GLA", filedata) # Gal alpha
        filedata = re.sub("\s\wLB", " GAL", filedata) # Gal beta
        filedata = re.sub("\s\wfA", " AFL", filedata) # L-Fuc alpha
        filedata = re.sub("\s\wfB", " FUL", filedata) # L-Fuc beta
        filedata = re.sub("\s\wMB", " BMA", filedata) # Man beta
        filedata = re.sub("\s\wMA", " MAN", filedata) # Man alpha
        filedata = re.sub("\s\wSA", " SIA", filedata) # Neu5Ac alpha
        filedata = re.sub("\s\wSA", " SLB", filedata) # Neu5Ac beta
        filedata = re.sub("\s\wZA", " GCU", filedata) # GlcA alpha
        filedata = re.sub("\s\wZB", " BDP", filedata) # GlcA beta
        filedata = re.sub("\s\wXA", " XYS", filedata) # Xyl alpha
        filedata = re.sub("\s\wXB", " XYP", filedata) # Xyl beta
        filedata = re.sub("\s\wuA", " IDR", filedata) # IdoA alpha
        filedata = re.sub("\s\whA", " RAM", filedata) # Rha alpha
        filedata = re.sub("\s\whB", " RHM", filedata) # Rha beta
        filedata = re.sub("\s\wRA", " RIB", filedata) # Rib alpha
        filedata = re.sub("\s\wRB", " BDR", filedata) # Rib beta
        filedata = re.sub("\s\wAA", " ARA", filedata) # Ara alpha
        filedata = re.sub("\s\wAB", " ARB", filedata) # Ara beta
        with open(f"PDB_format_HETATM/{pdb.split('.')[0]}.PDB.pdb", 'w') as file:
            file.write(filedata)

        # Tidied CHARMM name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        filedata = filedata.replace("ATOM  ", "HETATM")
        filedata = re.sub("\s\wYA ", " AGLC", filedata) # GlcNAc alpha
        filedata = re.sub("\s\wYB ", " BGLC", filedata) # GlcNAc beta
        filedata = re.sub("\s\wVA ", " AGAL", filedata) # GalNAc alpha
        filedata = re.sub("\s\wVB ", " BGAL", filedata) # GalNAc beta
        filedata = re.sub("\s\wGA ", " AGLC", filedata) # Glc alpha
        filedata = re.sub("\s\wGB ", " BGLC", filedata) # Glc beta
        filedata = re.sub("\s\wLA ", " AGAL", filedata) # Gal alpha
        filedata = re.sub("\s\wLB ", " BGAL", filedata) # Gal beta
        filedata = re.sub("\s\wf[A|B]", " FUC", filedata) # Fuc alpha and beta
        filedata = re.sub("\s\wMA ", " AMAN", filedata) # Man alpha
        filedata = re.sub("\s\wMB ", " BMAN", filedata) # Man beta
        filedata = re.sub("\s\wSA ", " ANE5", filedata) # Neu5Ac alpha
        filedata = re.sub("\s\wGL ", " ANE5", filedata) # Neu5Gc 
        filedata = re.sub("\s\wXA ", " AXYL", filedata) # Xyl alpha
        filedata = re.sub("\s\wXB ", " BXYL", filedata) # Xyl beta
        filedata = re.sub("\s\wuA ", " AIDO", filedata) # IdoA alpha
        filedata = re.sub("\s\wZA ", " AGLC", filedata) # GlcA alpha
        filedata = re.sub("\s\wZB ", " BGLC", filedata) # GlcA beta
        filedata = re.sub("\s\whA ", " ARHM", filedata) # Rha alpha
        filedata = re.sub("\s\whB ", " BRHM", filedata) # Rha beta
        filedata = re.sub("\s\wAA ", " AARB", filedata) # Ara alpha
        filedata = re.sub("\s\wAB ", " BARB", filedata) # Ara beta
        filedata = re.sub("\s\wRA ", " ARIB", filedata) # Rib alpha
        filedata = re.sub("\s\wRB ", " BRIB", filedata) # Rib beta
        with open(f"CHARMM_format_HETATM/{pdb.split('.')[0]}.CHARMM.pdb", 'w') as file:
            file.write(filedata)

        with open("CHARMM_format_HETATM/README.txt", "w") as file:
            file.write("Warning:\n\nSome Glycan residues in the CHARMM naming format have residue names longer than the maximum four characters that are permitted in the PDB format. Therefore, it can be difficult to differentiate between similar residues (i.e. Glc and GlcNAc) on their residue name alone.")

        # Tidied GLYCAM name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        with open(f"GLYCAM_format_ATOM/{pdb.split('.')[0]}.pdb", 'w') as file:
            file.write(filedata)

        # Tidied PDB name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        filedata = re.sub("\s\wYA", " NDG", filedata) # GlcNAc alpha
        filedata = re.sub("\s\wYB", " NAG", filedata) # GlcNAc beta
        filedata = re.sub("\s\wVA", " A2G", filedata) # GalNAc alpha
        filedata = re.sub("\s\wVB", " NGA", filedata) # GalNAc beta
        filedata = re.sub("\s\wGA", " GLC", filedata) # Glc alpha
        filedata = re.sub("\s\wGB", " BGC", filedata) # Glc beta
        filedata = re.sub("\s\wGL", " NGC", filedata) # Neu5Gc alpha
        filedata = re.sub("\s\wLA", " GLA", filedata) # Gal alpha
        filedata = re.sub("\s\wLB", " GAL", filedata) # Gal beta
        filedata = re.sub("\s\wfA", " AFL", filedata) # L-Fuc alpha
        filedata = re.sub("\s\wfB", " FUL", filedata) # L-Fuc beta
        filedata = re.sub("\s\wMB", " BMA", filedata) # Man beta
        filedata = re.sub("\s\wMA", " MAN", filedata) # Man alpha
        filedata = re.sub("\s\wSA", " SIA", filedata) # Neu5Ac alpha
        filedata = re.sub("\s\wSA", " SLB", filedata) # Neu5Ac beta
        filedata = re.sub("\s\wZA", " GCU", filedata) # GlcA alpha
        filedata = re.sub("\s\wZB", " BDP", filedata) # GlcA beta
        filedata = re.sub("\s\wXA", " XYS", filedata) # Xyl alpha
        filedata = re.sub("\s\wXB", " XYP", filedata) # Xyl beta
        filedata = re.sub("\s\wuA", " IDR", filedata) # IdoA alpha
        filedata = re.sub("\s\whA", " RAM", filedata) # Rha alpha
        filedata = re.sub("\s\whB", " RHM", filedata) # Rha beta
        filedata = re.sub("\s\wRA", " RIB", filedata) # Rib alpha
        filedata = re.sub("\s\wRB", " BDR", filedata) # Rib beta
        filedata = re.sub("\s\wAA", " ARA", filedata) # Ara alpha
        filedata = re.sub("\s\wAB", " ARB", filedata) # Ara beta
        with open(f"PDB_format_ATOM/{pdb.split('.')[0]}.PDB.pdb", 'w') as file:
            file.write(filedata)

        # Tidied CHARMM name..
        with open(pdb, 'r') as file:
            filedata = file.read()
        filedata = re.sub("\s\wYA ", " AGLC", filedata) # GlcNAc alpha
        filedata = re.sub("\s\wYB ", " BGLC", filedata) # GlcNAc beta
        filedata = re.sub("\s\wVA ", " AGAL", filedata) # GalNAc alpha
        filedata = re.sub("\s\wVB ", " BGAL", filedata) # GalNAc beta
        filedata = re.sub("\s\wGA ", " AGLC", filedata) # Glc alpha
        filedata = re.sub("\s\wGB ", " BGLC", filedata) # Glc beta
        filedata = re.sub("\s\wLA ", " AGAL", filedata) # Gal alpha
        filedata = re.sub("\s\wLB ", " BGAL", filedata) # Gal beta
        filedata = re.sub("\s\wf[A|B]", " FUC", filedata) # Fuc alpha and beta
        filedata = re.sub("\s\wMA ", " AMAN", filedata) # Man alpha
        filedata = re.sub("\s\wMB ", " BMAN", filedata) # Man beta
        filedata = re.sub("\s\wSA ", " ANE5", filedata) # Neu5Ac alpha
        filedata = re.sub("\s\wGL ", " ANE5", filedata) # Neu5Gc 
        filedata = re.sub("\s\wXA ", " AXYL", filedata) # Xyl alpha
        filedata = re.sub("\s\wXB ", " BXYL", filedata) # Xyl beta
        filedata = re.sub("\s\wuA ", " AIDO", filedata) # IdoA alpha
        filedata = re.sub("\s\wZA ", " AGLC", filedata) # GlcA alpha
        filedata = re.sub("\s\wZB ", " BGLC", filedata) # GlcA beta
        filedata = re.sub("\s\whA ", " ARHM", filedata) # Rha alpha
        filedata = re.sub("\s\whB ", " BRHM", filedata) # Rha beta
        filedata = re.sub("\s\wAA ", " AARB", filedata) # Ara alpha
        filedata = re.sub("\s\wAB ", " BARB", filedata) # Ara beta
        filedata = re.sub("\s\wRA ", " ARIB", filedata) # Rib alpha
        filedata = re.sub("\s\wRB ", " BRIB", filedata) # Rib beta
        with open(f"CHARMM_format_ATOM/{pdb.split('.')[0]}.CHARMM.pdb", 'w') as file:
            file.write(filedata)

        with open("CHARMM_format_ATOM/README.txt", "w") as file:
            file.write("Warning:\n\nSome Glycan residues in the CHARMM naming format have residue names longer than the maximum four characters that are permitted in the PDB format. Therefore, it can be difficult to differentiate between similar residues (i.e. Glc and GlcNAc) on their residue name alone.")


        os.remove(pdb)
        