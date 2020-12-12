using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Model;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace McHosting.ServiceWorker.Business
{
    public class McServerActions
    {
        private readonly McServerInstallManager _mcServerInstallManager;
        private readonly McServerPropertyManager _mcServerPropertyManager;
        private readonly ServerContext _serverContext;
        private readonly ServerProcessManager _serverProcessManager;

        public McServerActions(
            McServerInstallManager mcServerInstallManager,
            McServerPropertyManager mcServerPropertyManager,
            ServerContext serverContext,
            ServerProcessManager serverProcessManager
            )
        {
            _mcServerInstallManager = mcServerInstallManager;
            _mcServerPropertyManager = mcServerPropertyManager;
            _serverContext = serverContext;
            _serverProcessManager = serverProcessManager;
        }

        //? Get methods
        // returns an agregate of data from DB and files on disk.
        public async Task<List<McServer>> GetAllServers()
        {
            var dbServers = await _serverContext.Servers.ToListAsync();
            var businessServers = dbServers.Select(dbs => new baseMcServer(dbs)).ToList();
            var serversFromDiskTasks = businessServers
                .Select(server => _mcServerInstallManager.GetMinecraftServerFromDisk(server)).ToList();
            await Task.WhenAll(serversFromDiskTasks);

            var allServers = new List<McServer>();
            foreach (var serversFromDiskTask in serversFromDiskTasks)
            {
                allServers.Add(await serversFromDiskTask);
            }

            return allServers;
        }

        public async Task<McServer> GetServerByName(string serverName)
        {
            var dbServer = await _serverContext.Servers.Where(s => s.ServerName == serverName).FirstAsync();
            var busServer = await _mcServerInstallManager.GetMinecraftServerFromDisk(new baseMcServer(dbServer));
            return busServer;
        }


        //? Create new servers
        // download jar files
        // add instance to DB
        // Setup EULA and ServerProperties files.
        public async Task<McServer> CreateNewServer(baseMcServer baseMcServer, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            McServer createdMcServer = await _mcServerInstallManager.CreateMcServerOnDisk(baseMcServer, createProgress, cancellationToken);
            await _serverContext.Servers.AddAsync(createdMcServer.ToMinecraftServer(), cancellationToken);
            await _serverContext.SaveChangesAsync(cancellationToken);
            return createdMcServer;
        }


        //? DELETE SERVER
        public async Task DeleteExistingServer(string serverName, IProgress<ActionProgressUpdate> deleteProgress = default, CancellationToken cancellationToken = default)
        {
            var dbServer = await _serverContext.Servers.Where(s => s.ServerName == serverName).FirstAsync(cancellationToken: cancellationToken);

            //TODO: Ensure Server is shut down
            throw new NotImplementedException();
            //await _mcServerInstallManager.RemoveMinecraftServerFromDisk(new baseMcServer(dbServer),deleteProgress,cancellationToken);

        }
        
        //? DOWNLOAD SERVER
        public async Task DownloadExistingServer(string serverName, IProgress<ActionProgressUpdate> deleteProgress = default, CancellationToken cancellationToken = default)
        {
            var dbServer = await _serverContext.Servers.Where(s => s.ServerName == serverName).FirstAsync(cancellationToken: cancellationToken);
            
            //TODO: Ensure Server is shut down
            throw new NotImplementedException();
            //await _mcServerInstallManager.RemoveMinecraftServerFromDisk(new baseMcServer(dbServer),deleteProgress,cancellationToken);
        }

        //? UPLOAD SERVER
        public async Task UploadNewServer(baseMcServer baseServer, byte[] serverZip, IProgress<ActionProgressUpdate> deleteProgress = default, CancellationToken cancellationToken = default)
        {
            //Write zip to file
            //unzip to "workingDirectory"
            //Get ServerProperties from uploaded files
            throw new NotImplementedException();
        }


        ////?TODO: Manage world files
        //// add new realms
        //// delete any realm
        //// change name
        //public Task CreateNewWorld(,IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default) { }
        //public Task RemoveWorld(,IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default){}
        //public Task RenameWorld(,IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default){}

        //? START/STOP SERVERS
        public async Task StartServer(string serverName, CancellationToken cancellationToken = default)
        {
            await _serverProcessManager.StartServer(serverName);
        }

        public async Task StopServer(string serverName, CancellationToken cancellationToken = default)
        {
            await _serverProcessManager.StopServer(serverName);
        }

        public async Task SendCommandToServer(string serverName,string command, CancellationToken cancellationToken = default)
        {
            await _serverProcessManager.SendCommandToServer(serverName,command);
        }

        //? MANAGE PROPERTIES
        public async Task UpdateServerProperties(string serverName, List<ServerProperty> serverProperties, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            var dbServer = await _serverContext.Servers.Where(s => s.ServerName == serverName).FirstAsync(cancellationToken: cancellationToken);
            await _mcServerPropertyManager.WriteServerProperties(dbServer.WorkingFolder,serverProperties,createProgress,cancellationToken);

        }
        public async Task UpdateEula(string serverName,bool value, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            var dbServer = await _serverContext.Servers.Where(s => s.ServerName == serverName).FirstAsync(cancellationToken: cancellationToken);
            await _mcServerPropertyManager.WriteEula(dbServer.WorkingFolder, value, createProgress, cancellationToken);

        }
    }
}
