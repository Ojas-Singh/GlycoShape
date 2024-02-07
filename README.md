# GlycoShape

[GlycoShape](https://glycoshape.org) is an OA database of glycans 3D structural data and information that can be downloaded or used with [Re-Glyco](https://glycoshape.org/reglyco) to rebuild glycoproteins from the [RCSB PDB](https://www.rcsb.org/) or [EMBL-EBI AlphaFold](https://alphafold.ebi.ac.uk) repositories

This repository contain the codebase for GlycoShape website along with the data used for analysis in the paper.


GlycoShape depends on these codesbase.
[Re-Glyco repository](https://github.com/Ojas-Singh/Re-Glyco)  and 
[GlycanAnalysisPipeline (GAP) repository](https://github.com/Ojas-Singh/GlycanAnalysisPipeline)


Once you have Database dir ready and Re-Glyco API running at port 8000

# Build the website using npm

```
cd glycoshape-website
npm install
npm run build:prod
```

change path of database and website directory in nginx configuration provided in glycoshape.org and io file according to your local machine.

# Setup

```
chown www-data:www-data target_folder
sudo nano /etc/nginx/cors.conf
sudo nano /etc/nginx/sites-available/glycoshape.io
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
cat /var/log/nginx/error.log
ln -s /etc/nginx/sites-available/glycoshape.io /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/glycoshape.org /etc/nginx/sites-enabled/
sudo certbot --nginx

```



# cite 

Callum M Ives and Ojas Singh et al. Restoring Protein Glycosylation with GlycoShape bioRxiv (2023).
https://doi.org/10.1101/2023.12.11.571101