#/etc/nginx/sites-available/glycoshape.io


server {
    if ($host = glycoshape.io) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name glycoshape.io;
    return 301 https://$host$request_uri;


}

server {
    
    listen 443 ssl;
    server_name glycoshape.io;
    ssl_certificate /etc/letsencrypt/live/glycoshape.io/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/glycoshape.io/privkey.pem; # managed by Certbot


    location / {

        try_files $uri /index.html;
        if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Other directives for GET, POST, etc.
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        alias /mnt/database/GlycoShape/glycoshape-website/build_dev/;
        autoindex on; # Enable listing of directory

    }
    location /database/ {
        alias /mnt/database/DB/;
        autoindex on;
        include /etc/nginx/cors.conf;
    }

    location /api/ {
        client_max_body_size 100M;
        client_body_buffer_size 10M;
        
        proxy_read_timeout 900;
        proxy_connect_timeout 900;
        proxy_send_timeout 900; 
        proxy_pass http://127.0.0.1:8001; # Assuming Gunicorn is running on this port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

    }
    location /socket.io {
        proxy_pass http://127.0.0.1:8001/socket.io;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    }
    
    location /output/ {
        alias /mnt/database/server_dir/;
        autoindex on;
        include /etc/nginx/cors.conf;
    }
    
    location /reglyco/ {
        alias /home/ubuntu/Re-Glyco/static/;
        autoindex on;
    }
}