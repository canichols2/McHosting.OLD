
var socket = io.connect(window.location.hostname + ":8888");
socket.on("connected", function () {
    console.log("Connection was made!");
});
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
      
}
function stopServer(server) {
      
}
function editServer(server) {
      
}
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
function createServerCard(server){
   var mediumSize = 'm6'
   var mediumSizeExpanded = 'm12'
   var largeSize = 'l6'
   var largeSizeExpanded = 'l12'
   var xlSize = 'xl4'
   var xlSizeExpanded = 'xl12'
   var cardSize = 'small'
   var cardSizeExpanded = 'large'
   var list = $('#serverList')[0],
       container = newElem(list,"div",['col','s12','m6','xl4','all-transition']),
       card = newElem(container,"div",['card','sticky-action','teal','all-transition'])
   card.id=server._id
   var cardContent=newElem(card,"div",['card-content']),
       cardTitle=newElem(cardContent,'span',['card-title','activator'])
   cardTitle.innerHTML = server.name
   var cardTitleBadge=newElem(cardtitle,'span',['badge'])
   cardTitleBadge.setAttribute('data-badge-caption',"")
   var cardTitleBadgeEdit=newElem(cardTitleBadge,'i',['material-icons','black-text'])
   cardTitleBadgeEdit.innerHTML='edit'
   cardTitleBadgeEdit.addEventListener("click",(event)=>{
      var server = server
      editServer(server)
      event.preventDefault();
      event.stopPropagation();
   })
   var cardTitleBadgeOnline=newElem(cardtitle,'span',['new','badge','green'])
   cardTitleBadgeOnline.setAttribute('data-badge-caption',"")
   cardTitleBadgeOnline.innerHTML='online'
   cardTitleBadgeOnline.id=server._id+"-status"
   var cardContentP=newElem(cardContent,'p',[])
   cardContentP.innerHTML=server.description
   var cardActions=newElem(card,'div',['card-action'])
   var cardActionsStart=newElem(cardActions,'a')
   cardActionsStart.addEventListener("click",(event)=>{
      var server = server
      startServer(server)
      event.preventDefault();
      event.stopPropagation();
   })
   var cardActionsStop=newElem(cardActions,'a')
   cardActionsStop.addEventListener("click",(event)=>{
      var server = server
      stopServer(server)
      event.preventDefault();
      event.stopPropagation();
   })
   var cardReveal=newElem(card,'div',['card-reveal','grey'])
   var cardRevealTitle=newElem(cardReveal,'span',['card-title','activator']),
       term = newElem(cardReveal, "div", ["terminal", "space", "shadow"]),
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