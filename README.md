# GlycoShape

This repository contain the codebase for GlycoShape website along with the data used for analysis in the paper.

Re-Glyco repository at https://github.com/Ojas-Singh/Re-Glyco and 
GlycanAnalysisPipeline (GAP) at https://github.com/Ojas-Singh/GlycanAnalysisPipeline

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