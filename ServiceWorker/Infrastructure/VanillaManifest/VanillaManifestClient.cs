using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace McHosting.ServiceWorker.Infrastructure.VanillaManifest
{
    public class VanillaManifestClient
    {
        private readonly HttpClient _httpClient;

        public VanillaManifestClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<Uri> GetJarUrlFromMcVersion(McVersion version)
        {
            var minecraftRuntimeObject = await _httpClient.GetAsync(version.Url);
            minecraftRuntimeObject.EnsureSuccessStatusCode();
            var versions = JsonConvert.DeserializeObject<MinecraftVersionInstance>(await minecraftRuntimeObject.Content.ReadAsStringAsync());
            return new Uri(versions.Downloads.server.url);
        }
        public async Task<MinecraftVersionList> GetMinecraftVersions()
        {
            var versionsReponse = await _httpClient.GetAsync("http://launchermeta.mojang.com/mc/game/version_manifest.json");
            versionsReponse.EnsureSuccessStatusCode();
            var versions = JsonConvert.DeserializeObject<MinecraftVersionList>(await versionsReponse.Content.ReadAsStringAsync());
            return versions;
        }
    }

}
