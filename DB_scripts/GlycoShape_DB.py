#!/usr/bin/env python3

import os
import re
import ast
import sys
import glob
import json
import shutil
import zipfile
import requests
import collections
import numpy as np
import pandas as pd
from tqdm import tqdm
from pathlib import Path

###############################################

input_path = "/mnt/database/glycoshape_data"
output_path = "/mnt/database/DB_temp"
update = True

###############################################

# Function to remove the reducing end of our glycans as we offer both alpha and beta anyways:
def glycamtidy(glycam):
    if glycam[-3:] == "-OH":
        glycam = glycam[:-5]
    return glycam
    

# Function to convert from the glycam nomenclature to the condensed IUPAC nomeclature...
def glycam2iupac(glycam):
    if glycam == "DGalpb1-4DGalpa1-3[2,4-diacetimido-2,4,6-trideoxyhexose]":
        iupac = "Gal(b1-4)Gal(a1-3)[2,4-diacetimido-2,4,6-trideoxyhexose]"
    else:
        glycam_components = glycam.split("-")
        mod_component_list = []
        for component in glycam_components:
            mod_component = component
            if component != glycam_components[-1]:
                mod_component = mod_component.replace(mod_component[-2:], f"({mod_component[-2:]}-", 1)
            if component != glycam_components[0]:
                mod_component = mod_component.replace(mod_component[0], f"{mod_component[0]})", 1)
            mod_component = mod_component.replace("D", "")
            mod_component = mod_component.replace("L", "")
            mod_component = mod_component.replace("p", "")
            mod_component = mod_component.replace("f", "")
            # Hard coded for now, need to improve this for modifications...
            mod_component = mod_component.replace("[2S]", "2S")
            mod_component = mod_component.replace("[3S]", "3S")
            mod_component = mod_component.replace("[4S]", "4S")
            mod_component = mod_component.replace("[6S]", "6S")
            mod_component = mod_component.replace("[3S-6S]", "3S6S")
            mod_component = mod_component.replace("[3S,6S]", "3S6S")
            mod_component = mod_component.replace("[3Me]", "3Me")
            mod_component = mod_component.replace("[4Me]", "4Me")
            mod_component = mod_component.replace("[9Me]", "9Me")
            mod_component = mod_component.replace("[4A]", "4Ac")
            mod_component = mod_component.replace("[9A]", "9Ac")
            mod_component = mod_component.replace("[6PC]", "6Pc")
            mod_component_list.append(mod_component)
        iupac = "".join(mod_component_list)
    return iupac


# Function to sort a dictionary by value...
def sort_dict(d, reverse = True):
  return dict(sorted(d.items(), key = lambda x: x[1], reverse = reverse))


# Function to calculate the monosaccharide composition from the condensed IUPAC nomenclature...
def iupac2composition(iupac):
    iupac_mod = re.sub("\[|\]", "", iupac)
    iupac_mod = re.sub("\(.*?\)", ".", iupac_mod)
    components = [component for component in iupac_mod.split(".")]
    composition =dict(collections.Counter(components))

    return sort_dict(composition)


# Function to request the WURCS nomeclature and GlyTouCan ID from the condensed IUPAC nomeclature...
def iupac2wurcs_glytoucan(iupac): 
    id_list = []
    for end in ["a","b","?"]:
        iupac_mod = iupac + f"({end}1-"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {"input": f"{iupac}"}
        response = requests.post(
            'https://api.glycosmos.org/glycanformatconverter/2.8.2/iupaccondensed2wurcs',
            headers=headers,
            data=str(data),
        )
        id_list.append([response.json()["id"] if "id" in response.json() else None, response.json()["wurcs"] if "wurcs" in response.json() else None])

    ids = [id_list[n][0] for n in range(len(id_list))]
    ids = list(dict.fromkeys(ids))
    wurcs = [id_list[n][1] for n in range(len(id_list))]
    wurcs = list(dict.fromkeys(wurcs))
    return ids, wurcs


# Function to look up a GlyTouCan ID from GlyGen...
def glytoucan2glygen(glytoucan):
    headers = {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
    }
    response = requests.post(f'https://api.glygen.org/glycan/detail/{glytoucan}/', headers=headers)
    if "error_list" in response.json():
        print(f"{glytoucan} is not present in GlyGen")
    return response.json()["glycoct"] if "glycoct" in response.json() else None, list(set([response.json()["species"][n]["name"] for n in range(len(response.json()["species"]))])) if "species" in response.json() else None


# Function to get MD simulation info for a glycan submission...
def get_md_info(glycam):
    latest_inventory = "/mnt/database/DB_scripts/GlycoShape_Inventory.csv"
    df = pd.read_csv(latest_inventory)
    df = df[df['Timestamp'].notna()]
    df[df.columns[3]] = [glycamtidy(i) for i in df[df.columns[3]].values]
    df = df.loc[df[df.columns[3]] == glycam]
    try:
        length = str(list(df[df.columns[5]].values)[0])
        package = list(df[df.columns[6]].values)[0]
        FF = list(df[df.columns[7]].values)[0]
        temp = str(list(df[df.columns[8]].values)[0])
        pressure = str(list(df[df.columns[9]].values)[0])
        salt = list(df[df.columns[10]].values)[0]
        contributor = list(df[df.columns[2]].values)[0]
        ID = list(df[df.columns[0]].values)[0]
    except IndexError:
        ID, length, package, FF, temp, pressure, salt, contributor = 0, 0, 0, 0, 0, 0, 0, "0"
    return ID, length, package, FF, temp, pressure, salt, contributor

# Function to get the cluster information for the glycan of interest...
def get_clusters_alpha(glycam):
    for conf in ["alpha"]: 
        cluster_ids = []
        cluster_occupancies = []
        # Read in PDB files
        os.chdir(os.path.join(input_path,f"{glycam}/clusters/{conf}/"))
        files = glob.glob("*pdb")
        if len(files) == 0:
            print(f"No cluster files found for {glycam}")
            cluster_ids.append("None")
            cluster_occupancies.append("None")
        else:
            files_mod = sorted([float(file.split("/")[-1].split("_")[1].split(".pdb")[0]) for file in files], reverse=True)
            # Sort by occupancy
            for file, n in zip(files_mod, range(len(files_mod))):
                try:
                    pdb_file = glob.glob(f'*_{file:.2f}.pdb')[0]
                except:
                    pdb_file = glob.glob(f'*_{file:.1f}.pdb')[0]
                # shutil.copyfile(pdb_file, os.path.join(output_path,f"{iupac}/cluster{n}_{conf}.pdb"))
                shutil.copyfile(pdb_file, os.path.join(output_path,f"{iupac}/{iupac}_cluster{n}_{conf}.pdb"))
                pdb_remark_adder(os.path.join(output_path,f"{iupac}/{iupac}_cluster{n}_{conf}.pdb"))
                cluster_ids.append(f"Cluster {n}")
                cluster_occupancies.append(file)
        cluster_dict = {}
        for n in range(len(cluster_ids)):
            cluster_dict[f"{cluster_ids[n]}"] = cluster_occupancies[n]
        return cluster_dict
    
    # Function to get the cluster information for the glycan of interest...
def get_clusters_beta(glycam):
    for conf in ["beta"]: 
        cluster_ids = []
        cluster_occupancies = []
        # Read in PDB files
        os.chdir(os.path.join(input_path,f"{glycam}/clusters/{conf}/"))
        files = glob.glob("*pdb")
        if len(files) == 0:
            # print(f"No cluster files found for {glycam}")
            cluster_ids.append("None")
            cluster_occupancies.append("None")
        else:
            files_mod = sorted([float(file.split("/")[-1].split("_")[1].split(".pdb")[0]) for file in files], reverse=True)
            # Sort by occupancy
            for file, n in zip(files_mod, range(len(files_mod))):
                try:
                    pdb_file = glob.glob(f'*_{file:.2f}.pdb')[0]
                except:
                    pdb_file = glob.glob(f'*_{file:.1f}.pdb')[0]
                # shutil.copyfile(pdb_file, os.path.join(output_path,f"{iupac}/cluster{n}_{conf}.pdb"))
                shutil.copyfile(pdb_file, os.path.join(output_path,f"{iupac}/{iupac}_cluster{n}_{conf}.pdb"))
                pdb_remark_adder(os.path.join(output_path,f"{iupac}/{iupac}_cluster{n}_{conf}.pdb"))
                cluster_ids.append(f"Cluster {n}")
                cluster_occupancies.append(file)
        cluster_dict = {}
        for n in range(len(cluster_ids)):
            cluster_dict[f"{cluster_ids[n]}"] = cluster_occupancies[n]

# Function to get an SNFG image from an IUPAC name..
def iupac2snfg(iupac):
    from glycowork.motif.draw import GlycoDraw
    snfg = GlycoDraw(iupac, filepath=os.path.join(output_path,f'{iupac}/{iupac}.svg'), show_linkage=True)
    return os.path.join(output_path,f'{iupac}/{iupac}.svg')

# Function to get motifs from an IUPAC name...
def iupac2motif(iupac):
    from glycowork.motif.annotate import annotate_glycan
    df = annotate_glycan(iupac)
    df = df.loc[:, (df != 0).any(axis=0)]
    motifs = df.columns.tolist()[1:]
    return motifs

def iupac2properties(iupac):
    from glycowork.motif.annotate import get_molecular_properties
    try:
        df = get_molecular_properties([iupac], placeholder=True)
        mass = df["exact_mass"].values.tolist()[0]
        tpsa = df["tpsa"].values.tolist()[0]
        rot_bonds = df["rotatable_bond_count"].values.tolist()[0]
        hbond_donor = df["h_bond_donor_count"].values.tolist()[0]
        hbond_acceptor = df["h_bond_acceptor_count"].values.tolist()[0]
        return mass, tpsa, rot_bonds, hbond_donor, hbond_acceptor
    except:
        sys.stderr.write(f'{iupac} properties were not found\n')
        mass, tpsa, rot_bonds, hbond_donor, hbond_acceptor = None, None, None, None, None

def iupac2termini(iupac):
    from glycowork.motif.annotate import get_terminal_structures
    termini = get_terminal_structures(iupac)
    if termini != []:
        termini_mod = list(set(termini))
        return termini_mod
    else:
        return None

def iupac2smiles(iupac):
    from glycowork.motif.processing import IUPAC_to_SMILES
    smiles = IUPAC_to_SMILES([iupac])[0]
    return smiles

def canonicalize_iupac(iupac):
    from glycowork.motif.processing import canonicalize_iupac
    return canonicalize_iupac([iupac])

# Function to fetch data from SugarBase for the glycan of interest...
def iupac2sugarbase(iupac):
    sugarbase = pd.read_csv("/mnt/database/DB_scripts/v7_sugarbase.csv")
    sugarbase = sugarbase.where(pd.notnull(sugarbase), None)
    df = sugarbase.loc[sugarbase["glycan"] == iupac]
    if df.shape[0] != 0:
        value_list = []
        for parameter in ['Species', 'Genus', 'Family', 'Order', 'Class', 'Phylum',
                        'Kingdom', 'Domain', 'predicted_taxonomy','glycan_type',
                        'disease_association','tissue_sample','Composition']:
            values = df[parameter].values.tolist()[0]
            if values == "[]":
                value_list.append(None)
            else:
                value_list.append(values)
    else:
        print(f"{iupac} not found in SugarBase")
        value_list = [None for n in range(13)]
    return value_list

# Function for replacing "_" with " "...
def remove_underscores_eval(input):
    if input == None:
            return None
    else:
        mod = []
        input_mod = ast.literal_eval(input)
        for entry in input_mod:
            mod.append(entry.replace("_"," "))
        mod2 = list(set(mod))
        if "undetermined" in mod2:
            mod2 = mod2.remove("undetermined")
        return mod2

# Function for replacing "_" with " "...
def remove_underscores_list(input):
    if input == None:
            return None
    else:
        mod = []
        for entry in input:
            mod.append(entry.replace("_"," "))
        mod2 = list(set(mod))
        if "undetermined" in mod2:
            mod2 = mod2.remove("undetermined")
        return mod2
    
# Function for adding remark line...
def pdb_remark_adder(filename):
    remark = "REMARK #################################################################\nREMARK #################################################################\nREMARK #################################################################\nREMARK    Restoring Protein Glycosylation with GlycoShape\nREMARK    Callum M Ives,*, Ojas Singh,*, Silvia D’Andrea, Carl A Fogarty, Aoife M Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda\nREMARK    bioRxiv, 2023\nREMARK ################################################################\nREMARK ################################################################\nREMARK ################################################################" 
    with open(filename, 'r+') as f:
        content = f.read()
        f.seek(0, 0)
        f.write(remark.rstrip('\r\n') + '\n' + content)


###############################################


# Reading in all the folders we've run GAP on for GlycoShape...
glycoshape_files = glob.glob(os.path.join(input_path,"*OH"))
glycoshape_list = [glycan.split("/")[-1] for glycan in glycoshape_files]
glycoshape_list.append("DGalpb1-4DGalpa1-3[2,4-diacetimido-2,4,6-trideoxyhexose]")


glycoshape = {}
n_glycans = []
n_glycans_mass = []
o_glycans = []
o_glycans_mass = []
c_glycans = []
c_glycans_mass = []
oligomannose = []
oligomannose_mass = []
complex = []
complex_mass = []
hybrid = []
hybrid_mass = []
sim_time = []

for glycam, i in zip(glycoshape_list,tqdm(range(len(glycoshape_list)))):

    n_glycan = False

    # Tidying up the nomeclature of our glycans...
    glycam_tidy = glycamtidy(glycam)
    iupac_untidy = str(glycam2iupac(glycam_tidy))
    iupac = canonicalize_iupac(iupac_untidy)[2:-2]

    # Making the necessary output directories
    if (os.path.exists(os.path.join(output_path,iupac)) and update==False):
        continue
    if (os.path.exists(os.path.join(output_path,iupac)) and update==True):
            shutil.rmtree(os.path.join(output_path,iupac))
    os.mkdir(os.path.join(output_path,iupac))
    print(iupac)


    composition = iupac2composition(iupac)
    glytoucan, wurcs = iupac2wurcs_glytoucan(iupac)
    glytoucan = glytoucan[0]
    wurcs = wurcs [0]
    glycoct, IGNORE = glytoucan2glygen(glytoucan)
    try:
        mass, tpsa, rot_bonds, hbond_donor, hbond_acceptor = iupac2properties(iupac)
    except:
        mass, tpsa, rot_bonds, hbond_donor, hbond_acceptor = None, None, None, None, None
    try:
        motifs = iupac2motif(iupac)
    except:
        motifs = None
    Species, Genus, Family, Order, Class, Phylum, Kingdom, Domain, predicted_taxonomy, glycan_type, disease_association, tissue_sample, Composition = iupac2sugarbase(iupac) 
    try:
        Composition = ast.literal_eval(Composition)
    except:
        pass
    snfg = iupac2snfg(iupac) 
    smiles = iupac2smiles(iupac)
    try:
        termini = iupac2termini(iupac) 
    except:
        termini = None
    print()

    ID, length, package, FF, temp, pressure, salt, contributor = get_md_info(glycam_tidy)
    cluster_dict = get_clusters_alpha(glycam)
    cluster_dict_beta = get_clusters_beta(glycam)          

    glycan_data = {"ID":ID,
    "glycam":glycam_tidy,
    "iupac":iupac,
    "wurcs":wurcs,
    "glycoct":glycoct,
    "smiles":smiles, 
    "components":str(composition)[1:-1].replace("'",'').replace(",",", "),
    "composition":str(Composition)[1:-1].replace("'",'').replace(",",", "),

    "components_search":composition,
    "composition_search":Composition,

    "mass":np.float64(mass).round(1),
    "motifs":remove_underscores_list(motifs), 
    "termini":termini, 
    # "tpsa":tpsa, # CMI removed on 20231018
    "rot_bonds":rot_bonds, 
    "hbond_donor":hbond_donor, 
    "hbond_acceptor":hbond_acceptor, 
    "glycan_type":glycan_type,
    "glytoucan_id":glytoucan,
    "disease":", ".join(remove_underscores_eval(disease_association)) if remove_underscores_eval(disease_association) != None else remove_underscores_eval(disease_association),
    "tissue":", ".join(remove_underscores_eval(tissue_sample)) if remove_underscores_eval(tissue_sample) != None else remove_underscores_eval(tissue_sample),
    "species":", ".join(remove_underscores_eval(Species)) if remove_underscores_eval(Species) != None else remove_underscores_eval(Species),
    "genus":", ".join(remove_underscores_eval(Genus)) if remove_underscores_eval(Genus) != None else remove_underscores_eval(Genus),
    "family":", ".join(remove_underscores_eval(Family)) if remove_underscores_eval(Family) != None else remove_underscores_eval(Family),
    "order":", ".join(remove_underscores_eval(Order)) if remove_underscores_eval(Order) != None else remove_underscores_eval(Order),
    "class":", ".join(remove_underscores_eval(Class)) if remove_underscores_eval(Class) != None else remove_underscores_eval(Class),
    "phylum":", ".join(remove_underscores_eval(Phylum)) if remove_underscores_eval(Phylum) != None else remove_underscores_eval(Phylum),
    "kingdom":", ".join(remove_underscores_eval(Kingdom)) if remove_underscores_eval(Kingdom) != None else remove_underscores_eval(Kingdom),
    "domain":", ".join(remove_underscores_eval(Domain)) if remove_underscores_eval(Domain) != None else remove_underscores_eval(Domain),

    # "disease_search":remove_underscores_eval(disease_association),
    # "tissue_search":remove_underscores_eval(tissue_sample),
    # "species_search":remove_underscores_eval(Species),
    # "genus_search":remove_underscores_eval(Genus),
    # "family_search":remove_underscores_eval(Family),
    # "order_search":remove_underscores_eval(Order),
    # "class_search":remove_underscores_eval(Class),
    # "phylum_search":remove_underscores_eval(Phylum),
    # "kingdom_search":remove_underscores_eval(Kingdom),
    # "domain_search":remove_underscores_eval(Domain),

    "clusters":cluster_dict,
    "length":length,
    "package":package,
    "forcefield":FF,
    "temperature":temp,
    "pressure":pressure,
    "salt":salt
    }

    json_object = json.dumps(glycan_data, indent=4)
    with open(os.path.join(output_path,f"{iupac}/{iupac}.json"), "w") as outfile:
        outfile.write(json_object)

    glycoshape[ID] = glycan_data

    shutil.copytree(os.path.join(input_path,f"{glycam}/clusters/pack"), os.path.join(output_path,f"{iupac}/output"), dirs_exist_ok=True)

    if glycan_type == "N":
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycan_type == "O":
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("DGlcpNAcb1-4DGlcpNAca1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4DGlcpNAcb1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-6]DGlcpNAca1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-6]DGlcpNAcb1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-3]DGlcpNAca1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-3]DGlcpNAcb1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-3][LFucpa1-6]DGlcpNAca1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("DGlcpNAcb1-4[LFucpa1-3][LFucpa1-6]DGlcpNAcb1-OH"):
        n_glycans.append(iupac)
        n_glycans_mass.append(mass)
        n_glycan = True
    elif glycam.endswith("Fucpa1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("Manpa1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("Xylpa1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("Xylpb1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("Glcpb1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    elif glycam.endswith("GalNAcpa1-OH"):
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)

    if glycam == "DGlcpNAcb1-OH":
        o_glycans.append(iupac)
        o_glycans_mass.append(mass)
    if glycam == "DManpa1-OH":
        c_glycans.append(iupac)
        c_glycans_mass.append(mass)

    try:
        if (n_glycan == True) and (composition["Man"] >=5) and (composition["GlcNAc"] == 2):
            oligomannose.append(iupac)
            oligomannose_mass.append(mass)
    except:
        pass
    try:
        if (n_glycan == True) and (composition["Man"] >=3) and (composition["GlcNAc"] > 2):
            complex.append(iupac)
            complex_mass.append(mass)
    except:
        pass
    try:
        if (n_glycan == True) and (composition["Man"] >=4) and (composition["GlcNAc"] > 2):
            hybrid.append(iupac)
            hybrid_mass.append(mass)
    except:
        pass


    sim_time.append(np.float64(length))

json_object = json.dumps(glycoshape, indent=4)
with open(os.path.join(output_path,"GLYCOSHAPE.json"), "w") as outfile:
    outfile.write(json_object)


GAG = ["GlcNS(a1-4)IdoA(a1-4)GlcNS(a1-4)GlcA(b1-4)GlcNAc6S(a1-4)GlcA(b1-4)GlcNS6S(a1-4)IdoA2S(a1-4)GlcNAc(a1-4)GlcA",
       "GlcNS6S(a1-4)IdoA2S(a1-4)GlcNS6S(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNS(a1-4)IdoA(a1-4)GlcNAc6S(a1-4)GlcA",
       "GlcNS(a1-4)IdoA(a1-4)GlcNS(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNS(a1-4)IdoA(a1-4)GlcNAc(a1-4)GlcA",
       "IdoA(a1-3)GalNAc(b1-4)IdoA2S(a1-3)GalNAc4S(b1-4)IdoA(a1-3)GalNAc(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GlcNS3S6S(a1-4)IdoA2S(a1-4)GlcNS3S6S(a1-4)GlcA2S(b1-4)GlcNAc3S6S(a1-4)GlcA2S(b1-4)GlcNS3S6S(a1-4)IdoA2S(a1-4)GlcNAc3S6S(a1-4)GlcA2S",
       "GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GalNAc(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GlcA(b1-3)GlcNAc(b1-4)GlcA(b1-3)GlcNAc(b1-4)GlcA(b1-3)GlcNAc(b1-4)GlcA(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA",
       "GlcA(b1-3)GalNAc4S(b1-4)GlcA(b1-3)GalNAc4S(b1-4)GlcA(b1-3)GalNAc4S(b1-4)GlcA(b1-3)GalNAc4S(b1-4)GlcA(b1-3)GalNAc4S(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "Gal(b1-4)GlcNAc(b1-3)Gal6S(b1-4)GlcNAc6S(b1-3)Gal(b1-4)GlcNAc(b1-3)Gal(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GlcA(b1-3)GalNAc(b1-4)GlcA2S(b1-3)GalNAc4S(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl",
       "GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA(b1-3)GalNAc(b1-4)GlcA"
       "GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA(a1-4)GlcNAc",
       "IdoA2S(a1-4)GlcNS6S",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA(a1-4)GlcNAc6S",
       "GlcA(b1-4)GlcNS(a1-4)IdoA(a1-4)GlcNS6S",
       "GlcA(b1-4)GlcNAc(a1-4)GlcA2S(b1-4)GlcNAc6S",
       "GlcA(b1-4)GlcNAc(a1-4)GlcA2S(b1-4)GlcNAc",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA2S(a1-4)GlcNS",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA2S(a1-4)GlcNAc",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA2S(a1-4)GlcNAc6S",
       "GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNS(a1-4)IdoA2S(a1-4)GlcNS",
       "GlcA(b1-4)GlcNS(a1-4)IdoA2S(a1-4)GlcNS6S",
       "IdoA2S(a1-4)GlcNS6S(a1-4)IdoA2S(a1-4)GlcNS6S",
       "GlcA(b1-4)GlcNS(a1-4)GlcA2S(b1-4)GlcNS",
       "GlcA(b1-4)GlcNS(a1-4)GlcA2S(b1-4)GlcNS6S",
       "IdoA2S(a1-4)GlcNS6S(a1-4)IdoA2S(a1-4)GlcNS6S(a1-4)IdoA2S(a1-4)GlcNS6S",
       "GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc",
       "GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc",
       "GlcA(b1-4)GlcNAc(a1-4)IdoA(a1-4)GlcNAc(a1-4)GlcA(b1-4)GlcNAc(a1-4)IdoA(a1-4)GlcNAc",
       "GlcA2S(b1-4)GlcNS3S6S(a1-4)GlcA2S(b1-4)GlcNS3S6S(a1-4)GlcA2S(b1-4)GlcNS3S6S(a1-4)GlcA2S(b1-4)GlcNS3S6S"
       ]

# For searching...
df_n = pd.DataFrame(data={"glycan":n_glycans, "mass":n_glycans_mass})
df_n = df_n.drop_duplicates()
n_glycan_sort = df_n.sort_values(by="mass", ascending=True).glycan.values.tolist()

df_o = pd.DataFrame(data={"glycan":o_glycans, "mass":o_glycans_mass})
df_o = df_o.drop_duplicates()
o_glycan_sort = df_o.sort_values(by="mass", ascending=True).glycan.values.tolist()

df_c = pd.DataFrame(data={"glycan":c_glycans, "mass":c_glycans_mass})
df_c = df_c.drop_duplicates()
c_glycan_sort = df_c.sort_values(by="mass", ascending=True).glycan.values.tolist()

df_oligo = pd.DataFrame(data={"glycan":oligomannose, "mass":oligomannose_mass})
df_oligo= df_oligo.drop_duplicates()
oligo_glycan_sort = df_oligo.sort_values(by="mass", ascending=True).glycan.values.tolist()

df_complex = pd.DataFrame(data={"glycan":complex, "mass":complex_mass})
df_complex = df_complex.drop_duplicates()
complex_glycan_sort = df_complex.sort_values(by="mass", ascending=True).glycan.values.tolist()

index_to_drop = [i for i in range(len(hybrid)) if "[GlcNAc(b1-4)]Man(b1-4)" in hybrid[i]] 
hybrid_filter = [i for j, i in enumerate(hybrid) if j not in index_to_drop] # Extra step to remove glycans with bisecting GlcNAc...
hybrid_mass_filter = [i for j, i in enumerate(hybrid_mass) if j not in index_to_drop] # Extra step to remove glycans with bisecting GlcNAc...
df_hybrid = pd.DataFrame(data={"glycan":hybrid_filter, "mass":hybrid_mass_filter})
hybrid_glycan_sort = df_hybrid.sort_values(by="mass", ascending=True).glycan.values.tolist()

glycan_type = {"N":n_glycan_sort,
               "O":o_glycan_sort,
               "C":c_glycan_sort,
               "Oligomannose":oligo_glycan_sort,
               "Complex":complex_glycan_sort,
               "Hybrid":hybrid_glycan_sort,
               "GAG":sorted(list(set(GAG)), key=len)}

json_object = json.dumps(glycan_type, indent=4)
with open(os.path.join(output_path,"GLYCAN_TYPE.json"), "w") as outfile:
    outfile.write(json_object)

with open(os.path.join(output_path,"sim_details.txt"), 'w') as f:
    f.write(f"num_sims = {len(sim_time)}\n")
    f.write(f"sim_length = {sum(sim_time)}")

# Run the conversion script...
os.system("python3 /mnt/database/DB_scripts/GlycoShape_converter.py")

# Run the zipping script...
os.system("bash /mnt/database/DB_scripts/GlycoShape_zip.sh")
