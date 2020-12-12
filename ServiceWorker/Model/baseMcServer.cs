using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using Persistence.Models;

namespace McHosting.ServiceWorker.Model
{
    public class baseMcServer
    {
        public baseMcServer(){}

        public baseMcServer(baseMcServer baseMcServer)
        {
            this.ServerName = baseMcServer.ServerName;
            this.ServerType = baseMcServer.ServerType;
            this.MinecraftVersion = baseMcServer.MinecraftVersion;
            this.Port = baseMcServer.Port;
            this.MinRam = baseMcServer.MinRam;
            this.MaxRam = baseMcServer.MaxRam;
            this.WorkingFolder = baseMcServer.WorkingFolder;
            this.JarFile = baseMcServer.JarFile;
            this.SecondaryVersionNumber = baseMcServer.SecondaryVersionNumber;
        }
        public baseMcServer(MinecraftServer baseMcServer)
        {
            this.ServerName = baseMcServer.ServerName;
            this.ServerType = GetServerType(baseMcServer.ServerType);
            this.MinecraftVersion = baseMcServer.MinecraftVersion;
            this.Port = baseMcServer.Port;
            this.MinRam = baseMcServer.MinRam;
            this.MaxRam = baseMcServer.MaxRam;
            this.WorkingFolder = baseMcServer.WorkingFolder;
            this.JarFile = baseMcServer.JarFile;
            this.SecondaryVersionNumber = baseMcServer.SecondaryVersionNumber;
        }
        public string ServerName;
        public ServerType ServerType;
        public string MinecraftVersion;
        public int Port;
        public string MinRam;
        public string MaxRam;
        public string WorkingFolder;
        public string JarFile;
        public string SecondaryVersionNumber;

        /// <summary>
        /// Only to be used when creating a new server. since it looses the DB id.
        /// </summary>
        /// <returns></returns>
        public MinecraftServer ToMinecraftServer()
        {
            return new MinecraftServer
            {
                Id = 0,
                ServerName = ServerName,
                ServerType = GetServerType(ServerType),
                MinecraftVersion = MinecraftVersion,
                SecondaryVersionNumber = SecondaryVersionNumber,
                Port = Port,
                MinRam = MinRam,
                MaxRam = MaxRam,
                WorkingFolder = WorkingFolder,
                JarFile = JarFile,
                //IsEulaTrue = IsEulaTrue
            };
        }

        private ServerType GetServerType(Persistence.Models.ServerType serverType)
        {
            switch (serverType)
            {
                case Persistence.Models.ServerType.Vanilla:
                    return ServerType.Vanilla;
                    break;
                case Persistence.Models.ServerType.Forge:
                    return ServerType.Forge;
                    break;
                case Persistence.Models.ServerType.Spigot:
                    return ServerType.Spigot;
                    break;
                case Persistence.Models.ServerType.Bedrock:
                    return ServerType.Bedrock;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(serverType), serverType, null);
            }
        }
        private Persistence.Models.ServerType GetServerType(ServerType serverType)
        {
            switch (serverType)
            {
                case ServerType.Vanilla:
                    return Persistence.Models.ServerType.Vanilla;
                    break;
                case ServerType.Forge:
                    return Persistence.Models.ServerType.Forge;
                    break;
                case ServerType.Spigot:
                    return Persistence.Models.ServerType.Spigot;
                    break;
                case ServerType.Bedrock:
                    return Persistence.Models.ServerType.Bedrock;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(serverType), serverType, null);
            }
        }
    }

    public class McServer : baseMcServer
    {
        private void initializeEmptyClass()
        {
            Usernames = new List<string>();
            BannedList = new List<string>();
            ServerProperties = new List<ServerProperty>();
            IsEulaTrue = false;
        }
        public McServer() => initializeEmptyClass();
        public McServer(baseMcServer mcServer):base(mcServer) => initializeEmptyClass();

        public McServer(McServer mcServer) : base(mcServer)
        {
            this.Usernames = new List<string>(mcServer.Usernames);
            this.BannedList = new List<string>(mcServer.BannedList);
            this.ServerProperties = mcServer.ServerProperties;
            this.IsEulaTrue = mcServer.IsEulaTrue;
        }
        public List<string> Usernames;
        public List<string> BannedList;
        public IList<ServerProperty> ServerProperties;
        public bool IsEulaTrue;
    }

    public enum ServerType
    {
        Vanilla,
        Forge,
        Spigot,
        Bedrock,
    }
}
