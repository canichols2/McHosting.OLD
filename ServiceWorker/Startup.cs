using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Business;
using McHosting.ServiceWorker.Infrastructure.VanillaManifest;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Persistence;

namespace McHosting.ServiceWorker
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddHostedService<ServerManagerWorker>();
            services.AddScoped<McServerFileDownloader>();
            services.AddScoped<VanillaManifestClient>();
            services.AddScoped<McServerInstallManager>();
            services.AddScoped<McServerPropertyManager>();
            services.AddScoped<McServerActions>();
            services.AddSingleton<ServerProcessManager>();
            services
                .AddEntityFrameworkSqlite()
                .AddDbContext<ServerContext>();
            
            services.AddHttpClient();
            services.AddCors(options => options.AddPolicy("CorsPolicy", builder =>
            {
                builder
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .WithOrigins("http://localhost:4200");
            }));
            services.AddSignalR();

        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseRouting();
            app.UseCors("CorsPolicy");
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<ServerActionsHub>("/serverAction");
            });
        }
    }
}
