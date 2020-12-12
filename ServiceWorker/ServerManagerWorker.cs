using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Business;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace McHosting.ServiceWorker
{
    public class ServerManagerWorker : BackgroundService
    {
        private readonly IHubContext<ServerActionsHub> _hubContext;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly McServerFileDownloader _fileDownloader;

        public ServerManagerWorker(IHubContext<ServerActionsHub> hubContext, IServiceScopeFactory scopeFactory)
        {
            _hubContext = hubContext;
            _scopeFactory = scopeFactory;

        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            //using var scope1 = _scopeFactory.CreateScope();
            //var fileDownloader = scope1.ServiceProvider.GetService<McServerFileDownloader>();
            //var dir = Directory.GetCurrentDirectory();
            //if (fileDownloader != null)
            //{
            //    var file = await fileDownloader.GetVanillaServerFile("1.16.4");
            //    await File.WriteAllBytesAsync(@$"{dir}\server.1.16.4.jar",file,stoppingToken);
            //}
        }
    }
}
