import os
import subprocess
from Bio.PDB import PDBParser
import requests
import re
import shutil

def extract_added_residues(file_content):
    added_residues_pattern = r"Added\s+(\d+)\s+residues"
    added_residues_match = re.search(added_residues_pattern, file_content)

    if added_residues_match:
        added_residues = int(added_residues_match.group(1))
        return added_residues
    else:
        return None

def extract_anions_cations(content):
    anions_pattern = r"requires\s*<i>([\d\.]+)</i>\s*anions"
    cations_pattern = r"<i>([\d\.]+)</i>\s*cations"

    anions_match = re.search(anions_pattern, content)
    cations_match = re.search(cations_pattern, content)

    if anions_match and cations_match:
        anions = float(anions_match.group(1))
        cations = float(cations_match.group(1))
        return anions, cations
    else:
        return None, None

def extract_charge(tleap_out_content):
    pattern = r"Total perturbed charge:\s+(-?\d+\.\d+)"
    match = re.search(pattern, tleap_out_content)
    
    if match:
        return float(match.group(1))
    else:
        raise ValueError("Total perturbed charge not found in the tLEaP output.")



def sltcap(data):
    url = "https://www.phys.ksu.edu/personal/schmit/SLTCAP/SLTCAP.pl"
    response = requests.post(url, data=data)

    if response.status_code == 200:
        print("Request was successful.")
        print("Response:")
        response_content = str(response.content)
        anions, cations = extract_anions_cations(response_content)
        print(f"Anions: {anions}")
        print(f"Cations: {cations}")
    else:
        print(f"Request failed with status code {response.status_code}.")
    return anions, cations


# Atomic masses in unified atomic mass units (Da)
atomic_masses = {
    "H": 1.00784,
    "C": 12.0107,
    "N": 14.0067,
    "O": 15.999,
    "P": 30.9738,
    "S": 32.065,
}

def calculate_mass(pdb_file):
    # Parse the PDB file
    parser = PDBParser()
    structure = parser.get_structure("protein", pdb_file)
    
    mass = 0
    for atom in structure.get_atoms():
        element = atom.element.strip().upper()
        if element in atomic_masses:
            mass += atomic_masses[element]
    
    # Convert to kDa
    mass_kda = mass / 1000
    return mass_kda

def create_tleap_input(folder_name, anions, cations, output_folder="output"):
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Create folder for the specified folder_name under output folder
    folder_path = os.path.join(output_folder, folder_name)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # Write tleap input file
    tleap_input = """set default PBradii mbondi2
source leaprc.GLYCAM_06j-1
source leaprc.water.tip3p
loadamberprep GLYCAM_06j-1_GAGS.prep
loadamberparams frcmod_gag

loadoff structure.off
check CONDENSEDSEQUENCE 
charge CONDENSEDSEQUENCE
solvateBox CONDENSEDSEQUENCE TIP3PBOX 12.0
addions CONDENSEDSEQUENCE Na+ """+str(int(cations))+"""
addions CONDENSEDSEQUENCE Cl- """+str(int(anions))+"""
saveamberparm CONDENSEDSEQUENCE system.prm7 system.rst7
quit

"""

    tleap_input_file = os.path.join(folder_path, "tleap.in")
    tleap_output_file = os.path.join(folder_path, "tleap.out")
    with open(tleap_input_file, "w") as f:
        f.write(tleap_input)

    return tleap_input_file,tleap_output_file

def run_tleap(tleap_input_file, tleap_output_file, folder_path):
    # Run tleap
    # command = f"tleap -s -f {tleap_input_file} > {tleap_output_file}"
    command = f"tleap -s -f tleap.in > tleap.out"
    process = subprocess.Popen(command, shell=True, cwd=folder_path)
    process.wait()
    # command = f"conda activate AmberTools23 && tleap -s -f {tleap_input_file} > {tleap_output_file}"
    # process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    # stdout, stderr = process.communicate()
    # print(stdout,stderr)

def run_acpype(folder_name):
    # Run acpype command
    command = "acpype -p system.prm7 -x system.rst7"
    process = subprocess.Popen(command, shell=True, cwd=folder_name)
    process.wait()

    # Move the generated .gro and .top files to the current directory
    mv_gro_command = "mv system.amb2gmx/system_GMX.gro ."
    mv_top_command = "mv system.amb2gmx/system_GMX.top ."
    process = subprocess.Popen(mv_gro_command, shell=True, cwd=folder_name)
    process.wait()
    process = subprocess.Popen(mv_top_command, shell=True, cwd=folder_name)
    process.wait()

    # Remove the system.amb2gmx directory
    rm_command = "rm -r system.amb2gmx"
    process = subprocess.Popen(rm_command, shell=True, cwd=folder_name)
    process.wait()
    

def main():
    anions = 0
    cations = 0
    added_residues = 0
    mass = calculate_mass("structure.pdb")
    folder_name = input("Enter the folder name: ")
    isExist = os.path.exists(f"output/{folder_name}")
    if not isExist:
        print(f"Creating a directory output/{folder_name} ...",)
        os.makedirs(f"output/{folder_name}")
    shutil.copy("structure.off", f"output/{folder_name}/structure.off")
    shutil.copy("structure.pdb", f"output/{folder_name}/structure.pdb")
    shutil.copy("run.sh", f"output/{folder_name}/run.sh")
    tleap_input_file, tleap_output_file = create_tleap_input(folder_name, anions, cations,)
    folder_path = os.path.join("output", folder_name)
    run_tleap(tleap_input_file, tleap_output_file, folder_path)
    with open(f"output/{folder_name}/tleap.out", "r") as f:
        tleap_out_content = f.read()
        added_residues = extract_added_residues(tleap_out_content)
        charge = extract_charge(tleap_out_content)
    data = {
        "ProteinMass": mass,
        "Concentration": 200,
        "SoluteCharges": charge,
        "BoxLength": "",
        "BoxLengthX": "",
        "BoxLengthY": "",
        "BoxLengthZ": "",
        "Molecules": added_residues,
        "BoxEdge": "",
        "ProteinAxis": "",
    }
    anions, cations = sltcap(data)
    print(f"Mass (kDa): {mass}")
    tleap_input_file, tleap_output_file = create_tleap_input(folder_name, anions, cations,)
    run_tleap(tleap_input_file, tleap_output_file, folder_path)
    print(f"Generated files saved in {folder_path}")

def copy_files(src_folder, dst_folder):
    """
    Copy all files from src_folder to dst_folder.

    Parameters:
    src_folder (str): The path to the source folder.
    dst_folder (str): The path to the destination folder.
    """
    if not os.path.exists(dst_folder):
        os.makedirs(dst_folder)
    
    for filename in os.listdir(src_folder):
        src_file = os.path.join(src_folder, filename)
        dst_file = os.path.join(dst_folder, filename)
        if os.path.isfile(src_file):
            shutil.copy(src_file, dst_file)

def process_app(folder_name,pdb,off,Concentration):
    anions = 0
    cations = 0
    added_residues = 0
    mass = calculate_mass(pdb)
    isExist = os.path.exists(f"output/{folder_name}")
    if not isExist:
        print(f"Creating a directory output/{folder_name} ...",)
        os.makedirs(f"output/{folder_name}")
    shutil.copy(off, f"output/{folder_name}/structure.off")
    shutil.copy(pdb, f"output/{folder_name}/structure.pdb")
    # shutil.copy("run.sh", f"output/{folder_name}/run.sh")
    tleap_input_file, tleap_output_file = create_tleap_input(folder_name, anions, cations,)
    folder_path = os.path.join("output", folder_name)
    run_tleap(tleap_input_file, tleap_output_file, folder_path)
    with open(f"output/{folder_name}/tleap.out", "r") as f:
        tleap_out_content = f.read()
        
        added_residues = extract_added_residues(tleap_out_content)
        charge = extract_charge(tleap_out_content)
    
    data = {
        "ProteinMass": mass,
        "Concentration": Concentration,
        "SoluteCharges": charge,
        "BoxLength": "",
        "BoxLengthX": "",
        "BoxLengthY": "",
        "BoxLengthZ": "",
        "Molecules": added_residues,
        "BoxEdge": "",
        "ProteinAxis": "",
    }
    anions, cations = sltcap(data)
    print(f"Mass (kDa): {mass}")
    tleap_input_file, tleap_output_file = create_tleap_input(folder_name, anions, cations,)
    run_tleap(tleap_input_file, tleap_output_file, folder_path)
    run_acpype(folder_path)
    copy_files("GOTW_Scripts",folder_path)
    print(f"Generated files saved in {folder_path}")
    return f"output/{folder_name}"

if __name__ == "__main__":
    main()
