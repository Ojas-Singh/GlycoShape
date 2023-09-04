# GlycoShape
Website for GlycoShape Database and Tools.
#28363F
#4E6E6D


```
chown www-data:www-data target_folder


sudo nano /etc/nginx/cors.conf
sudo nano /etc/nginx/sites-available/glycoshape.io
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx
```


## api

pip install Flask-SocketIO
pip install eventlet


gunicorn -k eventlet -w 4 api:app --timeout 900
gunicorn -w 4 api:app --timeout 900





To add a GitHub repo (or any Git repository) inside another GitHub repo, you can use Git submodules. A Git submodule allows you to keep a Git repository as a subdirectory of another Git repository. 

Here are the steps to add a GitHub repo inside another GitHub repo using Git submodules:

1. **Navigate to your main repository's root directory**:  
    ```
    cd path/to/your/main/repo
    ```

2. **Add the submodule**:  
   Use the command `git submodule add` followed by the URL of the repo you want to add as a submodule:
    ```
    git submodule add https://github.com/user/repo-to-add.git path/to/submodule/directory
    ```

   This will clone the repository at the specified URL into the given directory path within your main repo.

3. **Commit the changes**:  
   Adding the submodule will create a `.gitmodules` file and changes in your main repo pointing to the specific commit of the submodule repo. You should commit these changes:
    ```
    git commit -m "Added submodule repo-name"
    ```

4. **Push the changes**:  
   Push the changes to your main GitHub repository:
    ```
    git push origin main
    ```
   Replace `main` with your default branch name if it's different.

When someone else clones your repository and sees that there are submodules configured, they can fetch the contents of the submodules by using:

```
git clone --recursive https://github.com/user/main-repo.git
```

Or if they've already cloned the repository, they can use:

```
git submodule update --init
```

Do note that working with submodules can be a bit tricky, especially if you're not familiar with their behavior. It's essential to be cautious when updating the submodule, as the main repository points to a specific commit of the submodule, not a branch. If you need to update the submodule to the latest version or another branch, ensure you navigate to the submodule directory, pull the changes, then navigate back to the main repo and commit the updated submodule reference.