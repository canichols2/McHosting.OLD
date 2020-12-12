using System;
using System.Collections.Generic;

namespace McHosting.ServiceWorker.Infrastructure.VanillaManifest
{
    public class MinecraftVersionList
    {
        public McLatestVersion Latest { get; set; }
        public List<McVersion> Versions { get; set; }
    }
    public class McLatestVersion
    {
        public string Release { get; set; }
        public string Snapshot { get; set; }
    }

    public class McVersion
    {
        public string id;
        public string Type;
        public string Url;
        public DateTimeOffset Time;
        public DateTimeOffset ReleaseTime;
    }

}