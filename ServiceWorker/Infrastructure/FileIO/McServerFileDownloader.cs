using Newtonsoft.Json;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Infrastructure.VanillaManifest;

namespace McHosting.ServiceWorker.Business
{
    public class McServerFileDownloader
    {
        private readonly McServerFileDownloaderConfig _config;
        private readonly VanillaManifestClient _vanillaManifestClient;
        private readonly HttpClient _httpClient;

        public McServerFileDownloader(McServerFileDownloaderConfig config, VanillaManifestClient vanillaManifestClient, HttpClient httpClient)
        {
            _config = config;
            _vanillaManifestClient = vanillaManifestClient;
            _httpClient = httpClient;
        }
        public McServerFileDownloader( VanillaManifestClient vanillaManifestClient, HttpClient httpClient)
        {
            //_config = config;
            _vanillaManifestClient = vanillaManifestClient;
            _httpClient = httpClient;
        }

        public async Task<byte[]> GetVanillaServerFile(string versionNumber)
        {
            var minecraft = await _vanillaManifestClient.GetMinecraftVersions();
            var mcVersion = minecraft.Versions.FirstOrDefault(x => x.id == versionNumber);
            _ = mcVersion ?? throw new ArgumentOutOfRangeException(nameof(versionNumber), versionNumber, $"Supplied version did not exist in Mojang Manifest");

            var jarURL = await _vanillaManifestClient.GetJarUrlFromMcVersion(mcVersion);

            var jarFile = await _httpClient.GetByteArrayAsync(jarURL);
            return jarFile;
        }

        public async Task<byte[]> GetForgeServerFile(string vanillaVersionNumber, string forgeVersionNumber)
        {
            var jarFile = await _httpClient.GetByteArrayAsync($"http://files.minecraftforge.net/maven/net/minecraftforge/forge/{forgeVersionNumber}/forge-{forgeVersionNumber}-universal.jar");
            return jarFile;
            throw new NotImplementedException();
        }
        public byte[] GetSpigotInstallerFile(string vanillaVersionNumber, string spigotVersionNumber)
        {
            throw new NotImplementedException();
        }
    }


    public class McServerFileDownloaderConfig
    {
        public string VanillaManifestJsonUrl { get; set; }
        public string ForgeManifestJsonUrl { get; set; }
        public string SpigotManifestJsonUrl { get; set; }
    }
}
