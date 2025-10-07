# MeetupPlanner

## Build and deploy

### Building MeetupPlanner.Api container image locally
Run the following command:
```
dotnet publish -t:PublishContainer -p:ContainerImageTags=latest --no-restore -p:ContainerRepository=meetupplanner/api -p:VersionSuffix=beta1
```


### Build image and push to Azure Container Registry
To build and publish the application to Azure Container Registry and then update the container app, run the following commands:

First login to the container registry:
```
docker login mycontainerregistry.azurecr.io
```

Enter username and password when prompted.

Build the container image by running the following command:
```
dotnet publish .\src\MeetupPlanner.Api\MeetupPlanner.Api.csproj  -t:PublishContainer -p:ContainerImageTags='"latest"' -p:VersionSuffix=test1 -p:ContainerRegistry=mycontainerregistry.azurecr.io
```

This will create a docker image `meetupplanner/api` with the tag `latest` and push it to the Azure Container Registry `mycontainerregistry.azurecr.io`.
Replace `mycontainerregistry.azurecr.io` with your Azure Container Registry name.

# Running the application

## Running the application in Azure
To run the application in Azure, you need to create a Container App in Azure. You can do this using the Azure Portal or using the Azure CLI.

## Running the application locally

### Running the application using Docker
To run the application using Docker, run the following command:
```
docker run -p 8080:80 meetupplanner/api:latest
```

This will run the application on port 8080.

### Running the application using dotnet
To run the application using dotnet, run the following command:
```
dotnet run --project .\src\MeetupPlanner.Api\MeetupPlanner.Api.csproj
```

This will run the application on port 5000.

### Run the application in a container using https and a self-signed certificate

Generate a certificate and configure the local machine:

```bash
dotnet dev-certs https -ep $env:USERPROFILE\.aspnet\https\aspnetapp.pfx -p <CREDENTIAL_PLACEHOLDER>
dotnet dev-certs https --trust
```

In the preceding commands, replace <CREDENTIAL_PLACEHOLDER> with a password.

To run the application in a container using https and a self-signed certificate, run the following command:
```
docker run --rm -it -p 7119:8080 -e ASPNETCORE_URLS="https://+:8080;" -e ASPNETCORE_ENVIRONMENT=Development -e ASPNETCORE_HTTPS_PORT=7119 -e ASPNETCORE_Kestrel__Certificates__Default__Password="docker" -e ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx -v $env:USERPROFILE\.aspnet\https:/https/ -v $env:APPDATA\microsoft\UserSecrets\:/root/.microsoft/usersecrets:ro meetupplanner/api:latest
```

Running locally with user-secrets requires mounting the user-secrets directory to the container. This is done by mounting the user-secrets directory to the container using the `-v` flag.
It's also required to run as root to access the user-secrets directory. This is done by running the container with the `--user` flag.
```
docker run --rm -it -p 7119:8080 -e ASPNETCORE_URLS="https://+:8080;" -e ASPNETCORE_ENVIRONMENT=Development -e ASPNETCORE_HTTPS_PORT=7119 -e ASPNETCORE_Kestrel__Certificates__Default__Password="docker" -e ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx -v $env:USERPROFILE\.aspnet\https:/https/ -v $env:APPDATA\microsoft\UserSecrets\:/root/.microsoft/usersecrets --user root meetupplanner/api:latest
```

## Dependencies
MeetupPlanner.Api depends on a few services to run. These services are:
- Sql Server

To run Sql Server, run the following command:
```
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Your_password123" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

To run the standalone .NET Aspire Dashboard, run the following command:
```
docker run --rm -it -p 18888:18888 -p 4317:18889 -d --name aspire-dashboard -e DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS='true' mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

# Authentication
A few of the endpoints in MeetupPlanner.Api require authentication. To authenticate, you need to provide a valid JWT token in the `Authorization` header. The JWT token should be in the format `Bearer <token>`.
Currently the MeetupPlanner.Api supports two issuers
- Azure AD
- dotnet-user-jwts

## Using dotnet-user-jwts
First check if you have created a JWT token for the user previously.
```
dotnet user-jwts list --project .\src\MeetupPlanner.Api\MeetupPlanner.Api.csproj
```

If you haven't created a JWT token for the user, create a JWT token for the user by running the following command:
```
dotnet user-jwts create --project .\src\MeetupPlanner.Api\MeetupPlanner.Api.csproj
```

This will create a JWT token for the user and print the token to the console. It will also save information about the token to the user-secrets defined for the project in secrets.json.
The path to the user-secrets is defined in the project file. The default path is `C:\Users\<username>\AppData\Roaming\Microsoft\UserSecrets\<user-secrets-id>\secrets.json`.
The token itself is saved in another file called `user-jwts.json` in the same directory.

To authenticate using the JWT token, copy the token from the console and provide it in the `Authorization` header in the format `Bearer <token>`.
```
curl -i -H "Authorization: Bearer <TOKEN>" https://localhost:5001/info/config
```

There's a bug in the dotnet SDK <= 9.0.102 which generates incorrect configuration which results in [IDX10500](https://github.com/dotnet/aspnetcore/issues/59277). To work around this issue, you have to change the configuration key 
ValidIssuer to ValidIssuers in appsettings.development.json. The configuration should look like this:

```json
  "Authentication": {
    "DefaultScheme": "Bearer",
    "Schemes": {
      "Bearer": {
        "ValidAudiences": [
          "http://localhost:5016",
          "https://localhost:7119"
        ],
        "ValidIssuers": [ "dotnet-user-jwts" ]
      }
    }
  }
```

For more information about the `dotnet user-jwts` command, browse to the [dotnet user-jwts documentation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn?view=aspnetcore-9.0&tabs=linux)