# GlycoShape
Website for GlycoShape Database and Tools.



```
sudo nano /etc/nginx/cors.conf
sudo nano /etc/nginx/sites-available/glycoshape.io
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
```


## api

gunicorn -w 4 api:app --timeout 900