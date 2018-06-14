
var socket = io.connect(window.location.hostname + ":8888");
socket.on("connected", function () {
    console.log("Connection was made!");
});

function createServer()
{
   var data={
      action:"create",
      server:{
          name:"temp",
          shortVersion:"1.8.3",
          type:"craftbukkit"
      }
      
   }
   socket.emit('ServerAction',data)
}