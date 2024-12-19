from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from pathlib import Path
import requests
import sys, time
import os,json
import time
from datetime import datetime
from lib import config, GOTW_script, name
from glycowork.motif.draw import GlycoDraw
import tempfile


app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 2000 * 1024 * 1024
CORS(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app, supports_credentials=True)

# load directory 
GLYCOSHAPE_DIR = Path(config.glycoshape_database_dir)
# GLYCOSHAPE_CSV = Path(config.glycoshape_csv)
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
    glycam_name = glycam[:-5]
    folder_path = os.path.join(GLYCOSHAPE_RAWDATA_DIR, glycam_name)
    folder2_path = os.path.join(GLYCOSHAPE_UPLOAD_DIR, glycam_name)
    folder_exists = os.path.isdir(folder_path) or os.path.isdir(folder2_path)

    if folder_exists:
        return jsonify({'exists': folder_exists})
    else :
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
    
@app.route('/api/search', methods=['POST'])
def search():
    search_result = []
    data = request.get_json()
    search_string = data['search_string']
    # search_type = data['search_type'] 
    if search_string != 'dada':
        for _, glycan_data in GDB_data.items():
            entry = {
                'glytoucan': glycan_data['archetype']['glytoucan'],
                'ID': glycan_data['archetype']['ID'],
                'mass': glycan_data['archetype']['mass']
            }
            search_result.append(entry)
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

if __name__ == '__main__':
    app.run()
