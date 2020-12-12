using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Persistence;
using Persistence.Models;

namespace McHosting.ServiceWorker.Business
{
    public class ServerProcessManager
    {
        private readonly ILogger<ServerProcessManager> _logger;
        private readonly ServerContext _ctx;
        private readonly IHubContext<ServerActionsHub, IServerActionsClient> _hub;
        private readonly ConcurrentDictionary<string, (Process, List<string>)> _processes = new ConcurrentDictionary<string, (Process,List<string>)>();
        private readonly IServiceScope _scope;

        public ServerProcessManager(ILogger<ServerProcessManager> logger, IServiceScopeFactory scopeFactory, IHubContext<ServerActionsHub, IServerActionsClient> hub)
        {
            _scope =  scopeFactory.CreateScope();
            _logger = logger;
            _hub = hub;
            _ctx = _scope.ServiceProvider.GetService<ServerContext>();
        }
        void OnDataReceivedEventHandler(string serverName, string data)
        {
            //Save all logs to dictionary?
            //serverLogs.Add(data);
            Console.WriteLine(data);
            _hub.Clients.All.DisplayServerMessage(serverName, data);
        }
        public async Task StartServer(string serverName)
        {
            var mcServer = await _ctx.Servers.FirstOrDefaultAsync(s => s.ServerName == serverName);
            var process = new Process();
            var serverLogs = new List<string>();
            if (_processes.TryAdd(serverName, (process,serverLogs)))
            {
                _ = StartServerProcess(serverName, process, mcServer);
            }
            else
            {
                // The server is already running?
            }

        }

        private async Task StartServerProcess(string serverName, Process process, MinecraftServer mcServer)
        {
            process.StartInfo.WorkingDirectory = mcServer.WorkingFolder;
            process.StartInfo.FileName = "java";
            process.StartInfo.ArgumentList.Add($"-Xms{mcServer.MinRam}");
            process.StartInfo.ArgumentList.Add($"-Xmx{mcServer.MaxRam}");
            process.StartInfo.ArgumentList.Add("-XX:+UseG1GC");
            process.StartInfo.ArgumentList.Add("-jar");
            process.StartInfo.ArgumentList.Add(mcServer.JarFile);
            process.StartInfo.ArgumentList.Add("--nogui");
            process.StartInfo.CreateNoWindow = true;
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardError = true;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardInput = true;


            process.OutputDataReceived += (sender, data) => OnDataReceivedEventHandler(serverName, data.Data);
            process.ErrorDataReceived += (sender, data) => OnDataReceivedEventHandler(serverName, data.Data);

            process.Start();
            process.BeginErrorReadLine();
            process.BeginOutputReadLine();

            Console.WriteLine($"Server Started ({serverName})");

            await _hub.Clients.All.ServerStarted(serverName);

            await process.WaitForExitAsync();

            Console.WriteLine($"Server Stopped ({serverName})");

            await _hub.Clients.All.ServerStopped(serverName);

            _processes.TryRemove(serverName, out var value);

        }

        public async Task StopServer(string serverName)
        {
            if (_processes.TryGetValue(serverName, out var server))
            {
                var serverProcess = server.Item1;
                await serverProcess.StandardInput.WriteLineAsync("stop");
            }
        }
        public async Task SendCommandToServer(string serverName, string inputCommand)
        {
            if (_processes.TryGetValue(serverName, out var server))
            {
                var serverProcess = server.Item1;
                await serverProcess.StandardInput.WriteLineAsync(inputCommand);
            }
        }
    }
}
