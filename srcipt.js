if(!location.has){
    location.hash=Math.floor(Math.random()* 0xFFFFFF)
}

const roomHash=location.hash.substring(1)

const drone =new ScaleDrone("xXFv76pfTn9BQFW8")

const roomName='observable-' + roomHash

const configuration={

    //iceservers

    iceservers:[
        {
            urls:'stun:stun.l.google.com:19302'
        }
    ]
}

let room;
let pc;
let number=0;

// Scaledrone is opened

drone.on('open',error =>{
    if(error)
    return console.log(error)

    room=drone.subscribe(roomName)

    room.on('open',error=>{

    })

    //new Member joined the video_chat

    room.on('members',members=>{
        console.log("Let's welcome a new person")

        console.log("Toatal members in chat" + members.length)

        number=members.length-1;

        //people join at one time
        const isOfferer=members.length >=2

        //start webRTC server

        startWebRTC(isOfferer)
    })
})


//! Using Camera Permission

function startWebRTC(isOfferer){
    pc=new RTCPeerConnection(configuration)

    pc.onicecandidate= event =>{
        if(event.candidate){
            sendMessage({'candidate':event.candidate})
        }
    }

    if(isOfferer){
        pc.onnegotiationneeded=()=>{
            //onError
            pc.createOffer().then(localDescCreated).catch(onerror)

        }
    }

    pc.ontrack=event=>{
        const stream=event.streams[0]

        if(remoteVideo.srcObject || remoteVideo.srcObject.id !==stream.id){
            remoteVideo.srcObject=stream
        }
    }

    
navigator.mediaDevices.getUserMedia({
    audio:true,
    video:true
}).then(stream=>{
    localVideo.srcObject=stream
    stream.getTracks().forEach(track=>pc.addTrack(track,stream))
},onerror)

//remove the person who leave
//    room.on('member_leave',function(member){
//     remoteVideo.style.display='none'
//    })

   room.on('data',(message,client)=>{
    if(client.id==drone.ClientId){
        return 
    }
    if(message.sdp){
        pc.setRemoteRTCsessionDescription(new RTCsessionDescription(message.sdp),()=>{
            if(pc.remoteDescription.type=='offer'){
                pc.createAnswer().then(localDescCreated).catch(onerror);
            }
        },onerror)
    }else if(message.candidate){
        pc.addIceCandidate(
            new RTCIceCandidate(message.candidate),onSuccess,onerror
        )
    }
   })
}

function localDescCreated(desc){
    pc.setLocalDescription(
        desc,()=>sendMessage({'sdp' : pc.localDescription}),onerror
    );
}

//send message to another realtime user

function sendMessage(message){
    drone.publish({
        room:roomname,
        message:message
    }
    )
}