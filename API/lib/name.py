import requests
import logging
import subprocess
from pathlib import Path
from glycowork.motif.processing import IUPAC_to_SMILES
import re
from rdkit import Chem


logger = logging.getLogger(__name__)

def glytoucan2iupac(glytoucan_ac):
    """Get Glygen data for a GlyTouCan accession number.

    Args:
        glytoucan_ac (str): GlyTouCan accession number
        
    Returns:
        dict: Glygen data or None if request fails
    """
    url = f"https://api.glygen.org/glycan/detail/{glytoucan_ac}/"

    try:
        response = requests.post(
            url,
            headers={'accept': 'application/json', 'Content-Type': 'application/json'},
            json={'glytoucan_ac': glytoucan_ac},
            verify=False
        )
        response.raise_for_status()
        data = response.json()
        if data.get('iupac'):
            iupac = data['iupac']
            if iupac.endswith("-(1→"):
                return iupac
            else:
                return iupac + "-(1→"
    except Exception as e:
        logger.error(f"Failed to get Glygen data: {str(e)}")
        return None
    
def glycam2iupac(glycam):
    # Define a dictionary of default stereochemistry for common monosaccharides
    default_stereochemistry = {
        "4eLeg": "D", "6dAlt": "L", "6dAltNAc": "L", "6dGul": "D",
        "6dTal": "D", "6dTalNAc": "D", "8eAci": "D", "8eLeg": "L",
        "Abe": "D", "Aci": "L", "All": "D", "AllA": "D", "AllN": "D",
        "AllNAc": "D", "Alt": "L", "AltA": "L", "AltN": "L", "AltNAc": "L",
        "Api": "L", "Ara": "L", "Bac": "D", "Col": "L", "DDmanHep": "D",
        "Dha": "D", "Dig": "D", "Fru": "D", "Fuc": "L", "FucNAc": "L",
        "Gal": "D", "GalA": "D", "GalN": "D", "GalNAc": "D", "Glc": "D",
        "GlcA": "D", "GlcN": "D", "GlcNAc": "D", "Gul": "D", "GulA": "D",
        "GulN": "D", "GulNAc": "D", "Ido": "L", "IdoA": "L", "IdoN": "L",
        "IdoNAc": "L", "Kdn": "D", "Kdo": "D", "Leg": "D", "LDmanHep": "L",
        "Lyx": "D", "Man": "D", "ManA": "D", "ManN": "D", "ManNAc": "D",
        "Mur": "D", "MurNAc": "D", "MurNGc": "D", "Neu": "D", "Neu5Ac": "D",
        "Neu5Gc": "D", "Oli": "D", "Par": "D", "Pse": "L", "Psi": "D",
        "Qui": "D", "QuiNAc": "D", "Rha": "L", "RhaNAc": "L", "Rib": "D",
        "Sia": "D", "Sor": "L", "Tag": "D", "Tal": "D", "TalA": "D",
        "TalN": "D", "TalNAc": "D", "Tyv": "D", "Xyl": "D"
    }
    
    if glycam == "DGalpb1-4DGalpa1-3[2,4-diacetimido-2,4,6-trideoxyhexose]":
        iupac = "Gal(b1-4)Gal(a1-3)2,4-diacetimido-2,4,6-trideoxyhexose"
    else:
        glycam_components = glycam.split("-")
        mod_component_list = []
        for component in glycam_components:
            mod_component = component
            
            # Check for stereochemistry and modify appropriately
            for sugar, default in default_stereochemistry.items():
                if sugar in mod_component:
                    if default == "D":
                        mod_component = mod_component.replace("D", "")
                        mod_component = mod_component.replace("L", "L-")
                    elif default == "L":
                        mod_component = mod_component.replace("L", "")
                        mod_component = mod_component.replace("D", "D-")
            
            mod_component = mod_component.replace("p", "")
            # mod_component = mod_component.replace("f", "")
            
            # Handle glycosidic linkages
            if component != glycam_components[-1]:
                mod_component = mod_component.replace(mod_component[-2:], f"({mod_component[-2:]}-", 1)
            if component != glycam_components[0]:
                mod_component = mod_component.replace(mod_component[0], f"{mod_component[0]})", 1)
            
            # Replace common modifications
            mod_component = mod_component.replace("[2S]", "2S")
            mod_component = mod_component.replace("[3S]", "3S")
            mod_component = mod_component.replace("[4S]", "4S")
            mod_component = mod_component.replace("[6S]", "6S")
            mod_component = mod_component.replace("[3S-6S]", "3S6S")
            mod_component = mod_component.replace("[3S,6S]", "3S6S")
            mod_component = mod_component.replace("[2Me]", "2Me")
            mod_component = mod_component.replace("[2Me-3Me]", "2Me3Me")
            mod_component = mod_component.replace("[2Me,3Me]", "2Me3Me")
            mod_component = mod_component.replace("[2Me-4Me]", "2Me4Me")
            mod_component = mod_component.replace("[2Me,4Me]", "2Me4Me")
            mod_component = mod_component.replace("[2Me-6Me]", "2Me6Me")
            mod_component = mod_component.replace("[2Me,6Me]", "2Me6Me")
            mod_component = mod_component.replace("[2Me-3Me-4Me]", "2Me3Me4Me")
            mod_component = mod_component.replace("[2Me,3Me,4Me]", "2Me3Me4Me")
            mod_component = mod_component.replace("[3Me]", "3Me")
            mod_component = mod_component.replace("[4Me]", "4Me")
            mod_component = mod_component.replace("[9Me]", "9Me")
            mod_component = mod_component.replace("[2A]", "2Ac")
            mod_component = mod_component.replace("[4A]", "4Ac")
            mod_component = mod_component.replace("[9A]", "9Ac")
            mod_component = mod_component.replace("[6PC]", "6Pc")
            
            mod_component_list.append(mod_component)
        
        iupac = "".join(mod_component_list)
    return iupac



def iupac2wurcs_glytoucan(iupac_condensed):
    """
    Converts IUPAC condensed format to WURCS format and retrieves the GlyTouCan accession number.

    Parameters:
        iupac_condensed (str): The IUPAC Condensed format string.

    Returns:
        dict: A dictionary containing the GlyTouCan accession number and WURCS format, 
              or an error message if the request fails.
    """
    # Base URL for the API endpoint
    url = f"https://api.glycosmos.org/glycanformatconverter/2.10.0/iupaccondensed2wurcs/{iupac_condensed}"
    
    try:
        # Make the API request
        response = requests.get(url)
        # Raise an exception if the request failed
        response.raise_for_status()
        
        # Parse the JSON response
        data = response.json()
        return data.get("id"),data.get("WURCS")
    except requests.exceptions.RequestException as e:
        # Handle any request exceptions
        return {"error": str(e)}
    except KeyError:
        # Handle unexpected response structure
        return {"error": "Unexpected response structure"}
    

def smiles2wurcs(smiles):
    jar_path = Path(__file__).parent / "MolWURCS.jar"
    print("Using MolWURCS at :",jar_path)
    try:
        result = subprocess.run(
            ["java", "-jar", str(jar_path), "--in", "smi", "--out", "wurcs", smiles],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to convert SMILES to WURCS: {e.stderr}")
        return None

def wurcs2alpha_beta(wurcs):
    alpha = wurcs.replace("x", "a")
    beta = wurcs.replace("x", "b")
    return alpha, beta

def wurcsmatch(wurcs):
    format_match = re.search(r'WURCS=2\.0/(\d+,\d+,\d+)/', wurcs)
    format_part = format_match.group(1) if format_match else None

    # Match the residue list part enclosed in square brackets
    residues_match = re.findall(r'\[([^\]]+)\]', wurcs)
    residues_list = residues_match if residues_match else []


    return format_part, residues_list

def wurcs_split(wurcs):
    """
    Parse a WURCS string and extract UniqueRESs, RESs, LINs, RES Sequence list, and LIN list.

    Args:
        wurcs (str): WURCS string, e.g. 
            "WURCS=2.0/3,5,4/[a2122h-1b_1-5_2*NCC/3=O][a1122h-1b_1-5][a1122h-1a_1-5]/1-1-2-3-3/a4-b1_b4-c1_c3-d1_c6-e1"

    Returns:
        dict: {
            "unique_res_count": int,
            "res_count": int,
            "lin_count": int,
            "unique_res_list": list of str,
            "res_sequence": list of int,
            "lin_list": list of str
        }
    """
    # Remove prefix if present
    if wurcs.startswith("WURCS="):
        wurcs = wurcs.split("=", 1)[1]
    # Split into sections
    try:
        # Split into header and the rest
        parts = wurcs.split("/", 3)
        if len(parts) != 4:
            raise ValueError("WURCS string does not have the expected number of sections")
        _, counts, rest = parts[0], parts[1], parts[2] + "/" + parts[3]
        unique_res_count, res_count, lin_count = map(int, counts.split(","))
        # Extract all unique residues (inside brackets)
        unique_res_list = re.findall(r'\[([^\]]+)\]', rest)
        # Remove all unique residues from the string to get the rest
        after_unique_res = re.sub(r'(\[[^\]]+\])+', '', rest, count=unique_res_count)
        # Now after_unique_res should start with a slash, then RES sequence, then slash, then LINs
        after_unique_res = after_unique_res.lstrip("/")
        if "/" in after_unique_res:
            res_seq_str, lin_str = after_unique_res.split("/", 1)
        else:
            res_seq_str, lin_str = after_unique_res, ""
        # RES Sequence: list of ints
        res_sequence = [int(x) for x in res_seq_str.split("-") if x]
        # LINs: list of strings separated by _
        lin_list = lin_str.split("_") if lin_str else []
        return {
            "unique_res_count": unique_res_count,
            "res_count": res_count,
            "lin_count": lin_count,
            "unique_res_list": unique_res_list,
            "res_sequence": res_sequence,
            "lin_list": lin_list
        }
    except Exception as e:
        logger.error(f"Failed to parse WURCS: {e}")
        return None

def glycam2wurcs(glycam):
    iupac = glycam2iupac(glycam)
    id, wurcs = iupac2wurcs_glytoucan(iupac)
    smiles = IUPAC_to_SMILES([iupac])[0]
    return smiles2wurcs(smiles)


def pdb2wurcs(pdb_path):
    try:
        # Read the PDB file and convert it to an RDKit molecule
        mol = Chem.MolFromPDBFile(pdb_path, removeHs=False)
        if mol is None:
            logger.error(f"Failed to read PDB file: {pdb_path}")
            return None
        
        # Convert the RDKit molecule to a SMILES string
        smiles = Chem.MolToSmiles(mol)
        
        # Convert the SMILES string to WURCS format
        wurcs = smiles2wurcs(smiles)
        return wurcs
    except Exception as e:
        logger.error(f"Failed to convert PDB to WURCS: {str(e)}")
        return None

def wurcs2glytoucan(wurcs):
    """Convert WURCS to GlyTouCan ID using GlyCosmos API.
    
    Args:
        wurcs (str): WURCS format string
        
    Returns:
        str: GlyTouCan ID or None if request fails
    """
    try:
        # URL encode the WURCS string
        encoded_wurcs = requests.utils.quote(wurcs)
        url = f"https://api.glycosmos.org/sparqlist/wurcs2gtcids?wurcs={encoded_wurcs}"
        
        # Make the request
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        if data and isinstance(data, list) and len(data) > 0:
            return data[0].get("id")
            
        return None
        
    except Exception as e:
        logger.error(f"Failed to convert WURCS to GlyTouCan ID: {str(e)}")
        return None