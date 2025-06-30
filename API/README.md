# API for handling GlycoShape database


```bash
export GLYCOSHAPE_DATABASE_DIR="/mnt/database/DB_static/"
export GLYCOSHAPE_UPLOAD_DIR="/mnt/database/MD_files/"
export GLYCOSHAPE_INVENTORY_CSV="/mnt/database/test_data/GlycoShape_Inventory.csv"
export GLYCOSHAPE_RAWDATA_DIR="/mnt/database/test_data/"


gunicorn -w 4 --reload api:app --timeout 4000 -b 127.0.0.1:8001
```


