using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using McHosting.ServiceWorker.Model;
using Newtonsoft.Json;

namespace McHosting.ServiceWorker.Business
{
    public class McServerPropertyManager
    {
        public McServerPropertyManager()
        {
            
        }

        //TODO: Change these to be better
        public void WriteBannedIPs() 
        {
            throw new NotImplementedException();
        }
        public void WriteBannedPlayers() 
        {
            throw new NotImplementedException();
        }

        //TODO: Have this retrieve defaults from DB.
        #region Default Server Properties
        public IList<ServerProperty> GetDefaultServerProperties()
        {
            return new List<ServerProperty>()
            {
                new ServerProperty(){Key = "spawn-protection",Value = "16",IsBoolean = false},
                new ServerProperty(){Key = "max-tick-time",Value = "60000"},
                new ServerProperty(){Key = "query.port",Value = "25565"},
                new ServerProperty(){Key = "generator-settings",Value = ""},
                new ServerProperty(){Key = "sync-chunk-writes",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "force-gamemode",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "allow-nether",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "enforce-whitelist",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "gamemode",Value = "survival"},
                new ServerProperty(){Key = "broadcast-console-to-ops",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "enable-query",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "player-idle-timeout",Value = "0"},
                new ServerProperty(){Key = "text-filtering-config",Value = ""},
                new ServerProperty(){Key = "difficulty",Value = "easy"},
                new ServerProperty(){Key = "spawn-monsters",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "broadcast-rcon-to-ops",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "op-permission-level",Value = "4"},
                new ServerProperty(){Key = "pvp",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "entity-broadcast-range-percentage",Value = "100"},
                new ServerProperty(){Key = "snooper-enabled",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "level-type",Value = "default"},
                new ServerProperty(){Key = "hardcore",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "enable-status",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "enable-command-block",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "max-players",Value = "20"},
                new ServerProperty(){Key = "network-compression-threshold",Value = "256"},
                new ServerProperty(){Key = "resource-pack-sha1",Value = ""},
                new ServerProperty(){Key = "max-world-size",Value = "29999984"},
                new ServerProperty(){Key = "function-permission-level",Value = "2"},
                new ServerProperty(){Key = "rcon.port",Value = "25575"},
                new ServerProperty(){Key = "server-port",Value = "25565"},
                new ServerProperty(){Key = "debug",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "server-ip",Value = ""},
                new ServerProperty(){Key = "spawn-npcs",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "allow-flight",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "level-name",Value = "world"},
                new ServerProperty(){Key = "view-distance",Value = "10"},
                new ServerProperty(){Key = "resource-pack",Value = ""},
                new ServerProperty(){Key = "spawn-animals",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "white-list",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "rcon.password",Value = ""},
                new ServerProperty(){Key = "generate-structures",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "online-mode",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "max-build-height",Value = "256"},
                new ServerProperty(){Key = "level-seed",Value = ""},
                new ServerProperty(){Key = "prevent-proxy-connections",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "use-native-transport",Value = "true",IsBoolean = true},
                new ServerProperty(){Key = "enable-jmx-monitoring",Value = "false",IsBoolean = true},
                new ServerProperty(){Key = "motd",Value = "A Minecraft Server"},
                new ServerProperty(){Key = "rate-limit",Value = "0"},
                new ServerProperty(){Key = "enable-rcon",Value = "false",IsBoolean = true},
            };
        }

        #endregion

        public async Task<IList<ServerProperty>> GetServerPropertiesForServerAsync(string mcServerWorkingFolder)
        {
            string serverPropertiesFileLocation = $@"{mcServerWorkingFolder}\server.properties";
            var serverPropertiesFromFile = await File.ReadAllTextAsync(serverPropertiesFileLocation);
            Regex propertyRegex = new Regex("^(?<key>.*)=(?<value>.*)$");
            var matches = propertyRegex.Matches(serverPropertiesFromFile);

            var properties = new List<ServerProperty>();
            foreach (Match propertyMatch in matches)
            {
                var key = propertyMatch.Groups["key"].Value;
                var value = propertyMatch.Groups["value"].Value;

                properties.Add(new ServerProperty()
                    {
                        Key    = key,
                        Value = value,
                        IsBoolean = bool.TryParse(value,out bool boolValue)
                }
                );
            }

            return properties;
        }
        public async Task WriteServerProperties(string mcServerWorkingFolder, IList<ServerProperty> mcServerServerProperties, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            List<string> serverProperties = mcServerServerProperties.Select(prop => $"{prop.Key}={prop.Value}").ToList();
            createProgress?.Report(new ActionProgressUpdate { Message = $"Beginning write of {serverProperties.Count} Server Properties", PercentDone = 0.1 });
            await File.WriteAllLinesAsync(@$"{mcServerWorkingFolder}\server.properties", serverProperties, cancellationToken);
            createProgress?.Report(new ActionProgressUpdate { Message = $"finished write of Server Properties", PercentDone = 1 });
        }

        public async Task<bool> GetEulaValue(string mcServerWorkingFolder)
        {
            try
            {
                string eulaFileLocation = $@"{mcServerWorkingFolder}\eula.txt";
                var eulaTextFromFile = await File.ReadAllTextAsync(eulaFileLocation);
                Regex propertyRegex = new Regex("^(?<key>eula)=(?<value>.*)$");
                var match = propertyRegex.Match(eulaTextFromFile);
                var value = match.Groups["value"].Value;

                if (bool.TryParse(value, out bool isEulaAccepted))
                {
                    return isEulaAccepted;
                }

                return false;
            }
            catch (FileNotFoundException)
            {
                return false;
            }

        }
        public async Task WriteEula(string mcServerWorkingFolder, bool value, IProgress<ActionProgressUpdate> createProgress = default, CancellationToken cancellationToken = default)
        {
            createProgress?.Report(new ActionProgressUpdate{ Message = "Beginning write of EULA",PercentDone = 0});

            await File.WriteAllTextAsync($@"{mcServerWorkingFolder}\eula.txt", $"eula={value.ToString().ToLower()}", cancellationToken);

            createProgress?.Report(new ActionProgressUpdate{ Message = "Finished writing EULA",PercentDone = 1});
        }

        //? OPs file structure changes in recent versions. now it's a json object and not individual usernames.
        //public async Task<List<string>> GetOps(string mcServerWorkingFolder)
        //{
        //    string opFileLocation = $@"{mcServerWorkingFolder}\ops.json";
        //    var opsListFromFile = await File.ReadAllTextAsync(opFileLocation);
        //    var opsList = JsonConvert.DeserializeObject<List<string>>(opsListFromFile);
        //    return opsList;
        //}

        //public async Task WriteOps(string mcServerWorkingFolder, List<string> opsList)
        //{
        //    await File.WriteAllTextAsync($@"{mcServerWorkingFolder}\ops.json", JsonConvert.SerializeObject(opsList));
        //}
    }
}