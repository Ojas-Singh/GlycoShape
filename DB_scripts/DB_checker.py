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
import pandas as pd
from tqdm import tqdm
from pathlib import Path

###############################################

input_path = "/mnt/database/glycoshape_data"
output_path = "/mnt/database/DB_temp"
update = True

def glycamtidy(glycam):
    if glycam[-3:] == "-OH":
        glycam = glycam[:-5]
    return glycam

# Function to convert from the glycam nomenclature to the condensed IUPAC nomeclature...
def glycam2iupac(glycam):
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
        mod_component = mod_component.replace("[3Me]", "3Me")
        mod_component = mod_component.replace("[4Me]", "4Me")
        mod_component = mod_component.replace("[9Me]", "9Me")
        mod_component = mod_component.replace("[4A]", "4Ac")
        mod_component = mod_component.replace("[9A]", "9Ac")
        mod_component = mod_component.replace("[6PC]", "6Pc")
        mod_component_list.append(mod_component)
    iupac = "".join(mod_component_list)
    return iupac

def canonicalize_iupac(iupac):
    from glycowork.motif.processing import canonicalize_iupac
    return canonicalize_iupac([iupac])

###############################################

inventory = "/mnt/database/DB_scripts/GlycoShape_Inventory.csv"
df_inventory = pd.read_csv(inventory)
df_inventory = df_inventory[df_inventory['Timestamp'].notna()]
df_inventory[df_inventory.columns[3]] = [glycamtidy(i) for i in df_inventory[df_inventory.columns[3]].values]
inventory_glycan = df_inventory[df_inventory.columns[3]].values.tolist()
inventory_glycan = [str(glycam2iupac(glycam_tidy)) for glycam_tidy in inventory_glycan]
inventory_glycan = [canonicalize_iupac(iupac_untidy)[2:-2] for iupac_untidy in inventory_glycan]

db = [ f.split("/")[-2] for f in glob.glob("/mnt/database/DB_temp/*/", recursive = True)]


# Glycans present in the DB, but not in the inventory...
print("PRESENT IN THE DB, BUT NOT IN THE INVENTORY")
diff = list(set(db) - set(inventory_glycan))
for glycan in diff:
    print(glycan)
print("#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n")

# Glycans present in the inventory, but not in the DB...
print("PRESENT IN THE INVENTORY, BUT NOT IN THE DB")
diff = list(set(inventory_glycan) - set(db))
for glycan in diff:
    print(glycan)
print("#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n#######################\n")