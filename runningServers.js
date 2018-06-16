var io               = require("./singleton").io,
    fs               = require("./singleton").fs
var serversDB        = require("./database.js").serversDB
var hostSettingsDB   = require("./database.js").hostSettingsDB
var newMCServer      = require("./NewMCServer").all
var writeServerProp  = require("./NewMCServer").createServerProp
var serverStatus     = require("./common").serverStatus
var spawn            = require("child_process").spawn


