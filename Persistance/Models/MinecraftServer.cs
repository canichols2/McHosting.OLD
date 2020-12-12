using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Persistence.Models
{
    public class MinecraftServer
    {
        [Key]
        public int Id{get;set;}
        public string ServerName{get;set;}
        public ServerType ServerType{get;set;}
        public string MinecraftVersion{get;set;}
        public string SecondaryVersionNumber{get;set;}
        public int Port{get;set;}
        public string MinRam{get;set;}
        public string MaxRam{get;set;}
        public string WorkingFolder{get;set;}
        public string JarFile{get;set;}

    }
    public class McServer : MinecraftServer
    {
        public List<string> Usernames;
        public List<string> BannedList;
    }

    public enum ServerType
    {
        Vanilla,
        Forge,
        Spigot,
        Bedrock,
    }
}
