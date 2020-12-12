using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Linq.Expressions;
using System.Net;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using McHosting.ServiceWorker;
using McHosting.ServiceWorker.Business;
using McHosting.ServiceWorker.Model;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.Extensions.Logging;

namespace ConsoleApp1.Proxy
{

    public static class HubConnectionBindExtensions
    {
        public static IDisposable BindOnInterface<T>(this HubConnection connection, Expression<Func<IServerActionsHub, Func<T, Task>>> boundMethod, Action<T> handler)
            => connection.On<T>(_GetMethodName(boundMethod), handler);

        public static IDisposable BindOnInterface<T1, T2>(this HubConnection connection, Expression<Func<IServerActionsHub, Func<T1, T2, Task>>> boundMethod, Action<T1, T2> handler)
            => connection.On<T1, T2>(_GetMethodName(boundMethod), handler);

        public static IDisposable BindOnInterface<T1, T2, T3>(this HubConnection connection, Expression<Func<IServerActionsHub, Func<T1, T2, T3, Task>>> boundMethod, Action<T1, T2, T3> handler)
            => connection.On<T1, T2, T3>(_GetMethodName(boundMethod), handler);

        private static string _GetMethodName<T>(Expression<T> boundMethod)
        {
            var unaryExpression = (UnaryExpression)boundMethod.Body;
            var methodCallExpression = (MethodCallExpression)unaryExpression.Operand;
            var methodInfoExpression = (ConstantExpression)methodCallExpression.Object;
            var methodInfo = (MethodInfo)methodInfoExpression.Value;
            return methodInfo.Name;
        }
    }

    
    public class ServerActionsClient:IServerActionsClient
    {
        private readonly HubConnection _connection;

        public async Task StartConnectionAsync()
        {
            await _connection.StartAsync();
        }

        public ServerActionsClient(HubConnection connection)
        {
            _connection = connection;

            _connection.On<string,ActionProgressUpdate>(nameof(CreateServer_ProgressUpdate),(async (serverName,update) => await CreateServer_ProgressUpdate(serverName,update)));
            _connection.On<string,ActionProgressUpdate>(nameof(UpdateServerProperties_ProgressUpdate),(async (serverName,update) => await UpdateServerProperties_ProgressUpdate(serverName,update)));
            _connection.On<string,ActionProgressUpdate>(nameof(UpdateEula_ProgressUpdate),(async (serverName,update) => await UpdateEula_ProgressUpdate(serverName,update)));
            _connection.On<McServer>(nameof(ServerCreated),(async (serverName) => await ServerCreated(serverName)));

        }
        public Task CreateServer_ProgressUpdate(string serverName, ActionProgressUpdate update)
        {
            throw new NotImplementedException();
        }

        public Task UpdateServerProperties_ProgressUpdate(string serverName, ActionProgressUpdate update)
        {
            throw new NotImplementedException();
        }

        public Task UpdateEula_ProgressUpdate(string serverName, ActionProgressUpdate update)
        {
            throw new NotImplementedException();
        }

        public Task ServerCreated(McServer server)
        {
            throw new NotImplementedException();
        }

        public Task DisplayServerMessage(string serverName, string data)
        {
            throw new NotImplementedException();
        }

        public Task ServerStarted(string serverName)
        {
            throw new NotImplementedException();
        }

        public Task ServerStopped(string serverName)
        {
            throw new NotImplementedException();
        }
    }
    public class ServerActionsHub:IServerActionsHub
    {
        private HubConnection _connection;

        public ServerActionsHub(HubConnection connection)
        {
            _connection = connection;
        }
        public ServerActionsHub()
        {

            _connection = new HubConnectionBuilder()
                .WithUrl("http://localhost:5000/serverAction")
                .Build();
        }

        public Task CreateServerSimple(string serverName, string minecraftVersion, string minRam, string maxRam, string workingFolder,
            string jarFile, string secondaryVersionNumber, ServerType serverType, int port)
        {

            throw new NotImplementedException();
        }

        public Task CreateServer(baseMcServer newServerRequest)
        {
            throw new NotImplementedException();
        }

        public Task<List<McServer>> GetAllServers()
        {
            throw new NotImplementedException();
        }

        public Task UpdateServerProperties(string serverName, List<ServerProperty> serverProperties)
        {
            throw new NotImplementedException();
        }

        public Task UpdateEula(string serverName, bool eulaValue)
        {
            throw new NotImplementedException();
        }

        public Task StartServer(string serverName)
        {
            throw new NotImplementedException();
        }
    }

    public static class St
    {
        [MethodImpl(MethodImplOptions.NoInlining)]
        public static string GetCurrentMethod()
        {
            var st = new StackTrace();
            var sf = st.GetFrame(1);

            return sf.GetMethod().Name;
        }
    }
}
