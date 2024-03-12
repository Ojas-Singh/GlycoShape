# GlycoShape

[GlycoShape](https://glycoshape.org) is an OA database of glycans 3D structural data and information that can be downloaded or used with [Re-Glyco](https://glycoshape.org/reglyco) to rebuild glycoproteins from the [RCSB PDB](https://www.rcsb.org/) or [EMBL-EBI AlphaFold](https://alphafold.ebi.ac.uk) repositories

This repository contain the codebase for GlycoShape website along with the data used for analysis in the paper.


GlycoShape depends on these codesbase.
[Re-Glyco repository](https://github.com/Ojas-Singh/Re-Glyco)  and 
[GlycanAnalysisPipeline (GAP) repository](https://github.com/Ojas-Singh/GlycanAnalysisPipeline)

# Installation Guide



Installing and running GlycoShape on a local machine involves a series of steps that may require a certain level of technical expertise, particularly in server setup and configuration. While the process is not entirely straightforward, we've outlined a general procedure below to assist you through it. We recommend that individuals undertaking this task have some experience with server setup. 

Please follow these steps carefully, and do not hesitate to reach out us [here](mailto:ojas.singh.2023@mumail.ie). Your patience and attention to detail during this process will be greatly appreciated. 


- Install [GlycanAnalysisPipeline (GAP)](https://github.com/Ojas-Singh/GlycanAnalysisPipeline)
- Run GAP on the Data dir according to the README of GAP.
- Run DB_Scripts to rearragne the files in clean format.
- Install [Re-Glyco ](https://github.com/Ojas-Singh/Re-Glyco) 
 


## Build the website using npm

Once you have Database dir ready and Re-Glyco API running at port 8000

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

Callum M Ives and Ojas Singh et al. Restoring Protein Glycosylation with GlycoShape [bioRxiv (2023)](https://www.biorxiv.org/content/10.1101/2023.12.11.571101v1.full).
