using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ConsoleApp1.Proxy;
using McHosting.ServiceWorker;
using McHosting.ServiceWorker.Business;
using McHosting.ServiceWorker.Model;
using Microsoft.AspNetCore.SignalR.Client;

namespace ConsoleApp1
{
    class Program
    {
        static async Task Main(string[] args)
        {



            var connection = new HubConnectionBuilder()
                .WithUrl("http://localhost:5000/serverAction")
                .Build();


            //var serverActionsClient = new ServerActionsClient(connection);

            connection.On<string,string>("DisplayServerMessage",(serverName,data)=>
            {
                Console.WriteLine($"{serverName}: {data}");
            });
            connection.On<string>("ServerStarted",(serverName)=>
            {
                Console.WriteLine($"Server Started ({serverName})");
            });
            connection.On<string>("ServerStopped",(serverName)=>
            {
                Console.WriteLine($"Server Stopped ({serverName})");
            });


            connection.On<string, ActionProgressUpdate>("CreateServer-ProgressUpdate", (serverName, progressUpdate) =>
            {
                Console.WriteLine($"Creating Server {serverName} ({progressUpdate.PercentDone * 100}%): {progressUpdate.Message}");
            });

            connection.On<string, ActionProgressUpdate>("UpdateServerProperties-ProgressUpdate", (serverName, progressUpdate) =>
            {
                Console.WriteLine($"Updating Server {serverName} ServerProperties ({progressUpdate.PercentDone * 100}%): {progressUpdate.Message}");
            });

            connection.On<string, ActionProgressUpdate>("UpdateEula-ProgressUpdate", (serverName, progressUpdate) =>
            {
                Console.WriteLine($"Updating Server {serverName} EULA ({progressUpdate.PercentDone * 100}%): {progressUpdate.Message}");
            });

            connection.On<McServer>("ServerCreated", (mcServer) =>
            {
                Console.WriteLine($"A new minecraft server was just created ({mcServer.ServerName})");
            });
            await Task.Delay(5000);
            try
            {
                await connection.StartAsync();

                var serverName = "MyNewServer4";
                //await connection.InvokeAsync("CreateServerSimple",
                //    serverName,
                //     "1.16.4",
                //     "1G",
                //     "2G",
                //     $@"F:\Minecraft\Servers\{serverName}",
                //     null,
                //     null,
                //     ServerType.Vanilla,
                //     25566
                //    );
                await connection.InvokeAsync("StartServer", serverName);
                await Task.Delay(TimeSpan.FromMinutes(.5));
                await connection.InvokeAsync("StopServer", serverName);
                //await connection.InvokeAsync("CreateServer", baseMcServer);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }

            await Task.Delay(50000);

        }
    }
}
