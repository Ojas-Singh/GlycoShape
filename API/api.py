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


app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 2000 * 1024 * 1024
CORS(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app, supports_credentials=True)

# load directory 
GLYCOSHAPE_DIR = Path(config.glycoshape_database_dir)
GLYCOSHAPE_CSV = Path(config.glycoshape_inventory_csv)
GLYCOSHAPE_RAWDATA_DIR = Path(config.glycoshape_rawdata_dir)
GLYCOSHAPE_UPLOAD_DIR = Path(config.glycoshape_upload_dir)

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
        if is_alpha:
            pdb_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_alpha.PDB.pdb'
            alt_file_path = GLYCOSHAPE_DIR / f'{glycoshape_entry}/PDB_format_ATOM/cluster0_beta.PDB.pdb'
        elif is_beta or is_archetype:
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
    output_folder = "output"
    output_path = Path(output_folder)

    if output_path.exists():
        shutil.rmtree(output_folder)

    # Download the zip file
    response = requests.get(url)
    if response.status_code == 200:
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as zip_file:
            zip_file.write(response.content)
            zip_file_path = zip_file.name

        # Create a temporary folder for extracting the files
        with tempfile.TemporaryDirectory() as tmpdir:
            # Extract the zip file
            with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
                zip_ref.extractall(tmpdir)

            # Process each subdirectory
            for root, dirs, files in os.walk(tmpdir):
                if "structure.off" in files and "structure.pdb" in files:
                    json_file = os.path.join(root, "info.json")
                    off = os.path.join(root, "structure.off")
                    pdb = os.path.join(root, "structure.pdb")

                    if os.path.exists(json_file):
                        with open(json_file, 'r') as f:
                            data = json.load(f)

                        name = data.get("indexOrderedSequence", "output")
                        conformerID = data.get("conformerID", "output")
                        output_folder_path = GOTW_script.process_app(f'{name}/{conformerID}', pdb, off, 200)

                        # Move the processed folder to the main output directory
                        processed_subfolder = Path(output_folder_path)
                        target_subfolder = output_path / processed_subfolder.name
                        shutil.move(processed_subfolder, target_subfolder)
                    else:
                        print(f"info.json not found in {root}")

    else:
        return None, None

    return output_path, name

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
    
@app.route('/api/ptm/<residue>', methods=['GET'])
def get_ptm(residue):
    try:
        ptm = name.get_ptm(residue)
        if ptm:
            return jsonify(ptm)
        return jsonify({"error": "PTM not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500  

if __name__ == '__main__':
    app.run()
