using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Infrastructure.VanillaManifest;
using McHosting.ServiceWorker.Model;
using Persistence;

namespace McHosting.ServiceWorker.Business
{
    public class McServerInstallManager
    {
        private readonly McServerFileDownloader _fileDownloader;
        private readonly VanillaManifestClient _vanillaManifestClient;
        private readonly McServerPropertyManager _mcServerPropertyManager;
        private readonly ServerContext _serverContext;
        private readonly McServerInstallerConfiguration _configuration;

        public McServerInstallManager(
            McServerInstallerConfiguration configuration,
            McServerFileDownloader fileDownloader, 
            VanillaManifestClient vanillaManifestClient,
            McServerPropertyManager mcServerPropertyManager,
            ServerContext serverContext)
        {
            _fileDownloader = fileDownloader;
            _vanillaManifestClient = vanillaManifestClient;
            _mcServerPropertyManager = mcServerPropertyManager;
            _serverContext = serverContext;
            _configuration = configuration;
        }
        public McServerInstallManager(
            McServerFileDownloader fileDownloader, VanillaManifestClient vanillaManifestClient,
            McServerPropertyManager mcServerPropertyManager)
        {
            _fileDownloader = fileDownloader;
            _vanillaManifestClient = vanillaManifestClient;
            _mcServerPropertyManager = mcServerPropertyManager;
        }

        //? GET
        public async Task<McServer> GetMinecraftServerFromDisk(baseMcServer mcServerIdentifier)
        {
            //Already have base properties
            var mcServer = new McServer(mcServerIdentifier);

            mcServer.ServerProperties = await _mcServerPropertyManager.GetServerPropertiesForServerAsync(mcServerIdentifier.WorkingFolder);
            //mcServer.BannedList = await _mcServerPropertyManager.GetBannedListForServerAsync(mcServerIdentifier);
            //mcServer.Usernames = await _mcServerPropertyManager.GetUsernamesForServerAsync(mcServerIdentifier);
            mcServer.IsEulaTrue = await _mcServerPropertyManager.GetEulaValue(mcServerIdentifier.WorkingFolder);

            return mcServer;
        }

        //? Create
        public async Task<McServer> CreateMcServerOnDisk(baseMcServer baseMcServer,IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            switch (baseMcServer.ServerType)
            {
                case ServerType.Vanilla:
                    return await CreateVanillaServerOnDisk(baseMcServer,createProgress,cancellationToken);
                case ServerType.Forge:
                    return await CreateForgeServerOnDisk(baseMcServer, createProgress,cancellationToken);
                case ServerType.Spigot: 
                    return await CreateSpigotServerOnDisk(baseMcServer, createProgress,cancellationToken);
                case ServerType.Bedrock:
                default:
                    throw new NotImplementedException();
            }
        }
        //Update
        // //PropertiesOfServer
        //

        private async Task<McServer> CreateVanillaServerOnDisk(baseMcServer baseMcServer, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            baseMcServer.JarFile ??= $"server-{baseMcServer.MinecraftVersion}.jar";
            var jarFile = await _fileDownloader.GetVanillaServerFile(baseMcServer.MinecraftVersion);
            var workingDirectory = Directory.CreateDirectory(baseMcServer.WorkingFolder); //Ensures folder exists.
            var fullyQualifiedJarFile = $@"{workingDirectory.FullName}\{baseMcServer.JarFile}";
            
            //Create JarFile
            await File.WriteAllBytesAsync(fullyQualifiedJarFile, jarFile, cancellationToken);

            //Setup EULA and ServerProperties. EULA is false until they change it.
            await _mcServerPropertyManager.WriteEula(baseMcServer.WorkingFolder,true, cancellationToken: cancellationToken);
            var defaultServerProperties = _mcServerPropertyManager.GetDefaultServerProperties();

            defaultServerProperties.First(x => x.Key == "server-port").Value = baseMcServer.Port.ToString();

            await _mcServerPropertyManager.WriteServerProperties(baseMcServer.WorkingFolder, defaultServerProperties, cancellationToken: cancellationToken);

            //Get files just written. (in case they changed in the .2 seconds since they were written??? lol.)
            return await GetMinecraftServerFromDisk(baseMcServer);
        }
        private async Task<McServer> CreateForgeServerOnDisk(baseMcServer baseMcServer, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default )
        {
            var jarFile = await _fileDownloader.GetForgeServerFile(baseMcServer.MinecraftVersion, baseMcServer.SecondaryVersionNumber);
            var workingDirectory = Directory.CreateDirectory(baseMcServer.WorkingFolder); //Ensures folder exists.
            var fullyQualifiedJarFile = $@"{workingDirectory.FullName}\{baseMcServer.JarFile}";

            //Create JarFile
            await File.WriteAllBytesAsync(fullyQualifiedJarFile, jarFile, cancellationToken);

            //Setup EULA and ServerProperties. EULA is false until they change it.
            await _mcServerPropertyManager.WriteEula(baseMcServer.WorkingFolder, false);
            await _mcServerPropertyManager.WriteServerProperties(baseMcServer.WorkingFolder, _mcServerPropertyManager.GetDefaultServerProperties());

            //Get files just written. (in case they changed in the .2 seconds since they were written??? lol.)
            return await GetMinecraftServerFromDisk(baseMcServer);
        }

        private async Task<McServer> CreateSpigotServerOnDisk(baseMcServer baseMcServer, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default )
        {
            var spigotInstallerFile = _fileDownloader.GetSpigotInstallerFile(baseMcServer.MinecraftVersion, baseMcServer.SecondaryVersionNumber);
            var workingDirectory = Directory.CreateDirectory(baseMcServer.WorkingFolder); //Ensures folder exists.
            var fullyQualifiedJarFile = $@"{workingDirectory.FullName}\SpigotInstaller.{baseMcServer.SecondaryVersionNumber}.jar";

            //Create JarFile
            await File.WriteAllBytesAsync(fullyQualifiedJarFile, spigotInstallerFile, cancellationToken);

            //Setup EULA and ServerProperties. EULA is false until they change it.
            await _mcServerPropertyManager.WriteEula(baseMcServer.WorkingFolder, false);
            await _mcServerPropertyManager.WriteServerProperties(baseMcServer.WorkingFolder, _mcServerPropertyManager.GetDefaultServerProperties());


            //Extra steps for Spigot.
            // TODO: need to run the installer, which will download git/etc.
            await RunJavaJarFile(fullyQualifiedJarFile,createProgress,cancellationToken);

            //Get files just written. (in case they changed in the .2 seconds since they were written??? lol.)
            return await GetMinecraftServerFromDisk(baseMcServer);
        }

        /// <summary>
        /// Designed only for spigot which uses a jar file to download server files.
        /// This is not intended to run the actual MC server
        /// </summary>
        /// <param name="fullyQualifiedJarFile"></param>
        /// <param name="createProgress"></param>
        /// <param name="cancellationToken"></param>
        /// <param name="argList"></param>
        /// <returns></returns>
        private async Task RunJavaJarFile(string fullyQualifiedJarFile, IProgress<ActionProgressUpdate> createProgress = null, CancellationToken cancellationToken = default ,params string[] argList)
        {
            var workingDirectory = Directory.GetParent(fullyQualifiedJarFile)?.FullName ?? throw new ArgumentNullException(nameof(fullyQualifiedJarFile),"Parent of jar file failed to parse to folder");
            var processStartInfo = new ProcessStartInfo()
            {
                WorkingDirectory = workingDirectory,
                FileName = "java"
            };
            foreach (var arg in argList)
            {
                processStartInfo.ArgumentList.Add(arg);
            }

            var process = new Process();
            process.StartInfo.WorkingDirectory = workingDirectory;
            process.StartInfo.FileName= "java";
            process.StartInfo.ArgumentList.Add("-jar");
            process.StartInfo.ArgumentList.Add(fullyQualifiedJarFile);
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardError = true;
            process.StartInfo.RedirectStandardOutput = true;

            process.OutputDataReceived += (sender, data) => createProgress?.Report(new ActionProgressUpdate(){ Message = data.Data});
            process.ErrorDataReceived += (sender, data) => createProgress?.Report(new ActionProgressUpdate() { Message = $"Error: {data.Data}"});
            process.Start();

            await process.WaitForExitAsync(cancellationToken);
        }
    }

    public class ActionProgressUpdate
    {
        public double PercentDone { get; set; }
        public string Message { get; set; }

        public static implicit operator ActionProgressUpdate((double, string) t) => new ActionProgressUpdate(){PercentDone = t.Item1,Message = t.Item2};

}

    public class McServerInstallerConfiguration
    {
    }
}
