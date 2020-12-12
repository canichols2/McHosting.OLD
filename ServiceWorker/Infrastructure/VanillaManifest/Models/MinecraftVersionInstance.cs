namespace McHosting.ServiceWorker.Infrastructure.VanillaManifest
{
    public class MinecraftVersionInstance
    {
        public MinecraftVersionDownloadsInstance Downloads { get; set; }
    }
    public class MinecraftVersionDownloadsInstance
    {
        public McDownloadData client;
        public McDownloadData client_mappings;
        public McDownloadData server;
        public McDownloadData server_mappings;
    }

    public class McDownloadData
    {
        public string sha1;
        public string size;
        public string url;
    }
}