import os

# Fetch an environment variable
variable_name = "GLYCOSHAPE_DATABASE_DIR" 
variable_value = os.environ.get(variable_name)

variable_name2 = "GLYCOSHAP_UPLOAD_DIR" 
variable_value2 = os.environ.get(variable_name2)

variable_name3 = "GLYCOSHAPE__INVENTORY_CSV"
variable_value3 = os.environ.get(variable_name3)

variable_name4 = "GLYCOSHAPE_RAWDATA_DIR"
variable_value4 = os.environ.get(variable_name4)

variable_name5 = "GlYCOSHAPE_DOMAIN_NAME"
variable_value5 = os.environ.get(variable_name5)


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

if variable_value5 is not None:
    print(f"The value of {variable_name5} is {variable_value5}")


glycoshape_database_dir = variable_value
glycoshape_upload_dir = variable_value2
glycoshape_inventory_csv = variable_value3
glycoshape_rawdata_dir = variable_value4
domain_name = variable_name5

pin = "glycotime"
