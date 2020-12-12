using System;
using Microsoft.EntityFrameworkCore;
using Persistence.Models;

namespace Persistence
{
    public class ServerContext : DbContext
    {
        public DbSet<MinecraftServer> Servers { get; set; }
        public DbSet<ConfigurationProperty> ConfigurationValues { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder options)
            => options.UseSqlite("Data Source=servers.db");
    }
}