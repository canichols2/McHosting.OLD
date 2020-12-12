using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Business;
using McHosting.ServiceWorker.Model;
using Microsoft.AspNetCore.SignalR;

namespace McHosting.ServiceWorker
{
    public interface IServerActionsClient
    {
        Task CreateServer_ProgressUpdate(string serverName, ActionProgressUpdate update);
        Task UpdateServerProperties_ProgressUpdate(string serverName, ActionProgressUpdate update);
        Task UpdateEula_ProgressUpdate(string serverName, ActionProgressUpdate update);
        Task ServerCreated(McServer server);
        Task DisplayServerMessage(string serverName, string data);
        Task ServerStarted(string serverName);
        Task ServerStopped(string serverName);
    }

    public interface IServerActionsHub
    {
        Task CreateServerSimple(string serverName, string minecraftVersion, string minRam, string maxRam,
            string workingFolder, string jarFile, string secondaryVersionNumber, ServerType serverType, int port);

        Task CreateServer(baseMcServer newServerRequest);
        Task<List<McServer>> GetAllServers();
        Task UpdateServerProperties(string serverName, List<ServerProperty> serverProperties);
        Task UpdateEula(string serverName, bool eulaValue);

        Task StartServer(string serverName);
    }

    public class ServerActionsHub : Hub<IServerActionsClient>, IServerActionsHub
    {
        private readonly McServerActions _serverActions;
        //private readonly ServerManagerWorker _serverManagerWorker;

        public ServerActionsHub(McServerActions serverActions)
        {
            _serverActions = serverActions;
            //_serverManagerWorker = serverManagerWorker;
        }

        public async Task CreateServerSimple(string serverName,
            string minecraftVersion,
            string minRam,
            string maxRam,
            string workingFolder,
            string jarFile,
            string secondaryVersionNumber,
            ServerType serverType,
            int port)
        {
            baseMcServer baseMcServer = new baseMcServer
            {
                ServerName = serverName,
                ServerType = serverType,
                MinecraftVersion = minecraftVersion,
                Port = port,
                MinRam = minRam,
                MaxRam = maxRam,
                WorkingFolder = workingFolder,
                JarFile = jarFile,
                SecondaryVersionNumber = secondaryVersionNumber
            };
            await CreateServer(baseMcServer);
        }
        public async Task CreateServer(baseMcServer newServerRequest)
        {
            var progressReport = new Progress<ActionProgressUpdate>((progressUpdate)=> 
                Clients.Caller.CreateServer_ProgressUpdate(newServerRequest.ServerName, progressUpdate));
            
            var mcServer = await _serverActions.CreateNewServer(newServerRequest, progressReport, Context.ConnectionAborted);
            await Clients.Caller.CreateServer_ProgressUpdate(newServerRequest.ServerName, (1, "Server Created"));
            await Clients.All.ServerCreated(mcServer);
        }


        public async Task<List<McServer>> GetAllServers()
        {
            return await _serverActions.GetAllServers();
        }

        public async Task UpdateServerProperties(string serverName, List<ServerProperty> serverProperties)
        {
            var progressReport = new Progress<ActionProgressUpdate>((progress) => Clients.Caller.UpdateServerProperties_ProgressUpdate(serverName, progress));
            await _serverActions.UpdateServerProperties(serverName, serverProperties,progressReport);
            await Clients.Caller.UpdateServerProperties_ProgressUpdate(serverName, (1,"Server Properties Updated"));
        }

        public async Task UpdateEula(string serverName, bool eulaValue)
        {
            var progressReport = new Progress<ActionProgressUpdate>((progress) => Clients.Caller.UpdateEula_ProgressUpdate(serverName, progress));
            await _serverActions.UpdateEula(serverName, eulaValue, progressReport);
            await Clients.Caller.UpdateEula_ProgressUpdate(serverName, (1,"EULA Updated")) ;
        }


        //? Delete
        // Not Implemented

        //? Start
        public async Task StartServer(string serverName)
        {
            await _serverActions.StartServer(serverName);
        }
        //? Stop
        public async Task StopServer(string serverName)
        {
            await _serverActions.StopServer(serverName);
        }
        //? Commands
        public async Task SendServerCommand(string serverName,string command)
        {
            await _serverActions.SendCommandToServer(serverName, command);
        }

    }
}
