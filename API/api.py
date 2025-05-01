from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
import pandas as pd
from pathlib import Path
import requests
import sys, time
import os,json
import time
from datetime import datetime
from lib import config, GOTW_script, name , natural2sparql
from glycowork.motif.draw import GlycoDraw
import tempfile
import shutil
import zipfile
import tempfile
from thefuzz import fuzz
import geocoder
import io
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 5000 * 1024 * 1024
CORS(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app, supports_credentials=True)

# Initialize the Natural2SPARQL client (consider doing this once outside the request if possible)
# Ensure ANTHROPIC_API_KEY environment variable is set
try:
    n2s_client = natural2sparql.Natural2SPARQL()
except ValueError as e:
    print(f"Warning: Natural2SPARQL client could not be initialized: {e}")
    n2s_client = None


# load directory 
GLYCOSHAPE_DIR = Path(config.glycoshape_database_dir)
GLYCOSHAPE_CSV = Path(config.glycoshape_inventory_csv)
GLYCOSHAPE_RAWDATA_DIR = Path(config.glycoshape_rawdata_dir)
GLYCOSHAPE_UPLOAD_DIR = Path(config.glycoshape_upload_dir)


# Define the path to the CSV file
CSV_FILE_PATH = 'visitors.csv'

# Ensure the CSV file exists; if not, create it with headers
if not os.path.exists(CSV_FILE_PATH):
    # Create a new CSV file with headers (timestamp, ip_address, latitude, longitude)
    pd.DataFrame(columns=['timestamp', 'ip_address', 'latitude', 'longitude']).to_csv(CSV_FILE_PATH, index=False)

def get_geolocation(ip):
    """Get geolocation for the given IP address using geocoder."""
    try:
        g = geocoder.ip(ip)
        if g.ok:
            return g.latlng  # Returns [latitude, longitude]
        return None, None  # If no geolocation is found
    except Exception as e:
        print(f"Error getting geolocation for IP {ip}: {e}")
        return None, None

@app.route('/api/log', methods=['GET'])
def log_visitor():
    # Check for existing cookie
    if request.cookies.get('visited'):
        return 'Already logged today', 200

    # Get client IP address
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr

    # Log IP and timestamp
    timestamp = datetime.now()
    print(f"Logging IP {ip} at {timestamp}")
    print(get_geolocation(ip))
    latitude, longitude = get_geolocation(ip)

    
    # Check if file exists, to write headers if not
    file_exists = os.path.exists(CSV_FILE_PATH)

    # Open the file in append mode
    with open(CSV_FILE_PATH, 'a') as f:
        # Write headers if the file is new
        if not file_exists:
            f.write("timestamp,ip_address,latitude,longitude\n")

        # Write the new entry
        f.write(f"{timestamp},{ip},{latitude},{longitude}\n")

    # Create a response and set a cookie with 24-hour expiration
    response = make_response("Logged", 200)
    response.set_cookie('visited', 'yes', max_age=86400)  # 86400 seconds = 24 hours
    return response



@app.route('/api/visitors', methods=['GET'])
def get_visitors():
    """API to fetch the CSV data."""
    try:
        if os.path.exists(CSV_FILE_PATH):
            # Read the CSV file manually to handle malformed rows
            with open(CSV_FILE_PATH, 'r') as f:
                lines = f.readlines()
            
            header = lines[0]
            valid_lines = [header]
            
            # Filter lines with exactly 3 commas (4 fields)
            for line in lines[1:]:
                if line.count(',') == 3:
                    valid_lines.append(line)
            
            # Create a temporary file with valid lines
            with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
                tmp.writelines(valid_lines)
                tmp_path = tmp.name
            
            # Read the valid data with pandas
            df = pd.read_csv(tmp_path)
            os.unlink(tmp_path)  # Delete the temporary file
            
            # Drop the 'ip_address' column
            if 'ip_address' in df.columns:
                df = df.drop(columns=['ip_address'])
            
            # Convert 'None' strings to NaN and drop rows with NaN values
            df = df.replace('None', pd.NA)
            df = df.dropna()
            
            # Convert to list of dictionaries and return as JSON
            visitor_data = df.to_dict(orient='records')
            return jsonify(visitor_data)
        else:
            return jsonify({'error': 'CSV file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error processing visitor data: {str(e)}'}), 500
    

with open(GLYCOSHAPE_DIR / 'GLYCOSHAPE.json', 'r') as file:
    GDB_data = json.load(file)
    print('Glycan database loaded')

@app.route('/api/available', methods=['GET'])
def get_available():
    glytoucan_list = []
    for glycan_data in GDB_data.values():
            glytoucan_list.append(glycan_data['archetype']['glytoucan'])
            glytoucan_list.append(glycan_data['alpha']['glytoucan'])
            glytoucan_list.append(glycan_data['beta']['glytoucan'])
    glytoucan_list = [x for x in glytoucan_list if x is not None]
    return jsonify(glytoucan_list)

@app.route('/api/exist/<identifier>', methods=['GET'])
def is_exist(identifier):
    """
    Checks if a glycan identifier exists either as a raw/uploaded folder
    or within the processed GlycoShape database (GDB_data).
    Accepts GLYCAM name, GlyTouCan ID, IUPAC, or WURCS.
    Includes checks via IUPAC/GLYCAM to WURCS conversion and alpha/beta WURCS generation.
    """
    try:
        # 1. Check if the identifier corresponds to an existing raw data or upload folder
        folder_path = GLYCOSHAPE_RAWDATA_DIR / identifier
        folder2_path = GLYCOSHAPE_UPLOAD_DIR / identifier
        if folder_path.is_dir() or folder2_path.is_dir():
            return jsonify({'exists': True, 'reason': 'Folder found'})
        # 1b. Check if a folder exists matching the identifier minus the last 5 characters
        if len(identifier) > 5:
            base_identifier = identifier[:-5]
            
        
            # Check raw data directory
            if GLYCOSHAPE_RAWDATA_DIR.is_dir():
                for folder in GLYCOSHAPE_RAWDATA_DIR.iterdir():
                    if folder.is_dir() and len(folder.name) == len(identifier):
                        # Check if the folder matches the base and only differs in the last 5 chars
                        if folder.name.startswith(base_identifier) and folder.name != identifier:
                            return jsonify({
                                'exists': True,
                                'reason': f'Similar folder found in raw data: {folder.name}'
                            })
            
            # Check upload directory
            if GLYCOSHAPE_UPLOAD_DIR.is_dir():
                for folder in GLYCOSHAPE_UPLOAD_DIR.iterdir():
                    if folder.is_dir() and len(folder.name) == len(identifier):
                        # Check if the folder matches the base and only differs in the last 5 chars
                        if folder.name.startswith(base_identifier) and folder.name != identifier:
                            return jsonify({
                                'exists': True,
                                'reason': f'Similar folder found in uploads: {folder.name}'
                            })

        # 2. Prepare for conversions and WURCS checks
        identifier_lower = identifier.lower()
        converted_wurcs = None        # WURCS string if conversion succeeds
        conversion_type = None
        input_is_wurcs = identifier.startswith('WURCS=')
        input_wurcs_lower = identifier_lower if input_is_wurcs else None
        generated_alpha_wurcs = None # Stores lowercase generated alpha WURCS
        generated_beta_wurcs = None  # Stores lowercase generated beta WURCS

        # Try IUPAC to WURCS conversion
        if "(" in identifier: # Basic heuristic for IUPAC
            try:
                # name.iupac2wurcs_glytoucan returns (glytoucan, wurcs)
                wurcs_tuple = name.iupac2wurcs_glytoucan(identifier)
                if wurcs_tuple and wurcs_tuple[1]: # Check if WURCS string exists
                    converted_wurcs = wurcs_tuple[1] # Keep original case for potential processing
                    conversion_type = "IUPAC"
                    print(f"Converted IUPAC '{identifier}' to WURCS: {converted_wurcs}") # Debugging
            except Exception as e:
                # Log conversion error but continue checking other methods
                print(f"IUPAC to WURCS conversion failed for '{identifier}': {e}")

        # Try GLYCAM to WURCS conversion (if not already identified as IUPAC->WURCS)
        # Avoid converting if it looks like IUPAC or WURCS or contains spaces (likely not GLYCAM)
        if not converted_wurcs and not input_is_wurcs and "(" not in identifier and " " not in identifier:
             try:
                # Assume identifier might be a GLYCAM name, convert to IUPAC first
                iupac_from_glycam = name.glycam2iupac(identifier)
                if iupac_from_glycam:
                    wurcs_tuple = name.iupac2wurcs_glytoucan(iupac_from_glycam)
                    if wurcs_tuple and wurcs_tuple[1]:
                        converted_wurcs = wurcs_tuple[1] # Keep original case
                        conversion_type = "GLYCAM"
                        print(f"Converted GLYCAM '{identifier}' to WURCS: {converted_wurcs}") # Debugging
             except Exception as e:
                 # Log conversion error but continue checking other methods
                print(f"GLYCAM to WURCS conversion failed for '{identifier}': {e}")

        # Determine the WURCS string to use for alpha/beta generation (prefer input if it was WURCS)
        wurcs_to_process_for_ab = identifier if input_is_wurcs else converted_wurcs

        if wurcs_to_process_for_ab:
            try:
                # Call the function with the determined WURCS string (original case)
                alpha_w, beta_w = name.wurcs2alpha_beta(wurcs_to_process_for_ab)
                # Store results in lowercase for comparison
                generated_alpha_wurcs = alpha_w.lower() if alpha_w else None
                generated_beta_wurcs = beta_w.lower() if beta_w else None
                print(f"Generated alpha/beta WURCS from '{wurcs_to_process_for_ab}': alpha='{generated_alpha_wurcs}', beta='{generated_beta_wurcs}'") # Debugging
            except Exception as e:
                print(f"WURCS to alpha/beta conversion failed for '{wurcs_to_process_for_ab}': {e}")

        # Prepare lowercase version of converted WURCS for comparison
        converted_wurcs_lower = converted_wurcs.lower() if converted_wurcs else None

        # 3. Check identifiers against the processed database (GDB_data)
        for glycan_id, glycan_data in GDB_data.items():
            archetype = glycan_data.get('archetype', {})
            alpha = glycan_data.get('alpha', {})
            beta = glycan_data.get('beta', {})

            # --- Direct Identifier Checks ---
            # GlyTouCan (case-sensitive)
            if archetype.get('glytoucan') == identifier: return jsonify({'exists': True, 'reason': 'GlyTouCan Match (Archetype)', 'glytoucan': identifier, 'ID': archetype.get('ID')})
            if alpha.get('glytoucan') == identifier: return jsonify({'exists': True, 'reason': 'GlyTouCan Match (Alpha)', 'glytoucan': identifier, 'ID': archetype.get('ID')})
            if beta.get('glytoucan') == identifier: return jsonify({'exists': True, 'reason': 'GlyTouCan Match (Beta)', 'glytoucan': identifier, 'ID': archetype.get('ID')})

            # IUPAC (case-insensitive)
            if archetype.get('iupac') and archetype.get('iupac').lower() == identifier_lower: return jsonify({'exists': True, 'reason': 'IUPAC Match (Archetype)', 'glytoucan': archetype.get('glytoucan'), 'ID': archetype.get('ID')})
            if alpha.get('iupac') and alpha.get('iupac').lower() == identifier_lower: return jsonify({'exists': True, 'reason': 'IUPAC Match (Alpha)', 'glytoucan': alpha.get('glytoucan'), 'ID': archetype.get('ID')})
            if beta.get('iupac') and beta.get('iupac').lower() == identifier_lower: return jsonify({'exists': True, 'reason': 'IUPAC Match (Beta)', 'glytoucan': beta.get('glytoucan'), 'ID': archetype.get('ID')})

            # GLYCAM (case-insensitive) - Check archetype only as GLYCAM name usually refers to the base structure
            if archetype.get('glycam') and archetype.get('glycam').lower() == identifier_lower: return jsonify({'exists': True, 'reason': 'GLYCAM Match (Archetype)', 'glytoucan': archetype.get('glytoucan'), 'ID': archetype.get('ID')})

            # --- WURCS Checks (case-insensitive) ---
            # Get lowercase WURCS from DB, handling missing keys/values
            db_archetype_wurcs = archetype.get('wurcs', '').lower() if archetype.get('wurcs') else None
            db_alpha_wurcs = alpha.get('wurcs', '').lower() if alpha.get('wurcs') else None
            db_beta_wurcs = beta.get('wurcs', '').lower() if beta.get('wurcs') else None

            # Check input WURCS (if identifier was WURCS)
            if input_wurcs_lower:
                if db_archetype_wurcs == input_wurcs_lower: return jsonify({'exists': True, 'reason': 'Input WURCS Match (Archetype)', 'glytoucan': archetype.get('glytoucan'), 'ID': archetype.get('ID')})
                if db_alpha_wurcs == input_wurcs_lower: return jsonify({'exists': True, 'reason': 'Input WURCS Match (Alpha)', 'glytoucan': alpha.get('glytoucan'), 'ID': archetype.get('ID')})
                if db_beta_wurcs == input_wurcs_lower: return jsonify({'exists': True, 'reason': 'Input WURCS Match (Beta)', 'glytoucan': beta.get('glytoucan'), 'ID': archetype.get('ID')})

            # Check converted WURCS (lowercase comparison)
            if converted_wurcs_lower:
                if db_archetype_wurcs == converted_wurcs_lower: return jsonify({'exists': True, 'reason': f'Converted {conversion_type} to WURCS Match (Archetype)', 'glytoucan': archetype.get('glytoucan'), 'ID': archetype.get('ID')})
                if db_alpha_wurcs == converted_wurcs_lower: return jsonify({'exists': True, 'reason': f'Converted {conversion_type} to WURCS Match (Alpha)', 'glytoucan': alpha.get('glytoucan'), 'ID': archetype.get('ID')})
                if db_beta_wurcs == converted_wurcs_lower: return jsonify({'exists': True, 'reason': f'Converted {conversion_type} to WURCS Match (Beta)', 'glytoucan': beta.get('glytoucan'), 'ID': archetype.get('ID')})

            # Check generated alpha WURCS against DB alpha WURCS
            if generated_alpha_wurcs and db_alpha_wurcs == generated_alpha_wurcs:
                 return jsonify({'exists': True, 'reason': f'Generated Alpha WURCS Match (Alpha)', 'glytoucan': alpha.get('glytoucan'), 'ID': archetype.get('ID')})

            # Check generated beta WURCS against DB beta WURCS
            if generated_beta_wurcs and db_beta_wurcs == generated_beta_wurcs:
                 return jsonify({'exists': True, 'reason': f'Generated Beta WURCS Match (Beta)', 'glytoucan': beta.get('glytoucan'), 'ID': archetype.get('ID')})

        # 4. If not found after all checks
        return jsonify({'exists': False, 'reason': 'Identifier not found'})

    except Exception as e:
        print(f"Error in /api/exist/{identifier}: {e}")
        # import traceback # Consider adding for detailed debugging
        # traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/api/glycan/<identifier>', methods=['GET'])
def get_glycan(identifier):
    # First check if it's a direct glycan ID match
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_id == identifier:
            return jsonify(glycan_data)
        
    # Check for glytoucan ID match
    for glycan_id, glycan_data in GDB_data.items():
        if (glycan_data['archetype']['glytoucan'] == identifier or 
            glycan_data['alpha']['glytoucan'] == identifier or 
            glycan_data['beta']['glytoucan'] == identifier):
            return jsonify(glycan_data)
    
    # Check for IUPAC match (if the identifier contains parentheses, likely an IUPAC notation)
    if "(" in identifier:
        for glycan_id, glycan_data in GDB_data.items():
            if (glycan_data['archetype'].get('iupac') == identifier or 
                glycan_data['alpha'].get('iupac') == identifier or 
                glycan_data['beta'].get('iupac') == identifier):
                return jsonify(glycan_data)
    
    return jsonify({"error": "Glycan not found"}), 404

@app.route('/api/pdb/<identifier>', methods=['GET'])
def get_pdb(identifier):
    glycoshape_entry = None
    is_alpha = False
    is_beta = False
    is_archetype = False
    
    # First check if it's a direct glycan ID match
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_id == identifier:
            glycoshape_entry = glycan_data['archetype']['ID']
            is_archetype = True
            break
    
    # If not found by ID, check for glytoucan ID match
    if not glycoshape_entry:
        for glycan_id, glycan_data in GDB_data.items():
            if glycan_data['alpha']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_alpha = True
                break
            elif glycan_data['beta']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_beta = True
                break
            elif glycan_data['archetype']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_archetype = True
                break
    
    # Check for IUPAC match (if the identifier contains parentheses, likely an IUPAC notation)
    if not glycoshape_entry and "(" in identifier:
        for glycan_id, glycan_data in GDB_data.items():
            if glycan_data.get('archetype', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_archetype = True
                break
            elif glycan_data.get('alpha', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_alpha = True
                break
            elif glycan_data.get('beta', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                is_beta = True
                break
    
    if glycoshape_entry:
        if is_alpha or is_archetype:
            pdb_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_alpha.PDB.pdb'
            alt_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_beta.PDB.pdb'
        elif is_beta:
            pdb_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_beta.PDB.pdb'
            alt_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_alpha.PDB.pdb'
        
        if pdb_file_path.exists():
            return send_file(pdb_file_path, as_attachment=True)
        elif alt_file_path.exists():
            return send_file(alt_file_path, as_attachment=True)
        else:
            return jsonify({"error": "PDB file not found"}), 404
            
    return jsonify({"error": f"Glycan not found for identifier: {identifier}"}), 404

@app.route('/api/svg/<identifier>', methods=['GET'])
def get_svg(identifier):
    glycoshape_entry = None
    
    # First check if it's a direct glycan ID match
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_id == identifier:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
    
    # If not found by ID, check for glytoucan ID match
    if not glycoshape_entry:
        for glycan_id, glycan_data in GDB_data.items():
            if glycan_data['alpha']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data['beta']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data['archetype']['glytoucan'] == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
    
    # Check for IUPAC match (if the identifier contains parentheses, likely an IUPAC notation)
    if not glycoshape_entry and "(" in identifier:
        for glycan_id, glycan_data in GDB_data.items():
            if glycan_data.get('archetype', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data.get('alpha', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data.get('beta', {}).get('iupac') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
    
    if glycoshape_entry:
        svg_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/snfg.svg'
        if svg_file_path.exists():
            return send_file(svg_file_path, as_attachment=True)
        else:
            return jsonify({"error": "SVG file not found"}), 404
            
    return jsonify({"error": "Glycan not found for identifier: " + identifier}), 404


@app.route('/database/<path:filepath>', methods=['GET'])
def serve_file(filepath):
    try:
        safe_path = os.path.normpath(filepath)
        full_path = GLYCOSHAPE_DIR / safe_path
        if os.path.isfile(full_path):
            return send_file(full_path, as_attachment=True)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/draw/<iupac>', methods=['GET'])
def get_glycowork(iupac):
    try:
        with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as tmp:
            temp_path = tmp.name
            GlycoDraw(iupac, show_linkage=True, filepath=temp_path)
            response = send_file(temp_path, mimetype='image/svg+xml')
            os.remove(temp_path)  # Clean up temp file after sending
            return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/draw/<glycan>/<motif>', methods=['GET'])
def get_glycowork_with_motif(glycan, motif):
    try:
        if len(motif)== 8:
            motif = name.glytoucan2iupac(motif)
        with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as tmp:
            temp_path = tmp.name
            GlycoDraw(glycan, highlight_motif=motif, show_linkage=Flask, filepath=temp_path)
            response = send_file(temp_path, mimetype='image/svg+xml')
            os.remove(temp_path)
            return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/api/request', methods=['POST'])
def add_request():
    try:
        data = request.get_json()
        glytoucan = data.get('glytoucan')
        if glytoucan:
            with open('request.txt', 'a') as f:
                f.write(f"{glytoucan}\n")
            return jsonify({"message": "Request added successfully"})
        return jsonify({"error": "No glytoucan provided"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def zip_directory(folder_path, zip_path):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, folder_path))


def GOTW_process(url: str):
    """
    Process a given URL for GOTW data, extract and process files, and generate output.
    Uses robust download mechanism with retries and resume support.

    Args:
        url (str): URL to the zip file.

    Returns:
        tuple: Path to the result directory and the glycam name.
    """
    zip_file_path = None
    try:
        # Configure a session with retry logic
        session = requests.Session()
        retry_strategy = Retry(
            total=3,  # Maximum number of retries
            backoff_factor=1.5,  # Exponential backoff: 1.5s, 3s, 4.5s, etc.
            status_forcelist=[500, 502, 503, 504, 408, 429],  # Retry on these HTTP errors
            allowed_methods=["GET"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        # Create a temporary directory for output
        with tempfile.TemporaryDirectory() as output_folder:
            output_path = Path(output_folder)

            # Create a temp file for the zip download that persists until we're done with it
            with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as zip_file:
                zip_file_path = zip_file.name
            
            # Check if we have a partial download already
            resume_position = 0
            if os.path.exists(zip_file_path):
                resume_position = os.path.getsize(zip_file_path)
                print(f"Partial download found. Resuming from byte {resume_position}")

            # Set the range header to resume download if needed
            headers = {}
            if resume_position > 0:
                headers["Range"] = f"bytes={resume_position}-"
            else:
                headers["Range"] = "bytes=0-"  # Ensure full file is requested if starting fresh

            # Download the zip file with streaming and resume capability
            response = session.get(
                url,
                stream=True,
                timeout=(10, 60),  # Connect timeout: 10s, Read timeout: 60s
                headers=headers
            )
            response.raise_for_status()  # Raise an exception for bad status codes

            # Get the total file size from headers (if available)
            total_size = 0
            if "Content-Range" in response.headers:
                # Extract total size from Content-Range: bytes X-Y/TOTAL
                content_range = response.headers.get("Content-Range", "")
                total_size_match = content_range.split("/")[-1]
                if total_size_match.isdigit():
                    total_size = int(total_size_match)
            elif "Content-Length" in response.headers:
                if resume_position > 0:
                    # If resuming, Content-Length is just the remaining bytes
                    total_size = resume_position + int(response.headers.get("Content-Length", 0))
                else:
                    total_size = int(response.headers.get("Content-Length", 0))

            # Determine file mode based on resume state
            file_mode = "ab" if resume_position > 0 else "wb"
            
            # Save the streamed content to the temporary zip file
            with open(zip_file_path, file_mode) as f:
                bytes_written = resume_position
                for chunk in response.iter_content(chunk_size=512 * 1024):  # 512KB chunks
                    if chunk:  # Filter out keep-alive new chunks
                        f.write(chunk)
                        bytes_written += len(chunk)
                        print(f"Downloaded {bytes_written} bytes of {total_size if total_size > 0 else 'unknown size'}")

            # Verify the download size matches the expected size (if provided)
            if total_size > 0 and bytes_written != total_size:
                raise ValueError(
                    f"Download incomplete: {bytes_written} bytes received, "
                    f"expected {total_size} bytes"
                )

            # Create a temporary folder for extracting the files
            with tempfile.TemporaryDirectory() as tmpdir:
                # Extract the zip file
                with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                    zip_ref.extractall(tmpdir)

                glycan_name = None  # Initialize name variable
                # Process each subdirectory
                for root, dirs, files in os.walk(tmpdir):
                    if "structure.off" in files and "structure.pdb" in files:
                        json_file = os.path.join(root, "info.json")
                        off_file = os.path.join(root, "structure.off")
                        pdb_file = os.path.join(root, "structure.pdb")

                        if os.path.exists(json_file):
                            with open(json_file, 'r') as f:
                                data = json.load(f)
                            glycam = data.get("indexOrderedSequence", "output")
                            glycam_tidy = glycam[:-5]
                            iupac = name.glycam2iupac(glycam_tidy)
                            glytoucan = name.iupac2wurcs_glytoucan(iupac)[0]
                            if glytoucan is not None and len(glycam) > 250 :
                                glycan_name = glytoucan
                            else:
                                glycan_name = glycam
                            conformer_id = data.get("conformerID", "output")
                            output_folder_path = GOTW_script.process_app(f'{glycan_name}/{conformer_id}', pdb_file, off_file, 200)

                            # Move the processed folder to the temp output directory
                            processed_subfolder = Path(output_folder_path)
                            target_subfolder = output_path / processed_subfolder.name
                            shutil.move(processed_subfolder, target_subfolder)
                            shutil.move(json_file, target_subfolder / "info.json")
                        else:
                            print(f"info.json not found in {root}")

                # Create a new temp directory for the final result
                result_dir = tempfile.mkdtemp()

                # Copy the contents from output_path to result_dir
                shutil.copytree(output_path, result_dir, dirs_exist_ok=True)

            # Return the final result directory and glycam name
            return Path(result_dir), glycan_name

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return None, None
    except zipfile.BadZipFile:
        print("Error: The downloaded file is not a valid zip file.")
        # If we have a bad zip file, remove it so we don't try to resume from it
        if zip_file_path and os.path.exists(zip_file_path):
            os.remove(zip_file_path)
        return None, None
    except ValueError as e:
        print(f"Download validation error: {e}")
        return None, None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None, None
    finally:
        # Ensure the temporary zip file is deleted
        if zip_file_path and os.path.exists(zip_file_path):
            try:
                os.remove(zip_file_path)
            except Exception as e:
                print(f"Failed to remove temporary file {zip_file_path}: {e}")


@app.route('/api/gotw', methods=['POST'])
def gotw():
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400

    output_folder_path, name = GOTW_process(url)

    if not output_folder_path:
        return jsonify({"error": "Failed to process the URL"}), 500

    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, f"{name}.zip")
        zip_directory(output_folder_path, zip_path)
        response = send_file(zip_path, as_attachment=True, download_name=f"{name}.zip")
        response.headers["Content-Disposition"] = f"attachment; filename={name}.zip"
        response.headers["X-Filename"] = f"{name}.zip"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition, X-Filename"
        return response


@app.route('/api/submit', methods=['POST'])
def submit_form():
    downloadLocation = GLYCOSHAPE_UPLOAD_DIR
    csvLocation = GLYCOSHAPE_CSV

    try:
        # Retrieve form data
        form_data = request.form.to_dict()

        # Retrieve required files
        simulation_file = request.files.get('simulationFile')
        mol_file = request.files.get('molFile')

        # Optionally retrieve the infoJson file
        info_file = request.files.get('infoJson')  # <- New

        if not simulation_file or not mol_file:
            return jsonify({'error': 'simulationFile and molFile are required'}), 400

        # Create a folder named after the glycamName inside the downloadLocation
        glycam_name = form_data.get('glycamName', '')
        glycam_folder = os.path.join(downloadLocation, glycam_name)

        if not os.path.exists(glycam_folder):
            os.makedirs(glycam_folder)

        # Save the simulation file with glycamName as the filename and original extension
        if simulation_file.filename != '':
            simulation_extension = os.path.splitext(simulation_file.filename)[1]
            simulation_filename = glycam_name + simulation_extension
            simulation_file_path = os.path.join(glycam_folder, simulation_filename)
            simulation_file.save(simulation_file_path)

        # Save the mol file with glycamName as the filename and original extension
        if mol_file.filename != '':
            mol_extension = os.path.splitext(mol_file.filename)[1]
            mol_filename = glycam_name + mol_extension
            mol_file_path = os.path.join(glycam_folder, mol_filename)
            mol_file.save(mol_file_path)

        # -----------------------------------------
        #  Optionally save info.json if it exists
        # -----------------------------------------
        if info_file and info_file.filename != '':
            info_extension = os.path.splitext(info_file.filename)[1]
            info_filename = glycam_name + info_extension  # e.g. glycanName.json
            info_file_path = os.path.join(glycam_folder, info_filename)
            info_file.save(info_file_path)

        # Load the existing CSV file using pandas
        csv_data = pd.read_csv(csvLocation)

        # Prepare new data in the same structure as the CSV
        new_data = {
            'ID': '',
            'Timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Email address': form_data.get('email', ''),
            'Full GLYCAM name of glycan being submitted.': glycam_name,
            'How will the data be transferred?': 'Uploaded via Form',
            'What is the aggregated length of the simulations?': form_data.get('simulationLength', ''),
            'What MD package was used for the simulations?': form_data.get('mdPackage', ''),
            'What force field was used for the simulations?': form_data.get('forceField', ''),
            'What temperature target was used for the simulations? ': form_data.get('temperature', ''),
            'What pressure target was used for the simulations?': form_data.get('pressure', ''),
            'What NaCl concentration was used for the simulations?': form_data.get('saltConcentration', ''),
            'Any comments that should be noted with the submission?': form_data.get('comments', ''),
            'What is the GlyTouCan ID of the glycan?': form_data.get('glyTouCanID', '')
        }

        # Convert the new data to a DataFrame and append it to the existing data
        new_df = pd.DataFrame([new_data])
        updated_csv_data = pd.concat([csv_data, new_df], ignore_index=True)

        # Save the updated DataFrame back to the CSV file
        updated_csv_data.to_csv(csvLocation, index=False)

        return jsonify({
            'message': 'Files uploaded and form data saved successfully',
            'form_data': form_data
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    search_result = []
    data = request.get_json()
    search_string = data['search_string']
    search_type = data.get('search_type', None)

    if search_string == 'all':
        for _, glycan_data in GDB_data.items():
            entry = {
                'glytoucan': glycan_data['archetype']['glytoucan'],
                'ID': glycan_data['archetype']['ID'],
                'mass': glycan_data['archetype']['mass']
            }
            search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})
    elif search_string == "N-Glycans":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (glycan_data['archetype']['iupac'].endswith('Man(b1-4)GlcNAc(b1-4)GlcNAc') or glycan_data['archetype']['iupac'].endswith('Man(b1-4)GlcNAc(b1-4)[Fuc(a1-6)]GlcNAc')):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})
    
    elif search_string == "O-Glycans":
        for _, glycan_data in GDB_data.items():
            # O-glycans typically have GalNAc at the reducing end
            # Check for common O-glycan patterns: core 1-4 structures
            if glycan_data['archetype']['iupac'] and (
                # Check for GalNAc at the reducing end - common in all O-glycans
                glycan_data['archetype']['iupac'].endswith('GalNAc') or 
                # Core 1 (T antigen) and extensions
                'Gal(b1-3)GalNAc' in glycan_data['archetype']['iupac'] or
                # Core 2 and extensions
                'GlcNAc(b1-6)[Gal(b1-3)]GalNAc' in glycan_data['archetype']['iupac'] or
                # Core 3 and extensions
                'GlcNAc(b1-3)GalNAc' in glycan_data['archetype']['iupac'] or
                # Core 4 and extensions
                'GlcNAc(b1-6)[GlcNAc(b1-3)]GalNAc' in glycan_data['archetype']['iupac']
            ):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})

    elif search_string == "GAGs":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (
                # Common GAG linkage regions and patterns
                'GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl' in glycan_data['archetype']['iupac'] or 
                'IdoA' in glycan_data['archetype']['iupac'] or
                'GlcA' in glycan_data['archetype']['iupac'] and 'GlcNAc' in glycan_data['archetype']['iupac'] or  # Hyaluronic acid pattern
                'GlcA' in glycan_data['archetype']['iupac'] and 'GalNAc' in glycan_data['archetype']['iupac'] or  # Chondroitin/Dermatan pattern
                'GlcN' in glycan_data['archetype']['iupac'] and 'GlcA' in glycan_data['archetype']['iupac'] or    # Heparin/Heparan pattern
                'GlcN' in glycan_data['archetype']['iupac'] and 'IdoA' in glycan_data['archetype']['iupac']       # Heparin/Heparan pattern
            ):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})
    
    elif search_string == "Oligomannose":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (
                # Check for N-glycan core structure
                ('Man(b1-4)GlcNAc(b1-4)GlcNAc' in glycan_data['archetype']['iupac'] or
                 'Man(b1-4)GlcNAc(b1-4)[Fuc(a1-6)]GlcNAc' in glycan_data['archetype']['iupac']) and
                # Ensure it has mannose branches beyond the core
                glycan_data['archetype']['iupac'].count('Man') >= 3 and
                # Ensure no GlcNAc on mannose branches (which would make it hybrid/complex)
                'GlcNAc(b1-2)Man' not in glycan_data['archetype']['iupac'] and
                # No galactose or other sugars typically found in complex/hybrid glycans
                'Gal(' not in glycan_data['archetype']['iupac'] and
                'Neu5Ac(' not in glycan_data['archetype']['iupac'] and
                'GalNAc(' not in glycan_data['archetype']['iupac'] and
                'Xyl(' not in glycan_data['archetype']['iupac'] and
                'GlcNAc(b1-4)]Man' not in glycan_data['archetype']['iupac'] and  # No bisecting GlcNAc
                'GlcNAc(b1-4)Man' not in glycan_data['archetype']['iupac'] and  # No bisecting GlcNAc
                # No bisecting GlcNAc
                'GlcNAc(b1-6)[GlcNAc(b1-2)]Man' not in glycan_data['archetype']['iupac'] and  # No complex branching
                'GlcNAc(b1-4)[GlcNAc(b1-2)]Man' not in glycan_data['archetype']['iupac'] and
                'Fuc(' not in glycan_data['archetype']['iupac'].replace('Fuc(a1-6)]GlcNAc', '')  # Allow core fucose
            ):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})

    elif search_string == "Complex":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (
                # Basic N-glycan core structure (with or without core fucose)
                ('Man(b1-4)GlcNAc(b1-4)GlcNAc' in glycan_data['archetype']['iupac'] or
                 'Man(b1-4)GlcNAc(b1-4)[Fuc(a1-6)]GlcNAc' in glycan_data['archetype']['iupac'] or
                 'Man(b1-4)GlcNAc(b1-4)[Fuc(a1-3)]GlcNAc' in glycan_data['archetype']['iupac']) and
                # Complex glycans have GlcNAc additions on mannose branches
                'GlcNAc(b1-2)Man' in glycan_data['archetype']['iupac'] and
                # Check if it has branches on both α1-3 and α1-6 mannose arms
                # (Complex N-glycans typically have GlcNAc on both branches)
                'GlcNAc(b1-2)Man(a1-6)' in glycan_data['archetype']['iupac'] and
                'GlcNAc(b1-2)Man(a1-3)' in glycan_data['archetype']['iupac']
            ):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})
    
    elif search_string == "Hybrid":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (
                # Basic N-glycan core (with or without core fucose)
                ('Man(b1-4)GlcNAc(b1-4)GlcNAc' in glycan_data['archetype']['iupac'] or
                 'Man(b1-4)GlcNAc(b1-4)[Fuc(a1-6)]GlcNAc' in glycan_data['archetype']['iupac'] or
                 'Man(b1-4)GlcNAc(b1-4)[Fuc(a1-3)]GlcNAc' in glycan_data['archetype']['iupac']) and
                # Hybrid glycans have GlcNAc on one branch (usually α1-3) but not the other
                (('GlcNAc(b1-2)Man(a1-3)' in glycan_data['archetype']['iupac'] and 
                  'GlcNAc(b1-2)Man(a1-6)' not in glycan_data['archetype']['iupac']) or
                 ('GlcNAc(b1-2)Man(a1-6)' in glycan_data['archetype']['iupac'] and
                  'GlcNAc(b1-2)Man(a1-3)' not in glycan_data['archetype']['iupac'])) and
                # Also check for mannose residues beyond the core (characteristic of hybrid)
                glycan_data['archetype']['iupac'].count('Man') > 3
            ):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})

    elif search_type == 'wurcs':
        WURCS = search_string.lower()

        format_part, residues_list = name.wurcsmatch(WURCS)
        wurcs_0 = f'WURCS=2.0/{format_part}/{residues_list}'
        # Store tuples of (score, entry) for sorting
        scored_results = []
        

        for _, glycan_data in GDB_data.items():
            wurcs = glycan_data['archetype']['wurcs']
            if wurcs:
                format_part_i, residues_list_i = name.wurcsmatch(wurcs)
                wurcs_i = f'WURCS=2.0/{format_part_i}/{residues_list_i}'
                score = fuzz.partial_ratio(wurcs_0, wurcs_i.lower())
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass'],
                    'score': score
                }
                scored_results.append((score, entry))
        
        # Sort by score descending and take top 10
        scored_results.sort(key=lambda x: x[0], reverse=True)
        search_result = [entry for score, entry in scored_results[:10]]
        return jsonify({'search_string': search_string, 'results': search_result})
    
    elif search_type == 'end':
        end_residue = search_string
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and glycan_data['archetype']['iupac'].endswith(end_residue):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass'],
                    'iupac': glycan_data['archetype']['iupac']
                }
                search_result.append(entry)
        search_result.sort(key=lambda x: x['mass'])
        return jsonify({'search_string': search_string, 'results': search_result})  
    
    elif search_type == 'ai':
            if n2s_client:
                try:
                    # Use the search method from the initialized client
                    search_result = n2s_client.search(search_string)
                    # The search method already formats the results, sorting can be done here if needed
                    search_result.sort(key=lambda x: x['mass'] if x['mass'] is not None else float('inf'))
                    return jsonify({'search_string': search_string, 'results': search_result})  
                except Exception as e:
                    print(f"AI search failed: {e}")
                    return jsonify({'error': f'AI search failed: {str(e)}'}), 500
            else:
                 return jsonify({'error': 'AI search client not available. Check API key.'}), 503
    else:
        # Fallback to default search if no specific type is provided
        # For text search, use fuzzy matching across multiple glycan fields
        search_terms = search_string.lower().split()
        scored_results = []

        for _, glycan_data in GDB_data.items():
            # Prepare a combined text from all relevant fields for fuzzy matching
            search_text = ""
            
            # Add archetype data
            archetype = glycan_data.get('archetype', {})
            if archetype.get('glytoucan'):
                search_text += archetype.get('glytoucan', '') + " "
            if archetype.get('iupac'):
                search_text += archetype.get('iupac', '') + " "
            if archetype.get('ID'):
                search_text += archetype.get('ID', '') + " "
            
            # Add alpha/beta data for more comprehensive search
            for anomeric in ['alpha', 'beta']:
                if anomeric in glycan_data:
                    if glycan_data[anomeric].get('glytoucan'):
                        search_text += glycan_data[anomeric].get('glytoucan', '') + " "
                    if glycan_data[anomeric].get('iupac'):
                        search_text += glycan_data[anomeric].get('iupac', '') + " "
            
            search_text = search_text.lower()
            
            # Calculate match score - higher is better
            score = 0
            for term in search_terms:
                # Use partial token matching for each search term
                partial_score = fuzz.partial_ratio(term, search_text)
                # Also check for exact substring matches
                if term in search_text:
                    partial_score += 30  # Bonus for exact substring match
                score += partial_score
            
            # Only include results with reasonable match scores
            if score > 50:  # Threshold can be adjusted
                entry = {
                    'glytoucan': archetype.get('glytoucan'),
                    'ID': archetype.get('ID'),
                    'mass': archetype.get('mass'),
                    'score': score
                }
                scored_results.append((score, entry))

        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        search_result = [entry for _, entry in scored_results[:20]]  # Return top 20 results

        return jsonify({'search_string': search_string, 'results': search_result})
    
    

@app.route('/api/access/<pin>', methods=['GET'])
def check_pin(pin):
    try:
        if pin == config.pin:
            return jsonify({"authenticated": True})
        return jsonify({"authenticated": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/download/<identifier>', methods=['GET'])
def get_glycan_for_reglyco(identifier):
    """
    Downloads all PDB files in the PDB_format_ATOM folder along with
    associated .npz and .json files from the output folder for a given identifier 
    (either glytoucan ID or IUPAC).
    """
    glycoshape_entry = None
    is_iupac = False

    # First check if it's an IUPAC identifier
    # Detect IUPAC: either contains parentheses (typical for IUPAC) or is a single monosaccharide name (e.g., GlcNAc, Man, Gal, etc.)
    iupac_like = False
    # List of common monosaccharide names (expand as needed)
    monosaccharides = {
        'GlcNAc', 'GalNAc', 'Man', 'Gal', 'Glc', 'Fuc', 'Xyl', 'Neu5Ac', 'Neu5Gc', 'IdoA', 'GlcA', 'GalA', 'Kdn', 'Rha', 'Ara', 'Fru', 'All', 'Alt', 'Tal', 'Qui', 'Api', 'Bac', 'Col', 'Dha', 'Fru', 'MurNAc', 'MurNGc', 'Par', 'Pse', 'Tyv', 'Abe', 'Leg', 'Lep', 'Ery', 'Rib', 'Lyx', 'Sor', 'Tag', 'Sed', 'Pent', 'Hex', 'Hept', 'Oct', 'Non', 'Dec'
    }
    if "(" in identifier:
        iupac_like = True
    elif identifier in monosaccharides:
        iupac_like = True

    if iupac_like:
        is_iupac = True
        # Try to find the glycan based on IUPAC
        for glycan_id, glycan_data in GDB_data.items():
            if (glycan_data.get('archetype', {}).get('iupac') == identifier or 
                glycan_data.get('alpha', {}).get('iupac') == identifier or 
                glycan_data.get('beta', {}).get('iupac') == identifier):
                glycoshape_entry = glycan_data['archetype']['ID']
                break
    
    # If not found as IUPAC or is GlyTouCan ID
    if not glycoshape_entry:
        # Try to find the glycan based on GlyTouCan ID
        for glycan_id, glycan_data in GDB_data.items():
            if glycan_data.get('alpha', {}).get('glytoucan') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data.get('beta', {}).get('glytoucan') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break
            elif glycan_data.get('archetype', {}).get('glytoucan') == identifier:
                glycoshape_entry = glycan_data['archetype']['ID']
                break

    if not glycoshape_entry:
        return jsonify({"error": f"Glycan not found for {'IUPAC' if is_iupac else 'GlyTouCan'}: {identifier}"}), 404

    # Define paths to the PDB_format_ATOM and output directories
    pdb_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'PDB_format_ATOM'
    glycam_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'GLYCAM_format_ATOM'
    charmm_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'CHARMM_format_ATOM'
    output_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'output'
    data_json = GLYCOSHAPE_DIR / glycoshape_entry / 'data.json' 

    if not pdb_dir.exists():
        return jsonify({"error": "PDB_format_ATOM directory not found"}), 404

    if not output_dir.exists():
        return jsonify({"error": "Output directory not found"}), 404

    # Collect all .pdb files
    pdb_files = list(pdb_dir.glob('*.pdb')) + list(glycam_dir.glob('*.pdb')) + list(charmm_dir.glob('*.pdb'))
    if not pdb_files:
        return jsonify({"error": "No PDB files found"}), 404

    # Collect all .npz and .json files
    npz_files = list(output_dir.glob('*.npz'))
    json_files = list(output_dir.glob('*.json'))
    mol2_files = list(output_dir.glob('*.mol2'))

    # Create an in-memory ZIP archive
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add PDB files
        for pdb_file in pdb_files:
            zip_file.write(pdb_file, arcname=pdb_file.name)

        # Add NPZ files
        for npz_file in npz_files:
            zip_file.write(npz_file, arcname=npz_file.name)

        # Add JSON files
        for json_file in json_files:
            zip_file.write(json_file, arcname=json_file.name)

        # Add MOL2 files
        for mol2_file in mol2_files:
            zip_file.write(mol2_file, arcname=mol2_file.name)

        # Add data.json file
        if data_json.exists():
            zip_file.write(data_json, arcname='data.json')

    zip_buffer.seek(0)  # Reset buffer pointer to the beginning

    # Define a filename for the ZIP archive
    zip_filename = f"{glycoshape_entry}_files.zip"

    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name=zip_filename  # For Flask >=2.0, use 'download_name' instead of 'attachment_filename'
    )
    


if __name__ == '__main__':
    app.run()
