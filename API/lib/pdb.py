#PDB Format from https://www.cgl.ucsf.edu/chimera/docs/UsersGuide/tutorials/pdbintro.html
import pandas as pd
from reglyco import config
from datetime import datetime
from Bio.PDB import PDBParser, Polypeptide
from Bio import PDB
# from Bio.PDB.Polypeptide import protein_letters_3to1
protein_letters_3to1 = {
    'ALA': 'A', 'CYS': 'C', 'ASP': 'D', 'GLU': 'E',
    'PHE': 'F', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I',
    'LYS': 'K', 'LEU': 'L', 'MET': 'M', 'ASN': 'N',
    'PRO': 'P', 'GLN': 'Q', 'ARG': 'R', 'SER': 'S',
    'THR': 'T', 'VAL': 'V', 'TRP': 'W', 'TYR': 'Y',
    # Additional residues
    'ASX': 'B', 'GLX': 'Z', 'XAA': 'X', 'XLE': 'J',
    'SEC': 'U', 'PYL': 'O',
    # Non-standard amino acids
    'MSE': 'M',  # Selenomethionine
    'HYP': 'P',  # Hydroxyproline
    'PCA': 'E',  # Pyroglutamic acid
    'FME': 'M',  # Formylmethionine
    'CSO': 'C',  # S-hydroxycysteine
    'CSS': 'C',  # S-mercaptocysteine
    'SEP': 'S',  # Phosphoserine
    'TPO': 'T',  # Phosphothreonine
    'PTR': 'Y',  # O-phosphotyrosine
    'LLP': 'K',  # Lysine-pyridoxal-5'-phosphate
    'KCX': 'K',  # Lysine NZ-carboxylic acid
    'CME': 'C',  # S,S-(2-hydroxyethyl)thiocysteine
    'MLY': 'K',  # N-dimethyl-lysine
    'CSD': 'C',  # S-cysteinesulfinic acid
}

def to_DF(pdbddata):
    df = pd.DataFrame(data=pdbddata)
    df = df.transpose()
    df.columns = ['Number','Name','ResName','Chain','ResId','X','Y','Z','Element']
    return df

def to_normal(df):
    Number = df['Number'].tolist()
    Name = df['Name'].tolist()
    ResName = df['ResName'].tolist()
    Chain = df['Chain'].tolist()
    ResId = df['ResId'].tolist()
    X = df['X'].tolist()
    Y = df['Y'].tolist()
    Z = df['Z'].tolist()
    Element = df['Element'].tolist()
    pdbdata=[Number,Name,ResName,Chain,ResId,X,Y,Z,Element]
    return pdbdata

def parse(f):
    Number = []
    Name = []
    ResName = []
    Chain = []
    ResId = []
    X = []
    Y = []
    Z = []
    Element = []
    pdbdata=[Number,Name,ResName,Chain,ResId,X,Y,Z,Element]
    with open(f, 'r') as f:
            lines = f.readlines()
            i=1
            for line in lines:
                if line.startswith("ATOM"):
                    pdbdata[0].append(int((line[6:11]).strip(" ")))
                    pdbdata[1].append((line[12:16]).strip(" "))
                    pdbdata[2].append((line[17:20]).strip(" "))
                    pdbdata[3].append((line[20:22]).strip(" "))
                    pdbdata[4].append(int((line[22:26]).strip(" ")))
                    pdbdata[5].append(float(line[30:38]))
                    pdbdata[6].append(float(line[38:46]))
                    pdbdata[7].append(float(line[46:54]))
                    pdbdata[8].append((line[76:78]).strip(" "))
                    i+=1
                if  line.startswith("END"):
                    break
    return pdbdata


from Bio.PDB import PDBParser

def parse_gly2(filename):
    """Parse glycan information from a PDB file using Biopython."""
    parser = PDBParser(QUIET=True)
    structure = parser.get_structure('structure', filename)

    Number = []
    Name = []
    ResName = []
    Chain = []
    ResId = []
    X = []
    Y = []
    Z = []
    Element = []

    for model in structure:
        for chain in model:
            for residue in chain:
                if residue.id[0] != ' ':  # HETATM residues have a non-blank field here
                    for atom in residue:
                        Number.append(atom.get_serial_number())
                        Name.append(atom.get_name())
                        ResName.append(residue.resname)
                        Chain.append(chain.id)
                        ResId.append(residue.id[1])
                        X.append(atom.coord[0])
                        Y.append(atom.coord[1])
                        Z.append(atom.coord[2])
                        Element.append(atom.element)
    
    pdbdata = [Number, Name, ResName, Chain, ResId, X, Y, Z, Element]
    return pdbdata


def parse_gly(f):
    Number = []
    Name = []
    ResName = []
    Chain = []
    ResId = []
    X = []
    Y = []
    Z = []
    Element = []
    pdbdata=[Number,Name,ResName,Chain,ResId,X,Y,Z,Element]
    with open(f, 'r') as f:
            lines = f.readlines()
            i=1
            for line in lines:
                if line.startswith("HETATM"):
                    pdbdata[0].append(int((line[6:11]).strip(" ")))
                    pdbdata[1].append((line[12:16]).strip(" "))
                    pdbdata[2].append((line[17:20]).strip(" "))
                    pdbdata[3].append((line[20:22]).strip(" "))
                    pdbdata[4].append(int((line[22:26]).strip(" ")))
                    pdbdata[5].append(float(line[30:38]))
                    pdbdata[6].append(float(line[38:46]))
                    pdbdata[7].append(float(line[46:54]))
                    pdbdata[8].append((line[76:78]).strip(" "))
                    i+=1
                if  line.startswith("END"):
                    break
    return pdbdata



def exportPDB(fout,pdbdata,link_pairs):
    now = datetime.now()
    fn= open(fout,"w+")
    fn.write("REMARK    GENERATED BY Re-Glyco from GlycoShape\n")
    fn.write(f'REMARK    Time {now.strftime("%Y-%m-%d-%H:%M:%S")}\n')
    fn.write("REMARK ______    _______         _______  ___      __   __  _______  _______ \n")
    fn.write("REMARK|    _ |  |       |       |       ||   |    |  | |  ||       ||       |\n")
    fn.write("REMARK|   | ||  |    ___| ____  |    ___||   |    |  |_|  ||       ||   _   |\n")
    fn.write("REMARK|   |_||_ |   |___ |____| |   | __ |   |    |       ||       ||  | |  |\n")
    fn.write("REMARK|    __  ||    ___|       |   ||  ||   |___ |_     _||      _||  |_|  |\n")
    fn.write("REMARK|   |  | ||   |___        |   |_| ||       |  |   |  |     |_ |       |\n")
    fn.write("REMARK|___|  |_||_______|       |_______||_______|  |___|  |_______||_______|\n")
    fn.write("REMARK    https://github.com/Ojas-Singh/Re-Glyco\n")
    fn.write("REMARK    THIS FILE CONTAINS ONLY ATOMS\n")
    fn.write("REMARK   Cite:   Restoring Protein Glycosylation with GlycoShape bioRxiv (2023) https://doi.org/10.1101/2023.12.11.571101 \n")
    fn.write("REMARK          Callum M. Ives* and Ojas Singh*, Silvia D’Andrea, Carl A. Fogarty, Aoife M. Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda\n")
    
    # Adding LINK records
    for link_pair in link_pairs:
        atom1, atom2 = link_pair
        # print(atom1,atom2)
        link_line = "LINK        {:>4} {:>3} {:1}{:>4}                {:>4} {:>3} {:1}{:>4}  \n".format(
    pdbdata[1][atom1], pdbdata[2][atom1], pdbdata[3][atom1], pdbdata[4][atom1],
    pdbdata[1][atom2], pdbdata[2][atom2], pdbdata[3][atom2], pdbdata[4][atom2])

        fn.write(link_line)
    
    k=""
    gly =False
    last_elements = [item[-1] for item in link_pairs]
    for i in range(len(pdbdata[0])):
        if i in last_elements:
                gly=True
                fn.write("TER\n")
        if not gly:
            line=list("ATOM".ljust(80))
        else:
            line=list("ATOM".ljust(80))
        line[6:10] = str(pdbdata[0][i]).rjust(5) 
        line[12:15] = str(pdbdata[1][i]).ljust(4) 
        line[17:19] = str(pdbdata[2][i]).rjust(3) 
        line[20:21] = str(pdbdata[3][i]).rjust(2) 
        line[22:25] = str(pdbdata[4][i]).rjust(4) 
        line[30:37] = str('{:0.3f}'.format(pdbdata[5][i])).rjust(8) 
        line[38:45] = str('{:0.3f}'.format(pdbdata[6][i])).rjust(8) 
        line[46:53] = str('{:0.3f}'.format(pdbdata[7][i])).rjust(8) 
        line[54:59] = str(1.0).rjust(6)
        line[60:65] = str(0.0).rjust(6)
        line[75:77] = str(pdbdata[8][i]).rjust(3) 
        line= ''.join(line)
        fn.write(line+"\n")
        k=k+line+"\n"
    
    # Adding CONECT records
    for connect_pair in link_pairs:
        atom1, atom2 = connect_pair
        conect_line = "CONECT{:>5}{:>5}\n".format(pdbdata[0][atom1], pdbdata[0][atom2])  # +1 because PDB is 1-indexed
        fn.write(conect_line)
    return k
                
def get_confidence(system):
    confidence= []
    p=1
    lines = system.split("\n")
    for x in lines:
        if x.startswith("ATOM"):
            if int((x[22:27]).strip(" "))==p:
                try: 
                    confidence.append(float((x[61:67]).strip(" ")))
                except:
                    confidence.append(0)
                p+=1
    return confidence


# {
#     "ALA": "A",
#     "ARG": "R",
#     "ASN": "N",
#     "ASP": "D",
#     "CYS": "C",
#     "GLU": "E",
#     "GLN": "Q",
#     "GLY": "G",
#     "HIS": "H",
#     "ILE": "I",
#     "LEU": "L",
#     "LYS": "K",
#     "MET": "M",
#     "PHE": "F",
#     "PRO": "P",
#     "SER": "S",
#     "THR": "T",
#     "TRP": "W",
#     "TYR": "Y",
#     "VAL": "V"
# }



def get_sequence_from_pdb(file_path):
    parser = PDBParser(PERMISSIVE=1)
    structure = parser.get_structure('pdb', file_path)
    sequence_with_info = []  # List to store (residue, full ResId, ChainId) tuples
    sequences = []
    
    for model in structure:
        for chain in model:
            chain_sequence = ""
            for residue in chain:
                if residue.id[0] == ' ':  # Skip over HETATM records
                    resname = residue.get_resname()
                    if resname.upper() in protein_letters_3to1:
                        aa = protein_letters_3to1[resname.upper()]
                        # Using residue.id which is a tuple for full Residue ID
                        res_id = residue.id[1]
                        chain_id = chain.id
                        sequence_with_info.append((aa, res_id, chain_id))
                        chain_sequence += aa
                    else:
                        print(f"Unknown or non-standard residue {resname} encountered.")
            sequences.append(chain_sequence)
    return sequence_with_info, ' '.join(sequences)

def find_glycosylation_spots(sequence_with_info):
    spots = []
    sequence_length = len(sequence_with_info)

    for i in range(sequence_length):
        curr_residue, curr_chain, curr_resnum = sequence_with_info[i]
        
        # Check for O-linked glycosylation sites (T, W, S, P)
        if curr_residue in ['T', 'W', 'S', 'P']:
            spots.append((i + 1, curr_chain, curr_resnum))
        
        # Check for N-linked glycosylation sites (N-X-S/T, where X is not P)
        if curr_residue == 'N' and i < sequence_length - 2:
            next_residue, _, _ = sequence_with_info[i+1]
            next_next_residue, _, _ = sequence_with_info[i+2]
            
            if next_residue != 'P' and next_next_residue in ['S', 'T']:
                spots.append((i + 1, curr_chain, curr_resnum))

    return spots


# def find_glycosylation_spots(sequence_with_info):
#     spots = []
#     for i in range(len(sequence_with_info) - 2):
#         curr_residue, _, _ = sequence_with_info[i]
#         next_residue, _, _ = sequence_with_info[i+1]
#         next_next_residue, _, _ = sequence_with_info[i+2]
        
#         if curr_residue == 'N' and next_residue != 'P' and (next_next_residue == 'S' or next_next_residue == 'T'):
#             spots.append((i + 1, sequence_with_info[i][1], sequence_with_info[i][2]))
        
#         if curr_residue in ['T', 'W', 'S', 'P']:
#             spots.append((i + 1, sequence_with_info[i][1], sequence_with_info[i][2]))
    
#     return spots

def find_glycosylation_spots_N(sequence_with_info):
    spots = []
    for i in range(len(sequence_with_info) - 2):
        curr_residue, _, _ = sequence_with_info[i]
        next_residue, _, _ = sequence_with_info[i+1]
        next_next_residue, _, _ = sequence_with_info[i+2]
        
        if curr_residue == 'N' and next_residue != 'P' and (next_next_residue == 'S' or next_next_residue == 'T'):
            spots.append((i + 1, sequence_with_info[i][1], sequence_with_info[i][2]))

    return spots


def remove_hydrogens(input_pdb, output_pdb):
    # Initialize PDB parser
    parser = PDB.PDBParser()
    
    # Read the structure from the PDB file
    structure = parser.get_structure("structure", input_pdb)
    
    # Iterate over the atoms and remove hydrogens
    for model in structure:
        for chain in model:
            for residue in list(chain):
                for atom in list(residue):
                    if atom.element == "H":
                        residue.detach_child(atom.get_id())

    # Save the structure without hydrogens to a new PDB file
    io = PDB.PDBIO()
    io.set_structure(structure)
    io.save(output_pdb)



def swap_residues(pdb_filepath, asn_residue_list, output_filepath):
    """
    Swap the coordinates of ND2 and OD1 in ASN residues and write the output structure.

    Args:
    pdb_filepath (str): Path to the input PDB file.
    asn_residue_list (list): List of ASN residue numbers with chain identifiers (e.g., '132_B').
    output_filepath (str): Path to write the modified PDB file.
    """

    # Create a PDB parser
    parser = PDB.PDBParser()
    structure = parser.get_structure('structure', pdb_filepath)

    for residue_spec in asn_residue_list:
        res_num, chain_id = residue_spec.split('_')
        res_num = int(res_num)
        chain = structure[0][chain_id]  # Assuming the model is always 0

        if (res_num, chain_id) in [(res.get_id()[1], chain.id) for res in chain]:
            residue = chain[res_num]
            if residue.get_resname() == 'ASN':
                try:
                    # Swap the coordinates of ND2 and OD1
                    nd2_atom = residue['ND2']
                    od1_atom = residue['OD1']
                    nd2_coord, od1_coord = nd2_atom.get_coord(), od1_atom.get_coord()
                    nd2_atom.set_coord(od1_coord)
                    od1_atom.set_coord(nd2_coord)
                except KeyError:
                    print(f"Residue {residue} in chain {chain_id} does not have ND2 and OD1 atoms.")
            else:
                print(f"Residue {residue} in chain {chain_id} is not ASN.")
        else:
            print(f"Residue number {res_num} not found in chain {chain_id}.")

    # Write the output structure
    io = PDB.PDBIO()
    io.set_structure(structure)
    io.save(output_filepath)



def export_multi_PDB(total_frames_with_data, protein_data,lowest_frame,fout):
    now = datetime.now()
    fn= open(fout,"w+")
    fn.write("REMARK    GENERATED BY Re-Glyco from GlycoShape\n")
    fn.write(f'REMARK    Time {now.strftime("%Y-%m-%d-%H:%M:%S")}\n')
    fn.write("REMARK ______    _______         _______  ___      __   __  _______  _______ \n")
    fn.write("REMARK|    _ |  |       |       |       ||   |    |  | |  ||       ||       |\n")
    fn.write("REMARK|   | ||  |    ___| ____  |    ___||   |    |  |_|  ||       ||   _   |\n")
    fn.write("REMARK|   |_||_ |   |___ |____| |   | __ |   |    |       ||       ||  | |  |\n")
    fn.write("REMARK|    __  ||    ___|       |   ||  ||   |___ |_     _||      _||  |_|  |\n")
    fn.write("REMARK|   |  | ||   |___        |   |_| ||       |  |   |  |     |_ |       |\n")
    fn.write("REMARK|___|  |_||_______|       |_______||_______|  |___|  |_______||_______|\n")
    fn.write("REMARK    https://github.com/Ojas-Singh/Re-Glyco\n")
    fn.write("REMARK    THIS FILE CONTAINS ONLY ATOMS\n")
    fn.write("REMARK   Cite:  Restoring Protein Glycosylation with GlycoShape bioRxiv (2023) https://doi.org/10.1101/2023.12.11.571101 \n")
    fn.write("REMARK          Callum M. Ives* and Ojas Singh*, Silvia D’Andrea, Carl A. Fogarty, Aoife M. Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda\n")

    
    for frame_index in range(lowest_frame):
            # Write a remark to separate frames
            fn.write(f"MODEL     {frame_index + 1}\n")
            pdbdata = protein_data
            for i in range(len(pdbdata[0])):
                
                line=list("ATOM".ljust(80))
                line[6:10] = str(pdbdata[0][i]).rjust(5) 
                line[12:15] = str(pdbdata[1][i]).ljust(4) 
                line[17:19] = str(pdbdata[2][i]).rjust(3) 
                line[20:21] = str(pdbdata[3][i]).rjust(2) 
                line[22:25] = str(pdbdata[4][i]).rjust(4) 
                line[30:37] = str('{:0.3f}'.format(pdbdata[5][i])).rjust(8) 
                line[38:45] = str('{:0.3f}'.format(pdbdata[6][i])).rjust(8) 
                line[46:53] = str('{:0.3f}'.format(pdbdata[7][i])).rjust(8) 
                line[54:59] = str(1.0).rjust(6)
                line[60:65] = str(0.0).rjust(6)
                line[75:77] = str(pdbdata[8][i]).rjust(3) 
                line= ''.join(line)
                fn.write(line+"\n")
            for j in range(len(total_frames_with_data)):
                frames,chain,pdbdata = total_frames_with_data[j]
                pdbdata = to_normal(pdbdata)
                for i in range(2,len(pdbdata[0])):
                    line=list("ATOM".ljust(80))
                    line[6:10] = str(pdbdata[0][i]).rjust(5) 
                    line[12:15] = str(pdbdata[1][i]).ljust(4) 
                    line[17:19] = str(pdbdata[2][i]).rjust(3) 
                    line[20:21] = str(chain).rjust(2) 
                    line[22:25] = str(pdbdata[4][i]).rjust(4) 
                    # print(frames)
                    line[30:37] = str('{:0.3f}'.format(frames[frame_index][i][0])).rjust(8) 
                    line[38:45] = str('{:0.3f}'.format(frames[frame_index][i][1])).rjust(8) 
                    line[46:53] = str('{:0.3f}'.format(frames[frame_index][i][2])).rjust(8) 
                    line[54:59] = str(1.0).rjust(6)
                    line[60:65] = str(0.0).rjust(6)
                    line[75:77] = str(pdbdata[8][i]).rjust(3) 
                    line= ''.join(line)
                    fn.write(line+"\n")
            fn.write(f"ENDMDL \n")


def export_multi_PDB_density(total_frames_with_data, protein_data,lowest_frame,fout):
    now = datetime.now()
    fn= open(fout,"w+")
    fn.write("REMARK    GENERATED BY Re-Glyco from GlycoShape\n")
    fn.write(f'REMARK    Time {now.strftime("%Y-%m-%d-%H:%M:%S")}\n')
    fn.write("REMARK ______    _______         _______  ___      __   __  _______  _______ \n")
    fn.write("REMARK|    _ |  |       |       |       ||   |    |  | |  ||       ||       |\n")
    fn.write("REMARK|   | ||  |    ___| ____  |    ___||   |    |  |_|  ||       ||   _   |\n")
    fn.write("REMARK|   |_||_ |   |___ |____| |   | __ |   |    |       ||       ||  | |  |\n")
    fn.write("REMARK|    __  ||    ___|       |   ||  ||   |___ |_     _||      _||  |_|  |\n")
    fn.write("REMARK|   |  | ||   |___        |   |_| ||       |  |   |  |     |_ |       |\n")
    fn.write("REMARK|___|  |_||_______|       |_______||_______|  |___|  |_______||_______|\n")
    fn.write("REMARK    https://github.com/Ojas-Singh/Re-Glyco\n")
    fn.write("REMARK    THIS FILE CONTAINS ONLY ATOMS\n")
    fn.write("REMARK   Cite:  Restoring Protein Glycosylation with GlycoShape bioRxiv (2023) https://doi.org/10.1101/2023.12.11.571101 \n")
    fn.write("REMARK          Callum M. Ives* and Ojas Singh*, Silvia D’Andrea, Carl A. Fogarty, Aoife M. Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda\n")

    
    for frame_index in range(lowest_frame):
            # Write a remark to separate frames
            fn.write(f"MODEL     {frame_index + 1}\n")
            pdbdata = protein_data
            # for i in range(len(pdbdata[0])):
                
            #     line=list("ATOM".ljust(80))
            #     line[6:10] = str(pdbdata[0][i]).rjust(5) 
            #     line[12:15] = str(pdbdata[1][i]).ljust(4) 
            #     line[17:19] = str(pdbdata[2][i]).rjust(3) 
            #     line[20:21] = str(pdbdata[3][i]).rjust(2) 
            #     line[22:25] = str(pdbdata[4][i]).rjust(4) 
            #     line[30:37] = str('{:0.3f}'.format(pdbdata[5][i])).rjust(8) 
            #     line[38:45] = str('{:0.3f}'.format(pdbdata[6][i])).rjust(8) 
            #     line[46:53] = str('{:0.3f}'.format(pdbdata[7][i])).rjust(8) 
            #     line[54:59] = str(1.0).rjust(6)
            #     line[60:65] = str(0.0).rjust(6)
            #     line[75:77] = str(pdbdata[8][i]).rjust(3) 
            #     line= ''.join(line)
            #     fn.write(line+"\n")
            # for j in range(len(total_frames_with_data)):
            frames,chain,pdbdata = total_frames_with_data[frame_index]
            pdbdata = to_normal(pdbdata)
            for i in range(2,len(pdbdata[0])):
                line=list("ATOM".ljust(80))
                line[6:10] = str(pdbdata[0][i]).rjust(5) 
                line[12:15] = str(pdbdata[1][i]).ljust(4) 
                line[17:19] = str(pdbdata[2][i]).rjust(3) 
                line[20:21] = str(chain).rjust(2) 
                line[22:25] = str(pdbdata[4][i]).rjust(4) 
                # print(frames)
                line[30:37] = str('{:0.3f}'.format(frames[i][0])).rjust(8) 
                line[38:45] = str('{:0.3f}'.format(frames[i][1])).rjust(8) 
                line[46:53] = str('{:0.3f}'.format(frames[i][2])).rjust(8) 
                line[54:59] = str(1.0).rjust(6)
                line[60:65] = str(0.0).rjust(6)
                line[75:77] = str(pdbdata[8][i]).rjust(3) 
                line= ''.join(line)
                fn.write(line+"\n")
            fn.write(f"ENDMDL \n")


from Bio import PDB
import numpy as np

# Predefined atomic structure template for HYP (Hydroxyproline)
HYP_ATOMS = [
    {'name': 'N', 'element': 'N'},
    {'name': 'CA', 'element': 'C'},
    {'name': 'C', 'element': 'C'},
    {'name': 'O', 'element': 'O'},
    {'name': 'CB', 'element': 'C'},
    {'name': 'CG', 'element': 'C'},
    {'name': 'CD', 'element': 'C'},
    {'name': 'OD1', 'element': 'O'}  # Hydroxyl group specific to HYP
]

def calculate_hyp_placement(cg_coords, cb_coords, cd_coords):
    """
    Calculate the correct placement for the OD1 atom, maintaining symmetry 
    and the correct angle relative to the plane formed by CG, CB, and CD.
    """
    # Bond length between CG and OD1 in Ångstroms
    bond_length = 1.43

    # Calculate vectors from CG to CB and CG to CD
    cb_to_cg = cb_coords - cg_coords
    cd_to_cg = cd_coords - cg_coords

    # Calculate the normal vector to the plane of the ring (CB-CG-CD)
    normal_to_plane = np.cross(cb_to_cg, cd_to_cg)
    normal_to_plane_normalized = normal_to_plane / np.linalg.norm(normal_to_plane)

    # Calculate the bisector vector within the plane of CB, CG, CD
    bisector_vector = (cb_to_cg / np.linalg.norm(cb_to_cg) + cd_to_cg / np.linalg.norm(cd_to_cg))
    bisector_vector_normalized = bisector_vector / np.linalg.norm(bisector_vector)

    # Determine the proper OD1 position by combining the normal and bisector vectors
    # Use the desired angle of 120 degrees to correctly position OD1
    cos_120 = np.cos(np.radians(120))
    sin_120 = np.sin(np.radians(120))

    # Position the OD1 atom
    od1_coords = cg_coords + bond_length * (
        cos_120 * bisector_vector_normalized + sin_120 * normal_to_plane_normalized
    )

    return od1_coords

def modify_PRO_structure(input_pdb, output_pdb, target_chain, target_residue_number):
    # Initialize the PDB parser and structure
    parser = PDB.PDBParser(QUIET=True)
    structure = parser.get_structure('input_structure', input_pdb)

    # Loop through all chains in the structure
    for model in structure:
        for chain in model:
            # Check if the chain matches the target chain
            if chain.id == target_chain:
                for residue in chain:
                    # Check if the residue number matches the target residue number
                    if residue.id[1] == int(target_residue_number) and residue.resname == 'PRO':
                        print(f"Modifying residue {residue.resname} at {chain.id}:{residue.id[1]} to HYP.")

                        # Create a new residue object with the HYP name
                        new_residue = PDB.Residue.Residue(residue.id, 'HYP', residue.segid)

                        # Copy atoms from PRO to the new HYP residue
                        pro_atoms = {atom.get_name(): atom for atom in residue.get_atoms()}
                        for atom_template in HYP_ATOMS:
                            atom_name = atom_template['name']
                            element = atom_template['element']

                            if atom_name in pro_atoms:
                                # Copy existing atom for common atoms
                                atom = pro_atoms[atom_name]
                                new_atom = PDB.Atom.Atom(atom.get_name(), atom.get_coord(), atom.get_bfactor(), atom.get_occupancy(), atom.get_altloc(), atom.get_fullname(), atom.serial_number, element)
                            else:
                                # Create a new atom for HYP-specific atoms (e.g., OD1)
                                if atom_name == 'OD1':
                                    cg_atom = pro_atoms.get('CG')
                                    cb_atom = pro_atoms.get('CB')
                                    cd_atom = pro_atoms.get('CD')
                                    if cg_atom and cb_atom and cd_atom:
                                        cg_coords = cg_atom.get_coord()
                                        cb_coords = cb_atom.get_coord()
                                        cd_coords = cd_atom.get_coord()

                                        # Calculate accurate OD1 position
                                        od1_coords = calculate_hyp_placement(cg_coords, cb_coords, cd_coords)
                                        new_atom = PDB.Atom.Atom(atom_name, od1_coords, 0.0, 1.0, ' ', atom_name, 0, element)
                                    else:
                                        print("CG, CB, or CD atom not found; cannot place OD1.")
                                        continue
                            new_residue.add(new_atom)

                        # Replace old PRO residue with new HYP residue
                        chain.detach_child(residue.id)
                        chain.add(new_residue)

    # Write the modified structure to a new PDB file
    io = PDB.PDBIO()
    io.set_structure(structure)
    io.save(output_pdb)

    print(f"Modified PDB saved as {output_pdb}")
