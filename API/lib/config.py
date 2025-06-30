import os

# Fetch an environment variable
variable_name = "GLYCOSHAPE_DATABASE_DIR" 
variable_value = os.environ.get(variable_name)

variable_name2 = "GLYCOSHAPE_UPLOAD_DIR" 
variable_value2 = os.environ.get(variable_name2)

variable_name3 = "GLYCOSHAPE_INVENTORY_CSV"
variable_value3 = os.environ.get(variable_name3)

variable_name4 = "GLYCOSHAPE_RAWDATA_DIR"
variable_value4 = os.environ.get(variable_name4)



if variable_value is not None:
    print(f"The value of {variable_name} is {variable_value}")
else:
    print(f"{variable_name} is not set in the environment.")
if variable_value2 is not None:
    print(f"The value of {variable_name2} is {variable_value2}")
else:
    print(f"{variable_name2} is not set in the environment.")
if variable_value3 is not None:
    print(f"The value of {variable_name3} is {variable_value3}")
else:
    print(f"{variable_name3} is not set in the environment.")
if variable_value4 is not None:
    print(f"The value of {variable_name4} is {variable_value4}")
else:
    print(f"{variable_name4} is not set in the environment.")



glycoshape_database_dir = variable_value
glycoshape_upload_dir = variable_value2
glycoshape_inventory_csv = variable_value3
glycoshape_rawdata_dir = variable_value4

pin = "glycotime"

# Upload functionality configuration
UPLOAD_FOLDER = variable_value2  # Use the same as glycoshape_upload_dir
MAX_CONTENT_LENGTH = 10024 * 1024 * 1024  # 10GB max file size
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'pdb', 'zip', 'tar', 'gz', 'json', 'csv', 'mol2', 'mol', 'sdf', 'xyz', 'prm7', 'prm', 'nc', 'rst', 'tsv', 'xlsx', 'xls', 'md', 'html', 'htm', 'xml', 'yaml', 'yml', 'cif', 'map'}

# Load upload keys from environment variables
def load_upload_keys():
    """Load upload keys from environment variables with fallback defaults."""
    upload_keys = {}
    
    # Load individual keys from environment variables
    admin_key = os.environ.get('GLYCOSHAPE_UPLOAD_KEY')
    # Add keys to dictionary if they exist
    if admin_key:
        upload_keys[admin_key] = 'admin'
    
    return upload_keys

# Initialize upload keys
VALID_UPLOAD_KEYS = load_upload_keys()

# Print loaded keys (without showing the actual keys for security)
print(f"Loaded {len(VALID_UPLOAD_KEYS)} upload keys with roles: {list(set(VALID_UPLOAD_KEYS.values()))}")
