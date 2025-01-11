from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
import pandas as pd
from pathlib import Path
import requests
import sys, time
import os,json
import time
from datetime import datetime
from lib import config, GOTW_script, name
from glycowork.motif.draw import GlycoDraw
import tempfile
import shutil
import zipfile
import tempfile
from thefuzz import fuzz
import geocoder
import io


app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 5000 * 1024 * 1024
CORS(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app, supports_credentials=True)


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
    if os.path.exists(CSV_FILE_PATH):
        # Load the CSV file
        df = pd.read_csv(CSV_FILE_PATH)
        # Drop the 'ip_address' column if it exists
        if 'ip_address' in df.columns:
            df = df.drop(columns=['ip_address'])
        # Drop rows with any NaN values
        df = df.dropna()
        # Convert to list of dictionaries and return as JSON
        visitor_data = df.to_dict(orient='records')
        return jsonify(visitor_data)
    else:
        return jsonify({'error': 'CSV file not found'}), 404
    

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

@app.route('/api/exist/<glycam>', methods=['GET'])
def is_exist(glycam):
    
    folder_path = os.path.join(GLYCOSHAPE_RAWDATA_DIR, glycam)
    folder2_path = os.path.join(GLYCOSHAPE_UPLOAD_DIR, glycam)
    folder_exists = os.path.isdir(folder_path) or os.path.isdir(folder2_path)

    if folder_exists:
        return jsonify({'exists': folder_exists})
    else :
        glycam_name = glycam[:-5]
        wurcs =  name.glycam2wurcs(glycam_name)
        alpha, beta = name.wurcs2alpha_beta(wurcs)
        exist = False
        for glycan_data in GDB_data.values():
            if glycan_data['archetype']['wurcs'] == wurcs :
                print(glycan_data['archetype']['glytoucan'])
                exist = True
                break
            elif glycan_data['alpha']['wurcs'] == alpha :
                print(glycan_data['archetype']['glytoucan'])
                exist = True
                break
            elif glycan_data['beta']['wurcs'] == beta :
                print(glycan_data['archetype']['glytoucan'])
                exist = True
                break
        return jsonify({'exists': exist})


@app.route('/api/glycan/<glytoucan>', methods=['GET'])
def get_glycan(glytoucan):
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_data['archetype']['glytoucan'] == glytoucan or glycan_data['alpha']['glytoucan'] == glytoucan or glycan_data['beta']['glytoucan'] == glytoucan:
            return jsonify(glycan_data)
    return jsonify({"error": "Glycan not found"}), 404

@app.route('/api/pdb/<glytoucan>', methods=['GET'])
def get_pdb(glytoucan):
    glycoshape_entry = None
    is_alpha = False
    is_beta = False
    is_archetype = False
    
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_data['alpha']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            is_alpha = True
            break
        elif glycan_data['beta']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            is_beta = True
            break
        elif glycan_data['archetype']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            is_archetype = True
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
            
    return jsonify({"error": "Glycan not found"}), 404

@app.route('/api/svg/<glytoucan>', methods=['GET'])
def get_svg(glytoucan):
    glycoshape_entry = None
    
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_data['alpha']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
        elif glycan_data['beta']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
        elif glycan_data['archetype']['glytoucan'] == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
    if glycoshape_entry:
        svg_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/snfg.svg'
        if svg_file_path.exists():
            return send_file(svg_file_path, as_attachment=True)
        else:
            return jsonify({"error": "SVG file not found"}), 404
            
    return jsonify({"error": "Glycan not found"}), 404


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

    Args:
        url (str): URL to the zip file.

    Returns:
        tuple: Path to the result directory and the glycam name.
    """
    try:
        # Create a temporary directory for output
        with tempfile.TemporaryDirectory() as output_folder:
            output_path = Path(output_folder)

            # Download the zip file with streaming
            response = requests.get(url, stream=True, timeout=(10, 60))
            if response.status_code != 200:
                print(f"Error: Failed to download the file. Status code: {response.status_code}")
                return None, None

            # Save the streamed content to a temporary zip file
            with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as zip_file:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:  # Filter out keep-alive new chunks
                        zip_file.write(chunk)
                zip_file_path = zip_file.name

            # Create a temporary folder for extracting the files
            with tempfile.TemporaryDirectory() as tmpdir:
                # Extract the zip file
                with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                    zip_ref.extractall(tmpdir)

                glycam_name = None  # Initialize name variable
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
                            if glytoucan is not None:
                                glycam_name = glytoucan
                            else:
                                glycan_name = glycam
                            conformer_id = data.get("conformerID", "output")
                            output_folder_path = GOTW_script.process_app(f'{glycan_name}/{conformer_id}', pdb_file, off_file, 200)

                            # Move the processed folder to the temp output directory
                            processed_subfolder = Path(output_folder_path)
                            target_subfolder = output_path / glycan_name
                            shutil.move(processed_subfolder, target_subfolder)
                            shutil.move(json_file, target_subfolder / "info.json")
                        else:
                            print(f"info.json not found in {root}")

                # Create a new temp directory for the final result
                result_dir = tempfile.mkdtemp()

                # Copy the contents from output_path to result_dir
                shutil.copytree(output_path, result_dir, dirs_exist_ok=True)

        # Return the final result directory and glycam name
        return Path(result_dir), glycam_name

    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")
        return None, None
    except zipfile.BadZipFile:
        print("Error: The downloaded file is not a valid zip file.")
        return None, None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None, None
    finally:
        # Ensure the temporary zip file is deleted
        if 'zip_file_path' in locals() and os.path.exists(zip_file_path):
            os.remove(zip_file_path)


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

        # Retrieve files
        simulation_file = request.files.get('simulationFile')
        mol_file = request.files.get('molFile')

        if not simulation_file or not mol_file:
            return jsonify({'error': 'Both files are required'}), 400

         # Create a folder named after the glycamName inside the downloadLocation
        glycam_name = form_data.get('glycamName', '')
        glycam_folder = os.path.join(downloadLocation, glycam_name)

        if not os.path.exists(glycam_folder):
            os.makedirs(glycam_folder)

        # Save the simulation file with glycamName as the filename and original extension
        if simulation_file.filename != '':
            simulation_extension = os.path.splitext(simulation_file.filename)[1]  # Get the file extension
            simulation_filename = glycam_name + simulation_extension
            simulation_file_path = os.path.join(glycam_folder, simulation_filename)
            simulation_file.save(simulation_file_path)

        # Save the configuration file with glycamName as the filename and original extension
        if mol_file.filename != '':
            mol_extension = os.path.splitext(mol_file.filename)[1]  # Get the file extension
            mol_filename = glycam_name + mol_extension
            mol_file_path = os.path.join(glycam_folder, mol_filename)
            mol_file.save(mol_file_path)

        # Load the existing CSV file using pandas
        csv_data = pd.read_csv(csvLocation)

        # Prepare new data in the same structure as the CSV
        new_data = {
            'ID': '',  # Keeping ID empty for now, if needed can be generated or managed separately
            'Timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'Email address': form_data.get('email', ''),
            'Full GLYCAM name of glycan being submitted.': form_data.get('glycamName', ''),
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

        return jsonify({'message': 'Files uploaded and form data saved successfully', 'form_data': form_data}), 200

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
            if glycan_data['archetype']['iupac'] and (glycan_data['archetype']['iupac'].endswith('GalNAc(a1-3)[Gal(b1-3)]GalNAc') or glycan_data['archetype']['iupac'].endswith('GalNAc(a1-3)[Gal(b1-3)]GalNAc')):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})

    elif search_string == "GAGs":
        for _, glycan_data in GDB_data.items():
            if glycan_data['archetype']['iupac'] and (glycan_data['archetype']['iupac'].startswith('GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl') or glycan_data['archetype']['iupac'].startswith('GlcA(b1-3)Gal(b1-3)Gal(b1-4)Xyl')):
                entry = {
                    'glytoucan': glycan_data['archetype']['glytoucan'],
                    'ID': glycan_data['archetype']['ID'],
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        return jsonify({'search_string': search_string, 'results': search_result})
    
    # elif search_string == "Oligomannose":
        

    # elif search_string == "Complex":
    
    # elif search_string == "Hybrid":

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
                    'mass': glycan_data['archetype']['mass']
                }
                search_result.append(entry)
        search_result.sort(key=lambda x: x['mass'])
        return jsonify({'search_string': search_string, 'results': search_result})  
    
    else:
        return jsonify({'search_string': search_string, 'results': search_result})

@app.route('/api/access/<pin>', methods=['GET'])
def check_pin(pin):
    try:
        if pin == config.pin:
            return jsonify({"authenticated": True})
        return jsonify({"authenticated": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/download/<glytoucan>', methods=['GET'])
def get_glycan_for_reglyco(glytoucan):
    """
    Downloads all PDB files in the PDB_format_ATOM folder along with
    associated .npz and .json files from the output folder for a given glytoucan ID.
    """
    glycoshape_entry = None

    # Determine the glycoshape_entry based on the glytoucan ID
    for glycan_id, glycan_data in GDB_data.items():
        if glycan_data.get('alpha', {}).get('glytoucan') == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
        elif glycan_data.get('beta', {}).get('glytoucan') == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break
        elif glycan_data.get('archetype', {}).get('glytoucan') == glytoucan:
            glycoshape_entry = glycan_data['archetype']['ID']
            break

    if not glycoshape_entry:
        return jsonify({"error": "Glycan not found"}), 404

    # Define paths to the PDB_format_ATOM and output directories
    pdb_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'PDB_format_ATOM'
    output_dir = GLYCOSHAPE_DIR / glycoshape_entry / 'output'
    data_json = GLYCOSHAPE_DIR / glycoshape_entry / 'data.json' 

    if not pdb_dir.exists():
        return jsonify({"error": "PDB_format_ATOM directory not found"}), 404

    if not output_dir.exists():
        return jsonify({"error": "Output directory not found"}), 404

    # Collect all .pdb files
    pdb_files = list(pdb_dir.glob('*.pdb'))
    if not pdb_files:
        return jsonify({"error": "No PDB files found"}), 404

    # Collect all .npz and .json files
    npz_files = list(output_dir.glob('*.npz'))
    json_files = list(output_dir.glob('*.json'))

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

        # Add data.json file
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
