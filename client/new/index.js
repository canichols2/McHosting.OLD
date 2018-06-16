
var socket = io.connect(window.location.hostname + ":8888");
socket.on("connected", function () {
    console.log("Connection was made!");
});
socket.on('allServers',(data)=>{
   //Clear out all servers
   var srvContainer = $('#serverList')[0]
   srvContainer.innerHTML=""
   console.log("socket.on(allServers)",data)
   for(i in data.servers)
   {
      createServerCard(data.servers[i])
   }
})
socket.on('newServer',(data)=>{
   console.log("newServer:data:",data)
   createServerCard(data.server)
})
socket.on('statusUpdate',(data)=>{
   console.log("socket.on('statusUpdate'),",data)
   var status = $('#'+data.server._id+'-status')[0]
   status.innerHTML=data.message
   switch (data.message) {
      case 'online':
         status.className='new badge green'
         break;
      case 'offline':
         status.className='new badge red'
         break;
      default:
         status.className='new badge yelow'
         break;
   }
})
socket.on('logUpdate',(data)=>{
   var term = $('#'+data.server._id+'-term')
   var update = newElem(term,'div',['text-green'])
   update.innerHTML=data.message
})
var serverStatus = Object.freeze({
   untouched:0,
   created:1,
   downloading:2,
   downloaded:3,
   creatingSettings:4,
   runingInitial:5,
   running:6,
   online:7,
   offline:8,
})
function startServer(server) {
      socket.emit('serverAction',{
         action:'start',
         server:server
      })
}
function stopServer(server) {
   socket.emit('serverAction',{
      action:'stop',
      server:server
   })
}
function editServer(server) {
   console.log("TODO: EDITSERVER")
}
function createServer(){
   console.log($('#newServerForm'))
   
   var name = document.getElementById('name')
   var ver = document.getElementById('shortVersion')
   var type  = $('#newServerForm input[name=type]:checked')
   var min = document.getElementById('minRam')
   var max = document.getElementById('maxRam')
   var data={
      action:"create",
      server:{
         name:name.value,
         shortVersion:ver.value,
         type:type.val(),
          minMem:min.value,
          maxMem:max.value
      }
   }
   console.log("server",data.server)
   
   socket.emit('ServerAction',data)
   name.value=""
   ver.value=""
   // type.value=""
   min.value=""
   max.value=""
}
function createServerCard(server){
   var mediumSize = 'm6'
   var mediumSizeExpanded = 'm12'
   var largeSize = 'l6'
   var largeSizeExpanded = 'l12'
   var xlSize = 'xl4'
   var xlSizeExpanded = 'xl12'
   var cardSize = 'xsmall'
   var cardSizeExpanded = 'large'
   var list = $('#serverList')[0],
       container = newElem(list,"div",['col','s12','m6','xl4','all-transition']),
       card = newElem(container,"div",['card','xsmall','sticky-action','teal','all-transition'])
   card.id=server._id
   var cardContent=newElem(card,"div",['card-content']),
       cardTitle=newElem(cardContent,'span',['card-title','activator'])
   cardTitle.innerHTML = server.name
   var cardTitleBadge=newElem(cardTitle,'span',['badge'])
   cardTitleBadge.setAttribute('data-badge-caption',"")
   var cardTitleBadgeEdit=newElem(cardTitleBadge,'i',['material-icons','black-text'])
   cardTitleBadgeEdit.innerHTML='edit'
   cardTitleBadgeEdit.addEventListener("click",(event)=>{
      var server = server
      editServer(server)
      event.preventDefault();
      event.stopPropagation();
   })
   var cardTitleBadgeOnline=newElem(cardTitle,'span',['new','badge','red'])
   cardTitleBadgeOnline.setAttribute('data-badge-caption',"")
   cardTitleBadgeOnline.innerHTML='offline'
   cardTitleBadgeOnline.id=server._id+"-status"
   var cardContentP=newElem(cardContent,'p',[])
   cardContentP.innerHTML=server.description
   var cardActions=newElem(card,'div',['card-action'])
   var cardActionsStart=newElem(cardActions,'a')
   cardActionsStart.innerHTML='Start'
   cardActionsStart.addEventListener("click",function (serverParam){
      return function(){

         var server = serverParam
         console.log("start server:",server)
         startServer(server)
         event.preventDefault();
         event.stopPropagation();
      }
   }(server))
   var cardActionsStop=newElem(cardActions,'a')
   cardActionsStop.innerHTML='Stop'
   cardActionsStop.addEventListener("click",function(serverParam){
      return function(){
         var server = serverParam
         stopServer(server)
         event.preventDefault();
         event.stopPropagation();
      }
   }(server))
   var cardReveal=newElem(card,'div',['card-reveal','grey'])
   var cardRevealTitle=newElem(cardReveal,'span',['card-title','activator'])
   cardRevealTitle.innerHTML = server.name
   var term = newElem(cardReveal, "div", ["terminal", "space", "shadow"]),
       ttop = newElem(term, "div", ["top"]),
       tbtns = newElem(ttop, "div", ["btns"]),
       tred = newElem(tbtns, "div", ["circle", "red"]),
       tyellow = newElem(tbtns, "div", ["circle", "yellow"]),
       tgreen = newElem(tbtns, "div", ["circle", "green"]),
       ttitle = newElem(ttop, "div", ["title"]),
       tpre = newElem(term, "pre", ["body"])
   tpre.id=server._id+'-term'
       cardTitle.onclick=()=>{
          container.classList.remove(mediumSize)
          container.classList.remove(largeSize)
          container.classList.remove(xlSize)
          card.classList.remove(cardSize)
          container.classList.add(mediumSizeExpanded)
          container.classList.add(largeSizeExpanded)
          container.classList.add(xlSizeExpanded)
          card.classList.add(cardSizeExpanded)
       }
       cardRevealTitle.onclick=()=>{
          container.classList.remove(mediumSizeExpanded)
          container.classList.remove(largeSizeExpanded)
          container.classList.remove(xlSizeExpanded)
          card.classList.remove(cardSizeExpanded)
          container.classList.add(mediumSize)
          container.classList.add(largeSize)
          container.classList.add(xlSize)
          card.classList.add(cardSize)
       }
       
}

function newElem(parent, type, classList) {
   var elem = document.createElement(type)
   if (classList) {
       for (i in classList)
           elem.classList.add(classList[i])
   }
   parent.appendChild(elem);
   return elem;
}
$(document).ready(function(){
   $('.modal').modal();
   M.AutoInit();
        
 });