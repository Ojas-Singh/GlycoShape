# GlycoShape
Website for GlycoShape Database and Tools.
#28363F
#4E6E6D


```
sudo nano /etc/nginx/cors.conf
sudo nano /etc/nginx/sites-available/glycoshape.io
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
```


## api

gunicorn -w 4 api:app --timeout 900