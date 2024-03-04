# Start db with docker compose
## author
voanhtuanvn12
### Step 1
Ensure that there is a folder called `sql-scripts` that existed (if you want to load data)
### Step 2
Make the root of terminal session at `local-db-init`

```
cd cd local-db-init 
```

### Step 3
Build the docker compose

```
docker compose build
```
### Step 4

Run docker compose up in detach mode
```
docker-compose up -d
```

### Step 5 
If you want to delete the mysql container
```
docker-compose down
```

If you also want to remove the volumes associated with the containers, you can add the -v option

```
docker-compose down -v
```


