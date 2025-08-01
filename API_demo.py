#!/usr/bin/env python3
"""
GlycoShape Re-Glyco API Demo Script

This script provides a command-line interface to the GlycoShape API for:
- Scanning proteins for N-glycosylation sequons
- Glycosylating proteins with specified glycan types
- Downloading processed PDB files

Example usage:
    # Scan for sequons and glycosylate with default M5 glycan
    python API_demo.py --pdb protein.pdb
    
    # Use specific positions and glycan type
    python API_demo.py --pdb protein.pdb --glycan_pos A19,A445 --glycan_type G00001MO

For more information about GlycoShape, visit: https://glycoshape.org
"""

import requests
import os
import json
import base64
import sys
import argparse
from datetime import datetime
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Script version for update checking
SCRIPT_VERSION = "0.0.2"
SCRIPT_URL = "https://raw.githubusercontent.com/Ojas-Singh/GlycoShape/refs/heads/main/API_demo.py"

# Retry configuration for robust API calls
retries = Retry(total=5, backoff_factor=3, status_forcelist=[500, 502, 503, 504])

# API Configuration
API_BASE_URL = "https://glycoshape.io"
JOB_ENDPOINT = "/api/reglyco/job"

# Default glycan - M5 high mannose glycan
DEFAULT_GLYCAN = "G00028MO"

# Common glycan types for reference
COMMON_GLYCANS = {
    "M5": "G00028MO",      # M5 high mannose (default)
}

def validate_pdb_file(file_path):
    """Validate that the input file is a valid PDB file."""
    if not file_path.lower().endswith('.pdb'):
        print("⚠️  Warning: File doesn't have .pdb extension")
    
    try:
        with open(file_path, 'r') as f:
            first_line = f.readline().strip()
            if not (first_line.startswith('HEADER') or first_line.startswith('ATOM') or first_line.startswith('MODEL')):
                print("⚠️  Warning: File may not be a valid PDB format")
        return True
    except Exception as e:
        raise Exception(f"Cannot read PDB file: {e}")

def print_glycan_options():
    """Print available common glycan types."""
    print("\n🧬 Common Glycan Types:")
    for name, code in COMMON_GLYCANS.items():
        print(f"   {name:6} - {code} {'(default)' if code == DEFAULT_GLYCAN else ''}")
    print("   Visit https://glycoshape.org for complete list")
    print()

def check_for_updates():
    """Check if a newer version of the script is available."""
    try:
        response = requests.get(SCRIPT_URL, timeout=10)
        if response.status_code == 200:
            remote_content = response.text
            # Look for version in the remote script
            import re
            version_match = re.search(r'SCRIPT_VERSION = ["\']([^"\']+)["\']', remote_content)
            if version_match:
                remote_version = version_match.group(1)
                if remote_version != SCRIPT_VERSION:
                    print(f"\n🔄 Update available!")
                    print(f"Current version: {SCRIPT_VERSION}")
                    print(f"Latest version: {remote_version}")
                    print(f"Run: python API_demo.py --update to update")
                    return True
                else:
                    print(f"✅ You have the latest version ({SCRIPT_VERSION})")
            return False
    except Exception as e:
        print(f"⚠️  Could not check for updates: {e}")
        return False

def update_script():
    """Download and replace the current script with the latest version."""
    try:
        print("🔄 Downloading latest version...")
        response = requests.get(SCRIPT_URL, timeout=30)
        if response.status_code == 200:
            # Backup current script
            backup_name = f"API_demo_backup_{SCRIPT_VERSION}.py"
            with open(backup_name, 'w', encoding='utf-8') as f:
                with open(__file__, 'r', encoding='utf-8') as current:
                    f.write(current.read())
            print(f"📁 Current version backed up to: {backup_name}")
            
            # Write new version
            with open(__file__, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("✅ Script updated successfully!")
            print("🔄 Please restart the script to use the new version.")
            return True
        else:
            print(f"❌ Failed to download update: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error updating script: {e}")
        return False

def encode_pdb_to_base64(file_path):
    """Encodes PDB file to base64 string."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDB file not found: {file_path}")
    
    with open(file_path, 'rb') as file:
        encoded_string = base64.b64encode(file.read()).decode('utf-8')
    return encoded_string

def scan_sequons(file_path):
    """Scans for N-glycosylation sequons using the GlycoShape API."""
    print(f"🔍 Scanning {os.path.basename(file_path)} for N-glycosylation sequons...")
    
    filename = os.path.basename(file_path)
    pdb_base64 = encode_pdb_to_base64(file_path)
    
    data = {
        "jobType": "scan",
        "filename": filename,
        "protFileBase64": pdb_base64
    }
    
    session = requests.Session()
    session.mount('http://', HTTPAdapter(max_retries=retries))
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    try:
        response = session.post(API_BASE_URL + JOB_ENDPOINT, json=data, timeout=(200, 1000))
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Sequon scanning completed successfully")
            return result
        else:
            raise Exception(f"API error: {response.status_code} - {response.text}")
            
    except requests.exceptions.Timeout:
        raise Exception("Request timed out. The server may be busy, please try again later.")
    except requests.exceptions.ConnectionError:
        raise Exception("Could not connect to GlycoShape API. Please check your internet connection.")
    except Exception as e:
        raise Exception(f"Error scanning sequons: {str(e)}")

def glycosylate_protein(file_path, glycan_configurations, check_steric=True):
    """Glycosylates protein with given glycan configurations using the GlycoShape API."""
    print(f"🧬 Starting glycosylation of {os.path.basename(file_path)}...")
    print(f"📍 Glycosylation sites: {len(glycan_configurations)}")
    
    filename = os.path.basename(file_path)
    pdb_base64 = encode_pdb_to_base64(file_path)
    
    data = {
        "jobType": "optimization",
        "filename": filename,
        "protFileBase64": pdb_base64,
        "selectedGlycans": glycan_configurations,
        "outputFormat": "PDB",
        "wiggleAngle": 4,
        "populationSize": 256,
        "maxGenerations": 20,
        "wiggleAttempts": 5,
        "effortLevel": 5,
        "checkSteric": check_steric
    }
    
    session = requests.Session()
    session.mount('http://', HTTPAdapter(max_retries=retries))
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    try:
        print("⏳ Processing... (this may take several minutes)")
        response = session.post(API_BASE_URL + JOB_ENDPOINT, json=data, timeout=(200, 1000))
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Glycosylation completed successfully")
            return result
        else:
            # Try once more on failure
            print("⚠️  First attempt failed, retrying...")
            response = session.post(API_BASE_URL + JOB_ENDPOINT, json=data, timeout=(200, 1000))
            if response.status_code == 200:
                result = response.json()
                print("✅ Glycosylation completed successfully (on retry)")
                return result
            else:
                raise Exception(f"API error: {response.status_code} - {response.text}")
                
    except requests.exceptions.Timeout:
        raise Exception("Request timed out. Large proteins may take longer to process.")
    except requests.exceptions.ConnectionError:
        raise Exception("Could not connect to GlycoShape API. Please check your internet connection.")
    except Exception as e:
        raise Exception(f"Error processing PDB file: {str(e)}")

def download_processed_pdb(output_path, upload_folder):
    """Downloads the processed PDB file from GlycoShape."""
    print(f"📥 Downloading processed file...")
    
    full_url = f"{API_BASE_URL}/output/{output_path}"
    
    try:
        response = requests.get(full_url, timeout=(100, 600))
        
        if response.status_code == 200:
            # Extract filename from output_path
            filename = os.path.basename(output_path)
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                print(f"📁 Created output directory: {upload_folder}")
            
            file_path = os.path.join(upload_folder, filename)
            with open(file_path, 'wb') as file:
                file.write(response.content)
            
            print(f"✅ File downloaded successfully: {file_path}")
            print(f"📊 File size: {len(response.content):,} bytes")
            return file_path
        else:
            raise Exception(f"Download failed: HTTP {response.status_code}")
            
    except requests.exceptions.Timeout:
        raise Exception("Download timed out. Please try again.")
    except requests.exceptions.ConnectionError:
        raise Exception("Could not connect to download server.")
    except Exception as e:
        raise Exception(f"Error downloading processed PDB file: {str(e)}")

def download_glcnac_scan_pdb(scan_response, upload_folder, original_filename):
    """Downloads the GlcNAc scan PDB file if available."""
    if 'output' in scan_response:
        scan_output_path = scan_response['output']
        print(f"📥 Downloading GlcNAc scan PDB...")
        
        full_url = f"{API_BASE_URL}/output/{scan_output_path}"
        
        try:
            response = requests.get(full_url, timeout=(100, 600))
            
            if response.status_code == 200:
                # Create a descriptive filename for the scan PDB
                base_name = os.path.splitext(original_filename)[0]
                scan_filename = f"{base_name}_glcnac_scan.pdb"
                scan_file_path = os.path.join(upload_folder, scan_filename)
                
                with open(scan_file_path, 'wb') as file:
                    file.write(response.content)
                
                print(f"✅ GlcNAc scan PDB saved: {scan_file_path}")
                return scan_file_path
            else:
                print(f"⚠️  Could not download GlcNAc scan PDB: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            print(f"⚠️  Error downloading GlcNAc scan PDB: {str(e)}")
            return None
    else:
        print("ℹ️  No GlcNAc scan PDB available in response")
        return None

def save_processing_log(log_content, output_folder, original_filename):
    """Save processing log to a file."""
    base_name = os.path.splitext(original_filename)[0]
    log_filename = f"{base_name}_processing_log.txt"
    log_file_path = os.path.join(output_folder, log_filename)
    
    try:
        with open(log_file_path, 'w', encoding='utf-8') as f:
            f.write(f"GlycoShape Re-Glyco Processing Log\n")
            f.write(f"Generated: {os.path.basename(original_filename)}\n")
            f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 50 + "\n\n")
            
            if isinstance(log_content, list):
                for line in log_content:
                    f.write(f"{line}\n")
            else:
                f.write(str(log_content))
        
        print(f"📄 Processing log saved: {log_file_path}")
        return log_file_path
    except Exception as e:
        print(f"⚠️  Could not save processing log: {str(e)}")
        return None

def create_glycan_config(default_glycan_type, sequons, custom_assignments=None):
    """Creates glycan configuration dictionary from sequon positions with optional per-residue assignments."""
    glycan_config = {}
    custom_assignments = custom_assignments or {}
    
    for chain_id, res_id in sequons:
        residue_key = f'{res_id}_{chain_id}'
        # Use custom assignment if available, otherwise use default
        glycan_type = custom_assignments.get(residue_key, default_glycan_type)
        glycan_config[residue_key] = glycan_type
    
    return glycan_config

def parse_sequon_positions(position_string):
    """Parse user-specified glycosylation positions (e.g., 'A19,B445,C123' or 'A19:G00001MO,B445:G00028MO')."""
    positions = []
    glycan_assignments = {}
    
    for pos in position_string.split(','):
        pos = pos.strip()
        if not pos:
            continue
        
        # Check if glycan type is specified for this position
        if ':' in pos:
            pos_part, glycan_part = pos.split(':', 1)
            pos_part = pos_part.strip()
            glycan_part = glycan_part.strip()
        else:
            pos_part = pos
            glycan_part = None
        
        try:
            chain_id = pos_part[0].upper()
            res_id = int(pos_part[1:])
            positions.append((chain_id, res_id))
            
            if glycan_part:
                glycan_assignments[f'{res_id}_{chain_id}'] = glycan_part
                
        except (IndexError, ValueError):
            raise ValueError(f"Invalid position format: '{pos}'. Use format like 'A19,B445' or 'A19:G00001MO,B445:G00028MO'")
    
    return positions, glycan_assignments

def extract_sequons_from_api_response(scan_response):
    """Extract sequon positions from API scan response."""
    sequons = []
    
    # Handle different possible response formats
    if 'results' in scan_response:
        for result in scan_response['results']:
            # Handle new format with 'residue' field (e.g., "151_A")
            if 'residue' in result:
                residue_str = result['residue']
                try:
                    # Parse "position_chain" format
                    parts = residue_str.split('_')
                    if len(parts) == 2:
                        position = int(parts[0])
                        chain = parts[1]
                        sequons.append((chain, position))
                except (ValueError, IndexError):
                    print(f"⚠️  Warning: Could not parse residue format: {residue_str}")
                    continue
            # Handle legacy format with separate 'position' and 'chain' fields
            elif 'position' in result and 'chain' in result:
                sequons.append((result['chain'], result['position']))
    elif 'sequons' in scan_response:
        # Alternative response format
        for sequon in scan_response['sequons']:
            if 'residue' in sequon:
                residue_str = sequon['residue']
                try:
                    parts = residue_str.split('_')
                    if len(parts) == 2:
                        position = int(parts[0])
                        chain = parts[1]
                        sequons.append((chain, position))
                except (ValueError, IndexError):
                    print(f"⚠️  Warning: Could not parse residue format: {residue_str}")
                    continue
            elif 'chain' in sequon and 'position' in sequon:
                sequons.append((sequon['chain'], sequon['position']))
    elif isinstance(scan_response, list):
        # Direct list format
        for item in scan_response:
            if isinstance(item, dict):
                if 'residue' in item:
                    residue_str = item['residue']
                    try:
                        parts = residue_str.split('_')
                        if len(parts) == 2:
                            position = int(parts[0])
                            chain = parts[1]
                            sequons.append((chain, position))
                    except (ValueError, IndexError):
                        print(f"⚠️  Warning: Could not parse residue format: {residue_str}")
                        continue
                elif 'chain' in item and 'position' in item:
                    sequons.append((item['chain'], item['position']))
    
    return sequons

def print_steric_clash_report(process_response):
    """Print detailed steric clash information from the optimization process."""
    print("\n💥 Steric Clash Analysis:")
    
    # Check for clash information in the response
    has_clash_info = False
    
    # Look for clash field
    if 'clash' in process_response:
        has_clash_info = True
        clash_status = process_response['clash']
        if clash_status:
            print("   ⚠️  Steric clashes detected during optimization")
        else:
            print("   ✅ No steric clashes detected")
    
    # Look for detailed clash information in other fields
    if 'clashInfo' in process_response:
        has_clash_info = True
        clash_info = process_response['clashInfo']
        if isinstance(clash_info, dict):
            for residue, info in clash_info.items():
                print(f"   Site {residue}: {info}")
        elif isinstance(clash_info, list):
            for info in clash_info:
                print(f"   {info}")
        else:
            print(f"   Details: {clash_info}")
    
    # Look for clash-related information in the processing log
    if 'box' in process_response:
        log_content = process_response['box']
        if isinstance(log_content, str):
            log_lines = log_content.split('\n')
        else:
            log_lines = log_content if isinstance(log_content, list) else [str(log_content)]
        
        clash_lines = []
        for line in log_lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in ['clash', 'steric', 'conflict', 'collision']):
                clash_lines.append(line.strip())
        
        if clash_lines:
            has_clash_info = True
            print("   📋 Clash details from optimization log:")
            for line in clash_lines[:10]:  # Limit to first 10 relevant lines
                if line:
                    print(f"      {line}")
            if len(clash_lines) > 10:
                print(f"      ... and {len(clash_lines) - 10} more clash-related entries")
    
    # Look for results with clash information
    if 'results' in process_response:
        has_clash_info = True
        results = process_response['results']
        if isinstance(results, list):
            clash_count = 0
            success_count = 0
            for result in results:
                if isinstance(result, dict):
                    if result.get('clash_solved', True):
                        success_count += 1
                    else:
                        clash_count += 1
            
            total = len(results)
            if total > 0:
                print(f"   📊 Optimization results: {success_count}/{total} sites successfully optimized")
                if clash_count > 0:
                    print(f"   ⚠️  {clash_count} sites could not be fully resolved")
    
    if not has_clash_info:
        print("   ℹ️  No detailed clash information available in response")

def main(args):
    """Main function to orchestrate the glycosylation process."""
    print(f"\n🧬 GlycoShape API Demo v{SCRIPT_VERSION}")
    print(f"📁 Processing PDB file: {args.pdb}")
    
    # Validate input file
    if not os.path.exists(args.pdb):
        print(f"❌ Error: PDB file not found: {args.pdb}")
        return False
    
    try:
        validate_pdb_file(args.pdb)
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Create output folder if it doesn't exist
    if not os.path.exists(args.outfolder):
        os.makedirs(args.outfolder)
        print(f"📁 Created output directory: {args.outfolder}")
    
    try:
        # Determine glycosylation sites
        custom_glycan_assignments = {}
        
        if args.glycan_pos is not None:
            # Parse user-specified positions (e.g., "A19,A445" or "A19:G00001MO,A445:G00028MO")
            print(f"📍 Using user-specified positions: {args.glycan_pos}")
            sequons, custom_glycan_assignments = parse_sequon_positions(args.glycan_pos)
            print(f"✅ Parsed {len(sequons)} positions: {sequons}")
            
            if custom_glycan_assignments:
                print(f"🧬 Custom glycan assignments: {custom_glycan_assignments}")
        else:
            # Use API to scan for sequons
            scan_response = scan_sequons(args.pdb)
            
            # Download GlcNAc scan PDB if available
            download_glcnac_scan_pdb(scan_response, args.outfolder, os.path.basename(args.pdb))
            
            # Print detailed scan results if available
            if 'results' in scan_response and scan_response['results']:
                print(f"📊 Scan Results Summary:")
                clash_free_count = 0
                total_sites = len(scan_response['results'])
                
                for result in scan_response['results']:
                    residue = result.get('residue', 'Unknown')
                    clash_free = result.get('clash_solved', True)
                    if clash_free:
                        clash_free_count += 1
                    status = "✅ Clash-free" if clash_free else "⚠️  Has clashes"
                    print(f"   Site {residue}: {status}")
                
                print(f"📈 Summary: {clash_free_count}/{total_sites} sites are clash-free")
                
                if 'box' in scan_response:
                    print(f"⏱️  Processing time: {scan_response.get('time', 'N/A')}")
            
            # Extract sequon positions from API response (only clash-free ones)
            all_sequons = extract_sequons_from_api_response(scan_response)
            clash_free_sequons = []
            
            if 'results' in scan_response and scan_response['results']:
                for result in scan_response['results']:
                    if result.get('clash_solved', True):  # Only include clash-free sites
                        if 'residue' in result:
                            residue_str = result['residue']
                            try:
                                parts = residue_str.split('_')
                                if len(parts) == 2:
                                    position = int(parts[0])
                                    chain = parts[1]
                                    clash_free_sequons.append((chain, position))
                            except (ValueError, IndexError):
                                continue
                
                sequons = clash_free_sequons
                if len(all_sequons) > len(clash_free_sequons):
                    clashing_count = len(all_sequons) - len(clash_free_sequons)
                    print(f"⚠️  Excluding {clashing_count} sites with steric clashes")
                    print(f"✅ Using {len(clash_free_sequons)} clash-free sites for glycosylation")
            else:
                sequons = all_sequons
            
            if sequons:
                print(f"🎯 Final glycosylation targets: {sequons}")
            else:
                print("⚠️  No clash-free N-glycosylation sequons found")
                print("   You can specify positions manually using --glycan_pos")
                print("   Example: --glycan_pos A19,B445")
                return False
        
        if not sequons:
            print("❌ No glycosylation sites available!")
            return False
        
        # Validate glycan type
        if args.glycan_type not in COMMON_GLYCANS.values():
            print(f"⚠️  Warning: Glycan type '{args.glycan_type}' not in common list")
            print("   Proceeding anyway - check https://glycoshape.org for valid types")
        
        # Create glycan configuration
        glycan_configurations = create_glycan_config(
            args.glycan_type, 
            sequons, 
            custom_glycan_assignments
        )
        print(f"🧬 Final glycan configurations: {glycan_configurations}")
        
        # Process the PDB file with glycosylation
        process_response = glycosylate_protein(
            args.pdb, 
            glycan_configurations, 
            check_steric=True  # Always enable steric checking
        )
        
        # Handle the response
        if 'output' in process_response:
            output_path = process_response['output']
            downloaded_file = download_processed_pdb(output_path, args.outfolder)
            
            print(f"\n🎉 Success! Glycosylated protein saved to: {downloaded_file}")
            
            # Print detailed steric clash information
            print_steric_clash_report(process_response)
            
            # Save processing log instead of printing
            if 'box' in process_response:
                log_content = process_response['box'].split('\n') if isinstance(process_response['box'], str) else process_response['box']
                save_processing_log(log_content, args.outfolder, os.path.basename(args.pdb))
            
            return True
        else:
            print("❌ Error: No output file in response")
            if 'error' in process_response:
                print(f"   Error details: {process_response['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def print_help():
    """Print detailed help information."""
    help_text = f"""
🧬 GlycoShape Re-Glyco API Demo v{SCRIPT_VERSION}
===============================================

DESCRIPTION:
    This script provides a command-line interface to the GlycoShape Re-Glyco API for automated
    protein glycosylation. It can scan proteins for N-glycosylation sequons and add
    glycan structures at specified or discovered positions.

FEATURES:
    • Automatic N-glycosylation sequon detection with clash analysis
    • Support for custom glycan types
    • Steric clash detection and avoidance
    • Detailed optimization results reporting
    • Automatic script updates

BASIC USAGE:
    python API_demo.py --pdb your_protein.pdb

EXAMPLES:
    # Basic glycosylation with automatic sequon detection (clash-free sites only)
    python API_demo.py --pdb protein.pdb
    
    # Specify custom positions with same glycan type
    python API_demo.py --pdb protein.pdb --glycan_pos A19,B445 --glycan_type G00001MO
    
    # Specify different glycan types for each position
    python API_demo.py --pdb protein.pdb --glycan_pos A19:G00001MO,B445:G00028MO
    
    # Mix default and custom glycan assignments
    python API_demo.py --pdb protein.pdb --glycan_pos A19:G00001MO,B445 --glycan_type G00028MO
    
    # Custom output directory
    python API_demo.py --pdb protein.pdb --outfolder ./my_results/
    
    # Update script to latest version
    python API_demo.py --update
    
    # Check for updates without downloading
    python API_demo.py --check_update

GLYCAN TYPES:
    Common glycan identifiers (use with --glycan_type):
    • G00028MO - M5 high mannose (default)

    For more glycan types, visit: https://glycoshape.org

POSITION FORMAT:
    Basic format: Chain letter followed by residue number
    Examples:
      A19,B445,C123                    - Use default glycan type for all positions
      A19:G00001MO,B445:G00028MO       - Specify different glycan for each position  
      A19:G00001MO,B445                - Mix custom and default glycan assignments
    
    Chain letter: Single letter (A, B, C, etc.)
    Residue number: Position number in the protein sequence
    Glycan code: Optional glycan identifier after colon (:)

OUTPUT:
    • Processed PDB file with glycans attached
    • Processing log with optimization details
    • Clash detection and resolution reports
    • Detailed conformational analysis (phi/psi angles)

FOR MORE INFORMATION:
    • Website: https://glycoshape.org
    • Documentation: https://github.com/Ojas-Singh/GlycoShape
    • Issues: https://github.com/Ojas-Singh/GlycoShape/issues
    • Contact: OJAS.SINGH.2023@mumail.ie (preferred for issues)

"""
    print(help_text)

if __name__ == '__main__':
    # Handle special commands first
    if len(sys.argv) > 1:
        if '--help' in sys.argv or '-h' in sys.argv:
            print_help()
            sys.exit(0)
        elif '--update' in sys.argv:
            if update_script():
                sys.exit(0)
            else:
                sys.exit(1)
        elif '--check_update' in sys.argv:
            check_for_updates()
            sys.exit(0)
        elif '--list_glycans' in sys.argv:
            print_glycan_options()
            sys.exit(0)
    
    # Create argument parser with improved help
    argparser = argparse.ArgumentParser(
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description=f"""
🧬 GlycoShape API Demo v{SCRIPT_VERSION}

Automated protein glycosylation using the GlycoShape API.
Scans for N-glycosylation sequons and adds glycan structures.

For detailed help and examples, run: python API_demo.py --help
""",
        epilog="""
Examples:
  python API_demo.py --pdb protein.pdb
  python API_demo.py --pdb protein.pdb --glycan_pos A19,B445
  python API_demo.py --pdb protein.pdb --glycan_pos A19:G00001MO,B445:G00028MO

Visit https://glycoshape.org for more information.
"""
    )
    
    # Required arguments
    argparser.add_argument('--pdb', type=str, required=True, 
                          help="Path to input PDB file")
    
    # Optional arguments
    argparser.add_argument('--glycan_pos', type=str, default=None, 
                          help='Specify positions to glycosylate. Format: A19,B445 or A19:G00001MO,B445:G00028MO. '
                               'Use colon to specify different glycan types per position. '
                               'If not provided, will automatically scan for clash-free N-glycosylation sequons.')
    
    argparser.add_argument('--glycan_type', type=str, default=DEFAULT_GLYCAN, 
                          help=f'Glycan identifier to use. Default is M5 high mannose ({DEFAULT_GLYCAN}). '
                               'Use --list_glycans to see common types.')
    
    argparser.add_argument('--outfolder', type=str, default='./output/', 
                          help='Directory to save glycosylated output PDBs.')
    
    # Utility arguments
    argparser.add_argument('--update', action='store_true',
                          help='Update script to the latest version from GitHub')
    
    argparser.add_argument('--check_update', action='store_true',
                          help='Check if a newer version is available without updating')
    
    argparser.add_argument('--list_glycans', action='store_true',
                          help='List common glycan types and exit')
    
    # Parse arguments
    args = argparser.parse_args()
    
    # Check for updates on startup (non-blocking)
    if not (args.update or args.check_update):
        check_for_updates()
    
    # Run main function
    success = main(args)
    sys.exit(0 if success else 1)