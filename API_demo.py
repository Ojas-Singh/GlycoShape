import requests
import os
import json
from datetime import datetime

# Constants
API_BASE_URL = "https://glycoshape.org" #GlycoShape API URL
UPLOAD_ENDPOINT = "/api/upload_pdb"
PROCESS_ENDPOINT = "/api/process_pdb"
UPLOAD_DIR = "output"  # Local directory to save downloaded PDB files

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def upload_pdb(file_path):
    """Uploads a PDB file and gets glycosylation configurations."""
    with open(file_path, 'rb') as file:
        files = {'pdbFile': file}
        response = requests.post(API_BASE_URL + UPLOAD_ENDPOINT, files=files)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error uploading PDB file: {response.json()}")

def process_pdb(uniprot_id, glycan_configurations):
    """Processes a PDB file with given glycan configurations."""
    data = {
        'uniprotID': uniprot_id,
        'selectedGlycans': glycan_configurations
    }
    response = requests.post(API_BASE_URL + PROCESS_ENDPOINT, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error processing PDB file: {response.json()}")

def download_processed_pdb(file_name):
    """Downloads the processed PDB file."""
    response = requests.get(f"{API_BASE_URL}/output/{file_name}")
    if response.status_code == 200:
        with open(os.path.join(UPLOAD_DIR, file_name), 'wb') as file:
            file.write(response.content)
    else:
        raise Exception("Error downloading processed PDB file")

def main():
    # Example usage
    pdb_file_path = 'AF-P63279-F1-model_v4.pdb'  # Replace with actual PDB file path
    upload_response = upload_pdb(pdb_file_path)


#       Response layout of upload_pdb
#     {
#     "configuration": [     -----> This is the glycan_configurations we use for the next step
#         {
#             "glycanIDs": [
#                 "Fuc(a1-3)[Gal(b1-4)]GlcNAc(b1-3)Gal(b1-4)[Fuc(a1-3)]GlcNAc(b1-4)Glc",
#                 "GlcNAc(b1-6)GalNAc",
#                 "GlcNAc"
#             ],
#             "residueChain": "A",
#             "residueID": 2,
#             "residueName": "SER",
#             "residueTag": 2
#         },
#         {
#             "glycanIDs": [
#                 "GlcNAc(b1-6)GalNAc",
#                 "GlcNAc(a1-4)Gal(b1-4)GlcNAc(b1-6)[GlcNAc(a1-4)Gal(b1-3)]GalNAc",
#                 "Neu5Ac(a2-3)Gal(b1-4)GlcNAc(b1-3)GalNAc",
#                 "GlcNAc"
#             ],
#             "residueChain": "A",
#             "residueID": 135,
#             "residueName": "THR",
#             "residueTag": 135
#         }
#     ],
#     "glycosylation_locations": {   -----> This is the glycosylation_locations not relevant here
#         "glycosylations": [
#             [
#                 2,
#                 2,
#                 "A"
#             ],
#             [
#                 135,
#                 135,
#                 "A"
#             ]
#         ],
#         "sequence": "MSGIALSRLAQERKAWRKDHPFGFVAVPTKNPDGTMNLMNWECAIPGKKGTPWEGGLFKLRMLFKDDYPSSPPKCKFEPPLFHPNVYPSGTVCLSILEEDKDWRPAITIKQILLGIQELLNEPNIQDPAQAEAYTIYCQNRVEYEKRVRAQAKKFAPS",
#         "sequenceLength": 158
#     },
#     "requestURL": "https://glycoshape.io/output/AF-P63279-F1-model_v4.pdb",    -----> This is the URL of the uploaded pdb file
#     "uniprot": "AF-P63279-F1-model_v4.pdb"  ---> This is the fileid we use for the next step (its key is uniprot but it is actually the filename of uploaded pdb file)
# }


    glycan_configurations = {
        '135_A': "GlcNAc",   # ---> residueID_residueChain :  glycanID (glycanID of choice from corresponding configurations)
        '2_A': "Fuc(a1-3)[Gal(b1-4)]GlcNAc(b1-3)Gal(b1-4)[Fuc(a1-3)]GlcNAc(b1-4)Glc"
    }


    file_id = upload_response['uniprot']
    print(f"Uploaded PDB file: {pdb_file_path}")
    process_response = process_pdb(file_id, glycan_configurations)
    output_file_name = process_response['output']
    download_processed_pdb(output_file_name)
    print(f"Processed PDB file downloaded: {output_file_name}")

#       Response layout of process_pdb
#     {
#     "box": "Calculation started\nResidue : 135A\n GlcNAc ..... ---> Processing log
#     "clash": true,    ----> Overall clash status
#     "output": "AF-P63279-F1-model_v4_reglyco_202312190141.pdb",   ----> This is the filename of the processed pdb file with reglyco_YYYYMMDDHHMMSS in the end
# }

if __name__ == "__main__":
    main()
